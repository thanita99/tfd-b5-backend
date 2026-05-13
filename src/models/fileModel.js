import mongoose from 'mongoose';


const fileSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
    },
    filename: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

const FileModel = mongoose.model('File', fileSchema);

export default FileModel;