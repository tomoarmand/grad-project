import express from 'express';
import Folder from '../models/Folder.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { name, teacherId } = req.body;
    const folder = await Folder.create({ name, teacherId });
    res.json(folder);
})

router.get('/:teacherId', async (req, res) => {
    const folders = await Folder.find({ teacherId: req.params.teacherId });
    res.json(folders);
})

router.delete('/:id', async (req, res) => {
    try {
      const deleted = await Folder.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Folder not found' });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error while deleting folder' });
    }
  });
  
  router.put('/:id', async (req, res) => {
    const { name } = req.body;
    try {
      const updated = await Folder.findByIdAndUpdate(
        req.params.id,
        { name },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Folder not found' });
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error while renaming folder' });
    }
  });

export default router;