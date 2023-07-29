const mongoose = require('mongoose');
const userRegisterSchema = new mongoose.Schema({
    userName: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    dob: {
        type: Date,
    },
    bio: {
        type: String,
        trim: true
    },
    profileImage: {
        type: mongoose.Schema.Types.ObjectId
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserData"
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserData"
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "PostData"
    }],
    recentSearch: [{
        userData: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserData",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    savedPost: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "PostData"
    }],
    olderChats:[{
        userData: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserData",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }]
});

module.exports = new mongoose.model('UserData', userRegisterSchema);