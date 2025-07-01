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

export default router;