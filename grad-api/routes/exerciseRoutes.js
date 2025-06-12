import express from 'express';
import Exercise from '../models/Exercise.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const exercises = await Exercise.find();
  res.json(exercises);
});

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const filter = userId ? { userId } : {};
  const exercises = await Exercise.find(filter);
  res.json(exercises);
});

router.post('/', async (req, res) => {
  const { audioData, correctAnswer, userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const exercise = new Exercise({ audioData, correctAnswer, userId });
  await exercise.save();
  res.json(exercise);
});

router.get('/:id', async (req, res) => {
  const exercise = await Exercise.findById(req.params.id);
  res.json(exercise);
});

router.delete('/:id', async (req, res) => {
  const deletedExercise = await Exercise.findByIdAndDelete(req.params.id);
  if (!deletedExercise) return res.status(404).json({ error: 'Exercise not found' });
  const remainingExercises = await Exercise.find();
  res.json(remainingExercises);
});

export default router;