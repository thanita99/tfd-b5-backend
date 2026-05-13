import express from 'express';
import { githubCallBack, googleCallBack, login, logout, refresh } from '../controllers/authController.js';
import passport from 'passport';
const authRouter = express.Router();

authRouter.post('/login', login);

authRouter.post('/refresh', refresh);

authRouter.post('/logout', logout);

authRouter.get('/google', passport.authenticate('google', { session: false }));

authRouter.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), googleCallBack)

authRouter.get('/github', passport.authenticate('github', { session: false }));

authRouter.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/login' }), githubCallBack)

authRouter.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
    return res.json({
        success: true,
        user: req.user
    })
})

export default authRouter;