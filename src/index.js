import 'dotenv/config'
import express from 'express';
import router from './routes/index.js';
const app = express();

import connectDB from './config/database.js';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import cors from 'cors';
import { githubStrategy, googleStrategy, jwtAuthenticate } from './middlewares/index.js';

connectDB()

app.use(express.json());
app.use(cookieParser());
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));

passport.use(googleStrategy)
passport.use(githubStrategy)
passport.use(jwtAuthenticate)
app.use('/api', router)

app.use((err, req, res, next) => {
    res.status(500).json({
        success: false,
        error: err.message
    });
});

app.listen(3000, () => {
    console.log('Server W9 Passport running on port 3000');
});