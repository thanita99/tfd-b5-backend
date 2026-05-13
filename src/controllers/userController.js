
import UserModel from "../models/userModel.js";
import asyncHandler from 'express-async-handler'
import bcrypt from 'bcryptjs';

export const getAllUsers = asyncHandler(async (req, res) => {
    const query = {}

    const sortBy = req.query.sort
        ? req.query.sort.split(' ').join(' ')  // "category -price name"
        : '-createdAt';  // Default

    console.log(sortBy)

    const minAge = parseInt(req.query.minAge)
    const maxAge = parseInt(req.query.maxAge)

    if (minAge || maxAge) {
        query.age = {}
        if (minAge) query.age.$gte = Number(minAge)
        if (maxAge) query.age.$lte = Number(maxAge)
    }

    console.log(query)

    const limit = parseInt(req.query.limit) || 10
    const page = parseInt(req.query.page) || 1
    const skip = (page - 1) * limit

    const usersQuery = await UserModel.find(query)

    const total = usersQuery.length


    const users = await UserModel.find(query).limit(limit).skip(skip).sort(sortBy)



    return res.json({
        data: users,
        meta: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),  // 100 posts / 20 = 5 pages
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
        }
    })
})

export const getUserById = asyncHandler(async (req, res) => {
    const userId = req.params.id
    const user = await UserModel.findById(userId)
    return res.json(user)

})

export const createUser = asyncHandler(async (req, res) => {
    const {
        firstName, lastName, dateOfBirth, username, age, email, profile, password
    } = req.body
    // Hash Password (Convert to unreadable format and can't be reversed easily)
    const saltRounds = 12;  // Higher = slower = more secure
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new UserModel({
        firstName,
        lastName,
        dateOfBirth,
        username,
        age,
        email,
        profile,
        password: hashedPassword
    })
    await user.save()
    res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
    });
})

export const updateUser = asyncHandler(async (req, res) => {
    const user = await UserModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,           // Return updated document
            runValidators: true  // Run schema validators
        }
    );

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }

    res.status(200).json({
        success: true,
        data: user,
        message: 'User updated successfully'
    });
})

export const deleteUser = asyncHandler(async (req, res) => {
    const product = await UserModel.findByIdAndDelete(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }

    res.status(200).json({
        success: true,
        data: {},
        message: 'User deleted successfully'
    });
})