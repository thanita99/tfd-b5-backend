import { validationResult, body, query } from 'express-validator'
import UserModel from '../models/userModel.js';
import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'

import { Strategy, ExtractJwt } from 'passport-jwt'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
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

export const authroize = (...roles) => {
    return (req, res, next) => {
        console.log(req.user)
        if (!roles.includes(req.user.role)) {
            throw Error(`Role '${req.user.role}' is not authorized to access this route`)
        }
        next();
    };
}

export const checkOwnership = (Model) =>
    asyncHandler(async (req, res, next) => {
        const resource = await Model.findById(req.params.id);
        if (!resource) throw Error('Resource not found')
        // console.log(resource.author.toString())
        // console.log(req.user)

        const isOwner = resource.author.toString() === req.user.sub.toString();
        const isAdmin = req.user.role === 'admin';

        if (!(isOwner || isAdmin)) {
            throw Error('You do not have permission to modify this resource')
        }

        req.resource = resource; // Attach so controller doesn't re-fetch
        next();
    });


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

export const jwtAuthenticate = new Strategy({
    secretOrKey: process.env.JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    issuer: 'TFDServer'
}, (payload, done) => {
    done(null, payload)
})

export const googleStrategy = new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // 1. Try to find by googleId
        let user = await UserModel.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // 2. Try to link to an existing account with the same email
        const email = profile.emails?.[0]?.value;
        if (email) {
            user = await UserModel.findOne({ email });
            if (user) {
                user.googleId = profile.id;
                if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
                await user.save({ validateBeforeSave: false });
                return done(null, user);
            }
        }

        console.log(profile)

        // 3. Create a new user
        user = await UserModel.create({
            googleId: profile.id,
            firstName: profile.displayName,
            email,
            avatar: profile.photos?.[0]?.value,
        });

        done(null, user);
    } catch (err) {
        done(err, null);
    }
})

export const githubStrategy = new GitHubStrategy(
    {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await UserModel.findOne({ githubId: profile.id });
            if (user) return done(null, user);

            const email = profile.emails?.[0]?.value;
            if (email) {
                user = await UserModel.findOne({ email });
                if (user) {
                    user.githubId = profile.id;
                    if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
                    await user.save({ validateBeforeSave: false });
                    return done(null, user);
                }
            }

            user = await UserModel.create({
                githubId: profile.id,
                name: profile.displayName || profile.username,
                email,
                avatar: profile.photos?.[0]?.value,
            });

            done(null, user);
        } catch (err) {
            done(err, null);
        }
    }
)

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