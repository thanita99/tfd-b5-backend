import express from 'express';
import { createFileLocalSingle, createFileS3 } from '../controllers/fileController.js';
import multer from 'multer';
const fileRouter = express.Router();


const fileFilter = (req, file, cb) => {
    // Allowed extensions
    const allowedTypes = /jpeg|jpg|png|gif|webp/;

    // Check extension
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    // Check mime type
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
    }
};

const uploadS3 = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed'));
        }
    }
});

const uploads = multer({
    storage: new multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024  // 5MB limit,
    },
    fileFilter: fileFilter
})


fileRouter.post('/upload-s3', uploadS3.single('file'), createFileS3);
fileRouter.post('/upload-local-single', uploads.single('file'), createFileLocalSingle);


export default fileRouter;