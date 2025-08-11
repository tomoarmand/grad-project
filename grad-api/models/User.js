import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [50, 'Full name cannot exceed 50 characters'],
    match: [/^[a-zA-ZÀ-ÿ\s'-]{2,50}$/, 'Full name contains invalid characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [100, 'Email cannot exceed 100 characters'],
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email']
  },
  role: { 
    type: String, 
    enum: {
      values: ['teacher', 'student'],
      message: 'Role must be either teacher or student'
    },
    default: 'student'
  },
  // 🔒 SECURE PIN FIELD FOR TEACHERS
  pin: {
    type: String,
    required: function() {
      return this.role === 'teacher';
    },
    validate: {
      validator: function(pin) {
        if (this.role !== 'teacher') return true;
        return pin && pin.length >= 60; // bcrypt hashes are ~60 characters
      },
      message: 'PIN is required for teachers'
    }
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// 🔒 SECURE PIN METHODS
userSchema.methods.hashPin = async function(plainPin) {
  const saltRounds = 12;
  this.pin = await bcrypt.hash(plainPin, saltRounds);
};

userSchema.methods.comparePin = async function(plainPin) {
  if (!this.pin) return false;
  return await bcrypt.compare(plainPin, this.pin);
};

// Account locking methods
userSchema.methods.incLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.pin;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

const User = mongoose.model('User', userSchema);
export default User;