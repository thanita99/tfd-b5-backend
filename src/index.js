// config/env.js
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors'
// import hpp from 'hpp';
import bodyParser from 'body-parser';
// Determine which .env file to load
console.log(`Current NODE_ENV: ${process.env.NODE_ENV}`);
const envFile = `.env.${process.env.NODE_ENV || 'dev'}`;
const envPath = path.resolve(process.cwd(), envFile);

dotenv.config({ path: envPath });

// Fallback to .env if environment-specific file doesn't exist
if (!fs.existsSync(envPath)) {
    dotenv.config();
}

import express from 'express';
import router from './routes/index.js';
const app = express();
import connectDB from './config/database.js';
import { version } from 'os';

connectDB()
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));
app.use(bodyParser.json({ limit: '10kb' }));
// app.use(express.json());


app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
    console.log("Hello")
    res.status(200).json({
        message: `Server is healthy from ${process.env.NODE_ENV} environment`,
        version: '1.0.8(fixed)',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// app.use(hpp({
//     whitelist: ['filter', 'fields'], // Allow intentional arrays for these params
// }));
app.use('/api', router)


app.use((err, req, res, next) => {
    res.status(500).json({
        success: false,
        error: err.message
    });
});

app.listen(3000, () => {
    console.log('Server W10 running on port 3000');
});