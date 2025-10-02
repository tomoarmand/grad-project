import express from 'express';
import Folder from '../models/Folder.js';
import Exercise from '../models/Exercise.js';

const router = express.Router();

// POST folder
router.post('/', async (req, res) => {
  const { name, teacherId, instructions } = req.body;
  const folder = await Folder.create({ 
    name, 
    teacherId, 
    instructions: instructions || '' 
  });
  res.json(folder);
});

// GET folders by teacherId
router.get('/:teacherId', async (req, res) => {
  const folders = await Folder.find({ teacherId: req.params.teacherId });
  res.json(folders);
});

// DELETE folder AND its exercises
router.delete('/:id', async (req, res) => {
  try {
    const deletedFolder = await Folder.findByIdAndDelete(req.params.id);
    if (!deletedFolder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Delete all exercises in this folder
    await Exercise.deleteMany({ folderId: req.params.id });

    res.json({ success: true, message: 'Folder and exercises deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while deleting folder' });
  }
});

// PUT rename folder and update instructions
router.put('/:id', async (req, res) => {
  const { name, instructions } = req.body;
  try {
    const updateData = { name };
    // Only update instructions if it's provided in the request
    if (instructions !== undefined) {
      updateData.instructions = instructions;
    }
    
    const updated = await Folder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Folder not found' });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while updating folder' });
  }
});

export default router;