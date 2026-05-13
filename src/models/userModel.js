import mongoose from 'mongoose';

const ageValidator = (value) => {
    return value >= 18 && value <= 100;
}

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: false,
    },
    username: String,
    email: String,
    dateOfBirth: {
        type: Date,
        required: false
    },
    // profile: {
    //     type: mongoose.Types.ObjectId,
    //     required: true,
    //     ref: 'File'
    // },
    refreshToken: {
        type: String
    },
    age: {
        type: Number,
        validate: {
            validator: ageValidator,
            message: 'Age must be between 18 and 100'
        },
        default: 18           // Default value
    },
    googleId: {
        type: String,
        sparse: true,   // Allows multiple null values with a unique index
    },
    githubId: {
        type: String,
        sparse: true,
    },
    avatar: {
        type: String,
    },
    password: {
        type: String,
        // required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'editor', 'admin'],
        default: 'user',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

userSchema.virtual('posts', {
    ref: 'Post',           // Model to query
    localField: '_id',     // Author's _id
    foreignField: 'author' // Book's author field
});

userSchema.virtual('postCount', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'author',
    count: true  // Just count, don't return documents
});

const UserModel = mongoose.model('User', userSchema);

export default UserModel;