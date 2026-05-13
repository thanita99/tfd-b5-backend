import mongoose from 'mongoose';


const postSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

const PostModel = mongoose.model('Post', postSchema);

export default PostModel;