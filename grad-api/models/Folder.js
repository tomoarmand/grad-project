import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
    name: String,
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;