import asyncHandler from 'express-async-handler'
import UserModel from '../models/userModel.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'

const generateToken = (userId, payload, secret, expire) => {
    console.log("Role")
    console.log({ sub: userId, ...payload })
    return jwt.sign({ sub: userId, ...payload }, secret, {
        issuer: 'TFDServer',
        expiresIn: expire
    })
}

const generateRefreshToken = (userId, secret, expire) => {

    return jwt.sign({ sub: userId }, secret, {
        issuer: 'TFDServer',
        expiresIn: expire
    })
}

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    // Find user in system
    const user = await UserModel.findOne({ email: email }).select('email username password role')

    // console.log(user)

    if (!user) {
        return res.status(400).json({
            success: "false",
            message: "User or password incorrect"
        })
    }
    // User exist, start comparing password
    // Comparing (during login)
    const isMatch = await bcrypt.compare(password, user.password);
    // console.log("Hello")
    if (!isMatch) {
        return res.status(400).json({
            success: "false",
            message: "User or password incorrect"
        })
    }
    // match! Let's sign JWT Token and send back to user
    const token = generateToken(
        user._id, {
        role: user.role,
        email: user.email,
        username: user.username
    }
        , process.env.JWT_SECRET, process.env.JWT_EXPIRE_IN)
    const refreshToken = generateRefreshToken(user._id, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRE_IN)
    // const token = jwt.sign(
    //     {
    //         sub: user._id,
    //         email: user.email
    //     }, process.env.JWT_SECRET,
    //     {
    //         issuer: 'TFDServer',
    //         expiresIn: process.env.JWT_EXPIRE_IN
    //     })
    // const refreshToken = jwt.sign(
    //     {
    //         sub: user._id,
    //         email: user.email
    //     }, process.env.JWT_REFRESH_SECRET,
    //     {
    //         issuer: 'TFDServer',
    //         expiresIn: process.env.JWT_REFRESH_EXPIRE_IN
    //     })

    user.refreshToken = refreshToken
    await user.save()

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'prod',
        // sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    const { password: pwd, ...userWithoutPassword } = user.toObject();

    return res.json({ token, user: userWithoutPassword })
})

export const refresh = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken
    console.log("Refresh token: ", token)
    if (!token) {
        throw Error('No refresh token!')
    }
    const decode = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const user = await UserModel.findById(decode.sub).select('refreshToken');
    console.log(user)

    if (!user || user.refreshToken !== token) {
        throw Error('Invalid refresh token!')
    }

    const accessToken = generateRefreshToken(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRE_IN)
    res.json({ success: true, accessToken })
})

export const logout = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken
    if (!token) {
        throw Error('No refresh token!')
    }
    const user = await UserModel.findOne({ refreshToken: token }).select('refreshToken')
    if (!user) {
        throw Error('No user found!')
    }
    user.refreshToken = undefined
    await user.save()

    res.clearCookie('refreshToken')
    res.json({ success: false, message: 'Logout successfully' })
})

export const googleCallBack = asyncHandler(async (req, res) => {
    const user = req.user;
    const accessToken = generateToken(user._id, {
        role: user.role,
        email: user.email,
        username: user.username
    }, process.env.JWT_SECRET, process.env.JWT_EXPIRE_IN);
    const refreshToken = generateRefreshToken(user._id, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRE_IN);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with access token in query string
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
    // console.log(`${frontendUrl}?token=${accessToken}`);
    res.redirect(`${frontendUrl}/login?token=${accessToken}`);
})

export const githubCallBack = asyncHandler(async (req, res) => {

    const user = req.user;
    const accessToken = generateToken(user._id, {
        role: user.role,
        email: user.email,
        username: user.username
    }, process.env.JWT_SECRET, process.env.JWT_EXPIRE_IN);
    const refreshToken = generateRefreshToken(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRE_IN);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with access token in query string
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
    res.redirect(`${frontendUrl}/index.html?token=${accessToken}`);
})