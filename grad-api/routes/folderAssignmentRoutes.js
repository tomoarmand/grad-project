import express from 'express';
import Folder from '../models/Folder.js';
import User from '../models/User.js';

const router = express.Router();

// Assign folder(s) to multiple students
router.post('/assign', async (req, res) => {
    try {
        const { folderIds, studentIds } = req.body;

        // Validation
        if (!folderIds || !Array.isArray(folderIds) || folderIds.length === 0) {
            return res.status(400).json({ error: 'folderIds must be a non-empty array' });
        }

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: 'studentIds must be a non-empty array' });
        }

        // Add students to folders
        await Folder.updateMany(
            { _id: { $in: folderIds } },
            { $addToSet: { assignedStudents: { $each: studentIds } } }
        );

        // Add folders to students
        await User.updateMany(
            { _id: { $in: studentIds } },
            { $addToSet: { assignedFolders: { $each: folderIds } } }
        );

        res.json({ success: true, message: 'Folders assigned successfully' });
    } catch (error) {
        console.error('Error assigning folders:', error);
        res.status(500).json({ error: 'Failed to assign folders' });
    }
});

// Get students with folder assignments for a teacher
router.get('/students/by-teacher/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;

        // Find all folders created by this teacher
        const folders = await Folder.find({ teacherId }).select('assignedStudents');

        // Extract unique student IDs
        const studentIdsSet = new Set();
        folders.forEach(folder => {
            folder.assignedStudents.forEach(id => studentIdsSet.add(id.toString()));
        });

        const uniqueStudentIds = [...studentIdsSet];

        // Fetch student user data
        const students = await User.find({
            _id: { $in: uniqueStudentIds },
            role: 'student'
        }).select('fullName email assignedFolders');

        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Get assigned folders for a student
router.get('/student/:studentId/folders', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await User.findById(studentId).populate('assignedFolders');
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(student.assignedFolders);
    } catch (error) {
        console.error('Error fetching student folders:', error);
        res.status(500).json({ error: 'Failed to fetch student folders' });
    }
});

// Unassign folder from student
router.post('/unassign', async (req, res) => {
    try {
        const { folderId, studentId } = req.body;

        // Validation
        if (!folderId || !studentId) {
            return res.status(400).json({ error: 'folderId and studentId are required' });
        }

        // Remove student from folder
        await Folder.findByIdAndUpdate(
            folderId,
            { $pull: { assignedStudents: studentId } },
            { new: true }
        );

        // Remove folder from student
        await User.findByIdAndUpdate(
            studentId,
            { $pull: { assignedFolders: folderId } },
            { new: true }
        );

        res.json({ success: true, message: 'Folder unassigned successfully' });
    } catch (error) {
        console.error('Error unassigning folder:', error);
        res.status(500).json({ error: 'Failed to unassign folder' });
    }
});

export default router;