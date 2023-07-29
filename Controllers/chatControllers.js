const mongoose = require('mongoose');
const { roomModel, chatModel } = require('../Models/chatModel');
const userModel = require('../Models/userModel');

function chatController(app) {
    const io = app.get('socketio');

    // Handle socket connections
    io.on('connection', (socket) => {

        // Handle private chat room creation
        socket.on('createRoom', async (roomData) => {
            let { user1, user2 } = roomData;
            user1 = new mongoose.Types.ObjectId(user1);
            user2 = new mongoose.Types.ObjectId(user2);

            // Checking if room id already exist or not;
            let data = await roomModel.findOne({
                $or: [
                    { $and: [{ sender: user1 }, { receiver: user2 }] },
                    { $and: [{ sender: user2 }, { receiver: user1 }] },
                ],
            });

            // Assigning random room id is it not exist else assigning existing room id;
            let roomId = generateRoomId();
            if (data) {
                roomId = data.roomId;
            } else {
                const chatRoom = new roomModel({
                    roomId: roomId,
                    sender: user1,
                    receiver: user2,
                });

                const newMessage = new chatModel({
                    roomId: roomId,
                    message: [],
                });

                await newMessage.save();
                await chatRoom.save();
            }

            // joining the users to room with roomId
            socket.join(roomId);
            socket.emit('roomCreated', { roomId, user1, user2 });
        });

        // Handle private chat messages
        socket.on('privateMessage', async (adminId, roomId, sender, receiver, message) => {
            const chatMessage = {
                sender: sender,
                receiver: receiver,
                data: message,
            };

            let roomIdData = await chatModel.findOne({ roomId: roomId });
            let user = await userModel.findById(sender);
            let profileImage=user.profileImage;

            roomIdData.message.push(chatMessage);
            await roomIdData.save();

            // Updaing the recent chat user so that is appears on top of message section
            updateOldMessage(adminId,sender,receiver);
            
            // For Live Update on Message Search
            let otherUserDetail;
            if(sender===adminId){
                otherUserDetail=await userModel.findById(receiver);
            }else{
                otherUserDetail=user;
            }          

            io.to(roomId).emit('privateMessage', {sender,receiver,message,profileImage,otherUserDetail});
        });

        // Handle disconnections
        socket.on('disconnect', () => {
            // console.log('A user disconnected');
        });
    });

    // Generate a unique room ID
    function generateRoomId() {
        return Math.random().toString(36);
    }
}


// Loading older message with particular roomId
 function loadOldMessages(){
    return{
        loadOldMessages: async(req,res)=>{
            const roomId = req.params.roomId;
            let messages = await chatModel.findOne({roomId: roomId}).populate('message.sender').populate('message.receiver');
            messages=messages.message;
            return res.status(200).json({messages: messages});
        }
    }

}


// Updating the create time of chat
async function updateOldMessage(adminId, sender,receiver){
    let otherPerson = (sender===adminId)?receiver:sender;
    let user = await userModel.findById(adminId);
    const existingChat = user.olderChats.find((oldc) => oldc.userData.equals(otherPerson));

    if (existingChat) {
        existingChat.createdAt = new Date();
    } else {
        user.olderChats.push({userData: otherPerson, createdAt: new Date() });
    }

    user.olderChats.sort((a, b) => b.createdAt - a.createdAt);          
    await user.save();
}

module.exports = {chatController,loadOldMessages};












