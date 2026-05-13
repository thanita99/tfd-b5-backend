import { validationResult, body, query } from 'express-validator'
import UserModel from '../models/userModel.js';
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit';

export const validateResult = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));

        return res.status(400).json({
            success: false,
            errors: formattedErrors
        });
    }

    next();
};
export const createUserValidator = [
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('firstName is required')
        .isAlpha('en-US')
        .withMessage('Only English alphanets allowed')
    ,
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('lastName is required')
        .isAlpha('en-US')
        .withMessage('Only English alphanets allowed'),
    body('age')
        .isInt({ min: 18, max: 100 })
        .withMessage('Age must be between 18 and 100'),
    body('username')
        .trim()
        .notEmpty()
        .withMessage('username is required')
        .toLowerCase(),
    body('dateOfBirth')
        .isISO8601()
        .toDate()
        .withMessage('Invalid date format')
        .custom((date) => {
            const age = Math.floor((new Date() - date) / 31557600000);
            if (age < 18) {
                throw new Error('Must be at least 18 years old');
            }
            return true;
        }),
    body('email')
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage("Please provided valid email address!")
        .custom(async (email) => {
            const user = await UserModel.findOne({ email });
            if (user) {
                throw new Error('Email already exists');
            }
        }),
    body('profile')
        .trim()
        .isMongoId()
        .withMessage("File must be mongoID"),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('password is required')
        .isLength({ min: 8 })
        .withMessage('Minimum 8 characters')
    ,
    validateResult
]

export const createPostValidator = [
    body('text')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isString(),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 12 })
        .withMessage("title chareacters count must be 12 minimum!"),
    body('author')
        .trim()
        .notEmpty()
        .withMessage('Author is required')
        .isMongoId()
        .withMessage("Author must be a valid Mongodb ID"),
    validateResult
]

export const getPostValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .toInt(),
    validateResult
]

export const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Invalid JWT"
        })
    }
    const token = authHeader.split(' ')[1];
    // Verify Token
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (!payload) {
        return res.status(401).json({
            success: false,
            message: "Invalid JWT"
        })
    }
    // For implementing authorization
    req.user = payload
    next()

}

// General API limiter — 60 requests per 5 minutes
export const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 60,
    standardHeaders: true,     // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,                   // Only 10 login attempts per 15 minutes
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes',
    },
});