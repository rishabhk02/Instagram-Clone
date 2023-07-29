require('dotenv').config();
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require("multer-gridfs-storage");
const postModel = require('../Models/postModel');
const path = require('path');
const jwt = require('jsonwebtoken');

// for retrieving the image
const { GridFSBucket } = require('mongodb');
const userModel = require('../Models/userModel');


// Create storage engine for images storing in database

const Storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => {
    // Generate a unique fileName
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname); // Get the file extension
    const filename = file.fieldname + '-' + uniqueSuffix + fileExtension;

    return {
      bucketName: 'images',
      filename: filename
    };
  }
});


// Set multer storage engine to store the image 
let uploadImageMiddleware = multer({ storage: Storage }).single('image');


function postController() {
  return {

    addPost: (req, res) => {
      uploadImageMiddleware(req, res, async (error) => {
        try {
          // Retrieve the adminId
          const adminId = req.admin.adminId;

          // Handle any multer or file upload errors
          if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error while uploading the image' });
          }

          // getting the post detail    
          const { caption } = req.body;

          // multer attach the file with req after storing it in database
          const file = req.file;

          // Check if the file exists
          if (!file) {
            return res.status(400).json({ message: 'No image is selected' });
          }

          // Saved the file to MongoDB using GridFS and retrieving the file ID
          const fileId = file.id;
          const fileName = file.filename;

          // Create a new post document with the file ID and other data
          const newPost = new postModel({
            author: adminId,
            postContent: { data: fileId, name: fileName, caption: caption, hashTags: '' },
            likes: [],
            comment: []
          });

          // Save the post to the database
          await newPost.save();

          // adding post to the author post array
          await userModel.updateOne({ _id: adminId }, { $push: { posts: newPost._id } }).exec();

          return res.status(200).redirect('/');

        } catch (error) {
          console.error('Error while adding the post: ', error);
          return res.status(500).redirect('/');
        }
      });
    },
    

    getImage: async (req, res) => {
      // Assuming you have the image ID in a variable called imageId
      const imageId = req.params.imageId;

      // Access the GridFSBucket using the existing connection and specify the bucket name ('images')
      const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'images' });

      // Retrieve the image from the bucket
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(imageId));

      // Create a Readable stream from the download stream using the pipe method (Copy output of download stream to input of response)
      downloadStream.pipe(res);

      // End the response to indicate that the response is complete
      downloadStream.on('end', () => {
        res.end();
      });

      // Handle any errors that occur during the stream
      downloadStream.on('error', (error) => {
        console.error('Error while retrieving the image: ', error);
        res.status(500).json({ message: 'Error while retrieving the image' });
      });
    },


    deletePost: async (req, res) => {
      const postId = req.params.postId;
      const adminId = req.admin.adminId;

      // removing post from user post array
      let user = await userModel.findById(adminId);
      user.posts.pull(postId);
      await user.save();

      await postModel.findOne({ _id: postId }).then((post) => {
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        post.deleteOne().then(() => {

          // deleting the post images
          const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'images' });

          bucket.delete(new mongoose.Types.ObjectId(post.postContent.data))
            .then(() => {

              const io = req.app.get('socketio');
              io.emit('postDeleted',{});
              
              // Image deleted successfully
              return res.status(200).json({ message: 'Post and image deleted successfully' });
            })
            .catch((error) => {
              console.error('Error occurred while deleting the image:', error);
              res.status(500).json({ message: 'Error occurred while deleting the image' });
            });


        }).catch((error) => {
          console.error("Error occured while deleting the post: ", error);
          return res.status(500).json({ message: "Error occured while deleting the post" });
        })
      }).catch((error) => {
        console.error("Error occured while retireving the post for deletion: ", error);
        return res.status(500).json({ message: "Error occured while retireving the post for deletion" });
      })
    },

    likeUnlike: async (req, res) => {
      const postId = req.params.postId;
      const adminId = req.admin.adminId;

      let post = await postModel.findById(postId);

      const isLiked = post.likes.includes(adminId);
      
      try {
        if (isLiked) {
          post.likes.pull(adminId);
          await post.save();
        } else {
          post.likes.push(adminId);
          await post.save();
        }

        const io = req.app.get('socketio');
        io.emit('postLiked', { post: post, likeCount: post.likes.length });

        return res.status(200).json("done work");
      } catch (err) {
        console.log(err);
        return res.status(500).json("Error while removing adding likes");
      }
    },

    addComment: async (req, res) => {
      const adminId = req.admin.adminId;
      const postId = req.params.postId;
      const commentContent = req.body.content;

      try {        
        // Create the new comment with the complete user object as the author
        const newComment = {
          author: adminId, // Complete user object
          content: commentContent,
          replies: []
        };

        await postModel.updateOne({ _id: postId }, { $push: { comments: newComment } });

        const updatedPost = await postModel.findById(postId).populate('comments.author');

        updatedPost.comments.sort((a, b) => b._id.getTimestamp() - a._id.getTimestamp());
        const addedComment = updatedPost.comments.find((comment) => comment.content === commentContent);

        const io = req.app.get('socketio');
        io.emit('postCommented', { postId: postId, newComment: addedComment });

        return res.status(200).json({ message: "Comment added successfully"});

      } catch (err) {
        console.error("Error while adding comment: ", err);
        return res.status(500).json({ message: "Error while adding comment" });
      }
    },

    removeComment: async (req, res) => {
      try {
        const commentId = req.body.cmntId;
        const postId = req.params.postId;

        const post = await postModel.findById(postId);

        // Filter out the comment with the given commentId
        post.comments = post.comments.filter((comment) => comment._id.toString() !== commentId);

        // Save the updated post with the comment removed
        await post.save();

        const io = req.app.get('socketio');
        io.emit('commentDeleted', { commentId });

        return res.status(200).json({ message: "Comment removed successfully" });
      } catch (err) {
        console.error("Error while deleting comment: ", err);
        return res.status(500).json({ message: "Error while deleting the comment" });
      }
    },

    addReply: async (req, res) => {
      const postId = req.params.postId;
      const cmntId = req.body.commentId;
      const replyContent = req.body.content;

      // creating the new reply
      const newReply = {
        author: req.admin.adminId,
        content: replyContent
      };

      try {
        // searching for the post with comment id and populating the comments and replies
        const post = await postModel.findOne({ _id: postId }).populate({
          path: 'comments',
          match: { _id: cmntId },
          populate: { path: 'replies.author' }
        });

        // Find the comment with the given cmntId
        const curComment = post.comments.find((c) => c._id.toString() === cmntId);

        // adding reply to the respective comment
        curComment.replies.push(newReply);

        // Save the updated post with the new reply
        await post.save();

        const addedReply = curComment.replies.find((reply) => reply.content === replyContent);

        const populatedPost = await postModel.findById(postId)
          .populate({
            path: 'comments',
            match: { _id: cmntId },
            populate: { path: 'replies.author' }
          });

        // Get the populated comment (which includes the populated reply)
        const populatedComment = populatedPost.comments[0];

        // Get the populated reply
        const populatedAddedReply = populatedComment.replies.find(r => r.id === addedReply.id);

        const io = req.app.get('socketio');
        io.emit('replyAdded', { postId, cmntId, reply: populatedAddedReply });

        return res.status(200).json({ message: "Reply to the comment added successfully" });
      } catch (err) {
        console.error("Error in adding reply:", err);
        return res.status(500).json({ message: "Error in adding reply" });
      }
    },

    getComments: async (req, res) => {
      try {
          const postId = req.params.postId;
          const commentData = await postModel.find({ _id: postId }).populate('author').populate('comments.author').populate('comments.replies.author');

          return res.status(200).json({ commentData });
      } catch (error) {
          console.log(error);
          return res.status(500).json({ message: "Error in fetching commentData" });
      }
    },


    saveUnsavePost: async (req, res) => {
      const adminId = req.admin.adminId;
      const postId = req.params.postId;
      const user = await userModel.findById(adminId);
      const isSaved = user.savedPost.includes(postId);
      try {
        if (isSaved) {
          user.savedPost.pull(postId);
          await user.save();
        } else {
          user.savedPost.push(postId);
          await user.save();
        }
        let flag = !isSaved;

        const io = req.app.get('socketio');
        io.emit('postSaved', { postId, user, flag });

        return res.status(200).json("done work");
      } catch (err) {
        console.log(err);
        return res.status(500).json("Error while removing adding likes");
      }
    },


    // CURRENTLY NOT USING THIS FUNCTIONALITIES

    updatePost: async (req, res) => {
      const postId = req.body.postId;

      await postModel.updateOne(
        { _id: postId },
        { $set: { 'postContent.caption': req.body.caption, 'postContent.hashTags': req.body.hashTags.split("#") } }
      ).then((response) => {
        if (response.nModified === 0) {
          return res.status(404).json({ message: "Failed to update post" });
        }
        return res.status(200).json({ message: "Post updated successfully" });
      }).catch((err) => {
        console.error("Error while updating the post: ", err);
        return res.status(500).json({ message: "Error while updating the post" });
      });

    },
    
    removeCommentReply: async (req, res) => {
      const adminId = req.admin.adminId;
      const postId = req.boyd.postId;
      const commentId = req.body.commentId;
      const replyId = req.body.replyId;

      await postModel.findOne({ _id: postId, comments: { $elemMatch: { _id: commentId } } }).then((response) => {
        if (!response) {
          return res.status(404).json({ message: "Post with commentId not found" });
        }
        let curComment = response.comments[0];

        curComment.replies.pull({ _id: replyId });
        response.save();

        return res.status(200).json({ message: "Reply deleted successfully" });
      })
    }    
  }
}

module.exports = { postController, uploadImageMiddleware };

