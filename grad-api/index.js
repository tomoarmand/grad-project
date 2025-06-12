import express from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());


// Connect to MongoDB Atlas
const uri = process.env.MONGO_KEY;
console.log("Connecting to DB with URI:", process.env.MONGO_KEY);
mongoose.connect(uri);

mongoose.connection.on('connected', () => {
  console.log('✅ Database connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

app.use('/users', userRoutes);
app.use('/exercises', exerciseRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});