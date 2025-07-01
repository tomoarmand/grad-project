import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
    audioData: String,
    correctAnswer: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  });
  
const Exercise = mongoose.model('Exercise', exerciseSchema);
export default Exercise;