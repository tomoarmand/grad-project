import express from 'express';
import mongoose from 'mongoose';
import Exercise from '../models/Exercise.js';

const router = express.Router();

// Get all exercises with optional filters
router.get('/', async (req, res) => {
  try {
    const { userId, studentId } = req.query;
    const filter = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      filter.studentIds = new mongoose.Types.ObjectId(studentId);
    }

    const exercises = await Exercise.find(filter);
    res.json(exercises);
  } catch (err) {
    console.error('GET /exercises error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new exercise
router.post('/', async (req, res) => {
  try {
    const { audioData, correctAnswer, userId, studentId, folderId } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId required' });

    const exercise = new Exercise({
      audioData,
      correctAnswer,
      userId: new mongoose.Types.ObjectId(userId),
      studentIds: studentId ? [new mongoose.Types.ObjectId(studentId)] : [],
      folderId: folderId && mongoose.Types.ObjectId.isValid(folderId) ? new mongoose.Types.ObjectId(folderId) : null,
    });

    await exercise.save();
    res.json(exercise);
  } catch (err) {
    console.error('POST /exercises error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get exercises for a specific folder
router.get('/folder/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    console.log('API hit: get exercises for folder', folderId);

    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ error: 'Invalid folderId' });
    }

    const exercises = await Exercise.find({ folderId });
    res.json(exercises);
  } catch (err) {
    console.error('GET /folder/:folderId error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single exercise
router.get('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Not found' });
    res.json(exercise);
  } catch (err) {
    console.error('GET /:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete an exercise
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.query;

    const deletedExercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!deletedExercise) return res.status(404).json({ error: 'Exercise not found' });

    const filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    const remainingExercises = await Exercise.find(filter);
    res.json(remainingExercises);
  } catch (err) {
    console.error('DELETE /:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;