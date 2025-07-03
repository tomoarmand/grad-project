import express from 'express';
import Exercise from '../models/Exercise.js';
import User from '../models/User.js';

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

router.get('/students/by-teacher/:teacherId', async (req, res) => {
        const { teacherId } = req.params;

        // Find all exercises created by this teacher
    const exercises = await Exercise.find({ userId: teacherId }).select('studentIds');

    // Extract unique student IDs
    const studentIdsSet = new Set();
    exercises.forEach(ex => {
        ex.studentIds.forEach(id => studentIdsSet.add(id.toString()));
    })

    const uniqueStudentIds = [...studentIdsSet];

    // Fetch student user data
    const students = await User.find({
      _id: { $in: uniqueStudentIds },
      role: 'student'
    });

    res.json(students);


})

router.post('/unassign', async (req, res) => {
    const { exerciseId, studentId } = req.body;
  
    const updated = await Exercise.findByIdAndUpdate(
      exerciseId,
      { $pull: { studentIds: studentId } },
      { new: true }
    );
  
    res.json(updated);
  });

export default router