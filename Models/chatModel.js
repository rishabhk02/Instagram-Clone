const mongoose = require('mongoose');
const userModel = require('../Models/userModel');

// roomSchema
const roomSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userModel
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userModel
    },
    roomId: {
        type: String
    }
});

const chatMessageSchema = new mongoose.Schema({
    roomId: String,
    message: [
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: userModel
            },
            receiver: {
                type: mongoose.Schema.Types.ObjectId,
                ref: userModel
            },
            data: {
                type: String
            }
        },
    ],
});

const roomModel = mongoose.model('roomData', roomSchema); 
const chatModel = mongoose.model('chatData', chatMessageSchema);

module.exports = {roomModel,chatModel};