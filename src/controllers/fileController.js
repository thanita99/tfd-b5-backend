import FileModel from '../models/fileModel.js'
import asyncHandler from 'express-async-handler'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import path from 'path';

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
})

export const createFileS3 = asyncHandler(async (req, res) => {
    const file = req.file
    if (!file) {
        return res.status(400).json({ error: "No file uploaded!" })
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `uploads/${file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)}`,
        Body: file.buffer,
        ContentType: file.mimetype
    }
    const command = new PutObjectCommand(params)

    // Remove buffer from req.file and create new variable
    const { buffer, ...rest } = req.file;
    const newFile = rest;

    const url = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`

    await FileModel.create({
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        url: url
    })

    await s3.send(command)

    return res.json({
        message: "Upload successful",
        key: params.key,
        url: url,
        file: newFile
    })
})

export const createFileLocalSingle = asyncHandler((req, res) => {
    console.log(req.file);  // File information
    console.log(req.body);  // Other form fields

    res.json({
        message: 'File uploaded successfully',
        file: req.file
    });
})