import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const users = await User.find();
    res.json(users);
  });

router.post('/', async (req, res) => {
    const { fullNAme, email, role = 'teacher' } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exist '});
    const user = await User.create({ fullName, email, role })
      res.json(user);
    });
  
router.post('/login', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user);
  });
  
  router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
  });
  
  export default router;
