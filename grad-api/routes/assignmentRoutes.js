import express from 'express';
import Exercise from '../models/Exercise.js';

const router = express.Router();

// Assign exercise(s) to multiple students
router.post('/assign', async (req, res) => {
    const { exerciseIds, studentIds } = req.body;

    const updated = await Exercise.updateMany(
        { _id: { $in: exerciseIds } },
        { $addToSet: { studentIds: { $each: studentIds } } }
    );

    res.json(updated);
});

export default router