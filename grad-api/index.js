import express from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());


// Connect to MongoDB Atlas
const uri = process.env.MONGO_KEY;
console.log("Connecting to DB with URI:", process.env.MONGO_KEY);
mongoose.connect(uri);

mongoose.connection.on('connected', () => {
  console.log('✅ Database connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Define Student schema
const exerciseSchema = new mongoose.Schema({
  audioData: String,
  correctAnswer: String,
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

// API Endpoints
app.get('/exercises', async (req, res) => {
  const exercises = await Exercise.find();
  res.json(exercises);
});

app.post('/exercises', async (req, res) => {
  const exercises = new Exercise(req.body);
  await exercises.save();
  res.json(exercises);
});

app.get('/exercises/:id', async (req, res) => {
  const exercise = await Exercise.findById(req.params.id);
  res.json(exercise);
});

app.delete('/exercises/:id', async (req, res) => {
    const deletedExercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!deletedExercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

    const remainingExercises = await Exercise.find();
    res.json(remainingExercises);
})


// Define User schema
const userSchema = new mongoose.Schema({
  email: String,
  fullName: String,
  userType: String,
});


const User = mongoose.model('User', userSchema);

app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const users = new User(req.body);
  await users.save();
  res.json(users);
});

app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});