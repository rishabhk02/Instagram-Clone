const userModel = require('../Models/userModel');
const postModel = require('../Models/postModel');

const path = require('path');

const { uploadImageMiddleware } = require('./postController');
const { default: mongoose } = require('mongoose');
const { response } = require('express');

function userController() {
    return {          
        editProfile: async (req, res) => {
            const adminId = req.admin.adminId;
            const { name, userName, email, dob, bio } = req.body;
            const updateData = { name, userName, email, dob, bio };

            // updating the user detail
            await userModel.updateOne({ _id: adminId }, { $set: updateData }).then((response) => {
                if (response.nModified == 0) {
                    console.log("Failed to Update Profile");
                    return res.status(400).redirect('/editProfile');
                }
                return res.status(200).redirect('/editProfile');
            }).catch((err) => {
                console.error("Error occured while updating profile: ", err);
                return res.status(500).redirect('/editProfile');
            })

        },

        updateProfileImage: async (req, res) => {
            uploadImageMiddleware(req, res, async (error) => {
                try {
                    // checking if error exist or not
                    if (error) {
                        return res.status(500).json({ message: "Error while uploading image to database" });
                    }

                    const adminId = req.admin.adminId;

                    // getting the image from req.file which provided by multer after uploading image to the dabase
                    const imageId = req.file.id;

                    // searching the user with authorId and adding imageId to its profile Image
                    await userModel.updateOne({ _id: adminId }, { $set: { profileImage: imageId } }).then((response) => {
                        if (response.nModified === 0) {
                            console.log("Failed to update profile image");
                            return res.status(400).redirect('/editProfile');
                        }
                        return res.status(200).redirect('/editProfile');
                    }).catch((error) => {
                        console.error(error);
                        return res.status(500).redirect('/editProfile');
                    });

                } catch (error) {
                    console.error(error);
                    return res.status(500).redirect('/editProfile');
                }
            })
        },

        addFollowing: async (req, res) => {
            const adminId = req.admin.adminId;
            const userId = req.params.userId;

            await userModel
                .updateOne({ _id: adminId }, { $push: { following: userId } })
                .then((response) => {
                    if (response.nModified === 0) {
                        return res.status(404).json({ message: "Failed to add following" });
                    }
                })
                .catch((err) => {
                    console.error("Error while following: ", err);
                    return res.status(500).json({ message: "Error while following" });
                });

            await userModel
                .updateOne({ _id: userId }, { $push: { followers: adminId } })
                .then((response) => {
                    if (response.nModified === 0) {
                        return res.status(404).json({ message: "Failed to add follower" });
                    }
                })
                .catch((err) => {
                    console.error("Error while adding follower: ", err);
                    return res.status(500).json({ message: "Error while adding follower" });
                });

            let user = await userModel.findById(userId);
            let followers = user.followers.length;

            const io = req.app.get('socketio');
            io.emit('addFollow',{followers,userId});
                
            return res.status(200).json({ message: "Following and Follower added successfully" });
        },

        
        rmvFollowing: async (req, res) => {
            const adminId = req.admin.adminId;
            const userId = req.params.userId;

            await userModel.updateOne({ _id: adminId }, { $pull: { following: userId } }).then((response) => {
                if (response.nModified === 0) {
                    return res.status(404).json({ message: "Failed to remove following" });
                }
            }).catch((err) => {
                console.error("Error while rmoving following: ", err);
                return res.status(500).json({ message: "Error while removing following" });
            });

            await userModel.updateOne({ _id: userId }, { $pull: { followers: adminId } }).then((response) => {
                if (response.nModified === 0) {
                    return res.status(404).json({ message: "Failed to remove follower" });
                }
            }).catch((err) => {
                console.error("Error while removing follower: ", err);
                return res.status(500).json({ message: "Error while removing follower" });
            });

            let user = await userModel.findById(userId);
            let followers = user.followers.length;
            
            const io = req.app.get('socketio');
            io.emit('removeFollow',{followers,userId});

            return res.status(200).json({ message: "Following and Follower removed succesfully" });
        },

        getFollowers: async (req, res) => {
            try {
                let userId = req.params.userId;
                let user = await userModel.findOne({ _id: userId });

                let followersList = user.followers;

                const query = {
                    _id: { $in: followersList }
                };

                let followersData = await userModel.find(query);

                return res.status(200).json({ followersData });
            } catch (error) {
                console.error("Error in fetching followers:", error);
                return res.status(500).json({ message: "Error in fetching followers" });
            }
        },        

        removeFollower: async(req,res)=>{
            const adminId = req.admin.adminId;
            const userId = req.params.userId;

            await userModel.updateOne({ _id: adminId }, { $pull: { followers: userId } }).then((response) => {
                if (response.nModified === 0) {
                    return res.status(404).json({ message: "Failed to remove following" });
                }
            }).catch((err) => {
                console.error("Error while rmoving following: ", err);
                return res.status(500).json({ message: "Error while removing following" });
            });

            await userModel.updateOne({ _id: userId }, { $pull: { following: adminId } }).then((response) => {
                if (response.nModified === 0) {
                    return res.status(404).json({ message: "Failed to remove follower" });
                }
            }).catch((err) => {
                console.error("Error while removing follower: ", err);
                return res.status(500).json({ message: "Error while removing follower" });
            });

            const io = req.app.get('socketio');
            io.emit('removeFollower',{userId});

            return res.status(200).json({ message: "Following and Follower removed succesfully" });

        },

        getFollowings: async (req, res) => {
            try {
                let userId = req.params.userId;
                let user = await userModel.findOne({ _id: userId });

                let followingList = user.following;

                const query = {
                    _id: { $in: followingList }
                };

                let followersData = await userModel.find(query);

                return res.status(200).json({ followersData });
            } catch (error) {
                console.error("Error in fetching followers:", error);
                return res.status(500).json({ message: "Error in fetching followers" });
            }
        },

        // Searched Users 
        getAllUsers: async (req, res) => {
            let userName = req.body.data;
            userName = userName.trim();

            // Construct the regex expression to match the string at the start, end, or anywhere within the fields
            const regex = new RegExp(userName, "i");
            const users = await userModel.find({
                $or: [
                    { userName: regex },
                    { name: regex }
                ]
            });
            return res.status(200).json({ userData: users });
        },


        addSearchedUser: async (req, res) => {
            try {
              const adminId = req.admin.adminId;
              const userId = req.params.userId;
          
              let admin = await userModel.findById(adminId);
          
              const existingRecentUser = admin.recentSearch.find(
                (recent) => recent.userData.equals(userId)
              );
          
              if (existingRecentUser) {
                existingRecentUser.createdAt = new Date();
              } else {
                admin.recentSearch.push({userData: userId, createdAt: new Date() });
              }

              // Sort the recentSearch array in descending order based on the createdAt field
              admin.recentSearch.sort((a, b) => b.createdAt - a.createdAt);
          
              await admin.save();
          
              return res.status(200).json({ message: 'Recent user added successfully.' });
            } catch (error) {
              console.log('Error while adding recent user ', error);
              return res.status(500).json({ message: 'Internal server error.' });
            }
          },

          prevSearchedUsers: async (req, res) => {
            try {
                const adminId = req.admin.adminId;

                // Fetch the user document and populate the recentSearch array with UserData documents
                let admin = await userModel
                    .findById(adminId)
                    .populate('recentSearch.userData');


                let recentSearch = admin.recentSearch;       
                // console.log(admin);

                return res.status(200).json({ recentSearchData: recentSearch });
            } catch (error) {
                console.log('Error while fetching recent searches: ', error);
                return res.status(500).json({ message: 'Internal server error.' });
            }
        },

        rmvPrevSearchedUser: async (req, res) => {
            try {
                const adminId = req.admin.adminId;
                const userId = req.params.userId;

                let admin = await userModel.findById(adminId);    

                admin.recentSearch.pull({userData:userId});
                await admin.save();

                const io = req.app.get('socketio');
                io.emit('removercntSearch',{id:userId});
        

                return res.status(200).json({ message: 'Recent user removed successfully' });
            } catch (error) {
                console.log('Error while removing recent user:', error);
                return res.status(500).json({ message: 'Internal server error.' });
            }
        },

        clearRecentSearch: async(req,res)=>{
            const adminId = req.admin.adminId;
            await userModel.updateOne({_id: adminId},{ $set: { recentSearch: [] } });  

            const io = req.app.get('socketio');
            io.emit('clearRecent',{});
            
            return res.status(200).json({message: "Clear All Recent User"});
        },


        getSavedPosts: async (req, res) => {
            const userId = req.params.userId;
            let user = await userModel.findById(userId)
                .populate({
                    path: "savedPost",
                    populate: [
                        { path: "author", model: userModel }, // Populate the author of each saved post
                        { path: "comments.author", model: userModel }, // Populate the comment authors
                        { path: "comments.replies.author", model: userModel }, // Populate the reply authors
                    ],
                }).exec();

            return res.status(200).json({savedPosts: user.savedPost});
        },

        getPostedPosts: async (req, res) => {
            const userId = req.params.userId;
            let user = await userModel.findById(userId)
                .populate({
                    path: "posts",
                    populate: [
                        { path: "author", model: userModel }, // Populate the author of each saved post
                        { path: "comments.author", model: userModel }, // Populate the comment authors
                        { path: "comments.replies.author", model: userModel }, // Populate the reply authors
                    ],
                }).exec();

            return res.status(200).json({unsavedPosts: user.posts});
        },

        prevChatUsers: async(req,res)=>{
            let admin = await userModel.findById(req.admin.adminId).populate('olderChats.userData');
            const olderChats = admin.olderChats;
            return res.status(200).json({olderChats});
        }


    }
}

module.exports = userController;