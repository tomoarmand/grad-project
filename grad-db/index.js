import express from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());


// Connect to MongoDB Atlas
const uri = process.env.MONGO_KEY;
mongoose.connect(uri);

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

app.listen(3000, () => {
  console.log('Server running on port 3000');
});