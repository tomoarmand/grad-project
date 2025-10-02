import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
    name: String,
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Add assigned students for this folder
    assignedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    instructions: {
        type: String,
        default: '',
        maxlength: 500
    }
});

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;