import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true },
    role: { type: String, enum: ['teacher', 'student'], default: 'teacher' },
  });
  
const User = mongoose.model('User', userSchema);
export default User;