const mongoose = require('mongoose');
const userModel = require('./userModel');

// creating the post-content schema
const contentSchema = new mongoose.Schema({
    data: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    name:{
        type: String,
        required: true
    },
    caption:{
        type: String
    },
    hashTags:[{
        type: String
    }]
});

// creating the post schema
const postSchema= new mongoose.Schema({
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref:userModel,
        required: true
    },
    postContent: contentSchema,
    createdAt:{
        type: Date,
        default: Date.now
    },
    likes:[{
       type: mongoose.Schema.Types.ObjectId,
       ref: userModel, // Specify the referenced model
    }],
    comments:[{
        author:{
            type: mongoose.Schema.Types.ObjectId,
            ref:userModel,
            required: true
        },
        content:{
            type: String,
            required: true
        },
        createdAt:{
            type: Date,
            default: Date.now
        },
        replies:[{
            author:{
                type: mongoose.Schema.Types.ObjectId,
                ref:userModel,
                required: true
            },
            content:{
                type: String,
                required: true
            },
            createdAt:{
                type: Date,
                default: Date.now
            },
        }]
    }]
});

module.exports = new mongoose.model('PostData',postSchema);