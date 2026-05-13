import PostModel from "../models/postModel.js";
import asyncHandler from 'express-async-handler'

export const getAllPosts = asyncHandler(async (req, res) => {

    const query = {}

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


    const total = await PostModel.countDocuments();

    const posts = await PostModel.find(query).limit(limit).skip(skip)
    return res.json({
        data: posts,
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

export const getPostById = (req, res) => {
    res.json({ message: 'Get post', id: req.params.id });
}

export const createPost = asyncHandler(async (req, res) => {
    const {
        text, title, author
    } = req.body
    const post = new PostModel({
        text,
        title,
        author
    })
    await post.save()
    res.status(201).json({
        success: true,
        data: post,
        message: 'Post created successfully'
    });
})

export const updatePost = (req, res) => {
    res.json({ message: 'Update post', id: req.params.id });
}

export const deletePost = (req, res) => {
    res.status(204).send();
}