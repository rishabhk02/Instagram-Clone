// Controllers
const authConroller = require('./Controllers/authController');
const pageController = require('./Controllers/pageController');
const userController = require('./Controllers/userController');
const {postController}= require('./Controllers/postController');
const {loadOldMessages} = require('./Controllers/chatControllers');

// MiddleWares
const {authenticate,unAuthenticate} = require('./MiddleWares/authentication');

function allRoutes(app){
    
    // USER REGISTRATION FUNCTIONALITY
    app.get('/signup',unAuthenticate,pageController().signupPage);
    app.post('/signup',unAuthenticate,authConroller().registerUser);
    
    // USER AUTHENTICATION FUNCTIONALITY
    app.get('/login',unAuthenticate,pageController().loginPage);
    app.post('/login',unAuthenticate,authConroller().login);
    app.post('/logout',authenticate,authConroller().logout);

    // HOME-PAGE ROUTE
    app.get('/',authenticate,pageController().homePage);


    // POST LIKE-UNLIKE FUNCTIONALITY
    app.post('/likePost/:postId',authenticate,postController().likeUnlike);


    // POST COMMENT-REPLY FUNCTIONALITY
    app.get('/getComments/:postId',authenticate,postController().getComments); 
    app.post('/addComment/:postId',authenticate,postController().addComment);
    app.post('/removeComment/:postId',authenticate,postController().removeComment);
    app.post('/addReply/:postId',authenticate,postController().addReply);


    // POST SAVE-UNSAVE FUNCTIONALITY
    app.post('/savePost/:postId',authenticate,postController().saveUnsavePost);


    // USER-SEARCH FUNCTIONALITY
    app.get('/prevSearchedUsers',authenticate,userController().prevSearchedUsers);
    app.post('/rmvPrevSearchedUser/:userId',authenticate,userController().rmvPrevSearchedUser);
    app.post('/addSearchedUser/:userId',authenticate,userController().addSearchedUser);
    app.post('/clearRecentSearch',authenticate,userController().clearRecentSearch);
    app.post('/getAllUsers',authenticate,userController().getAllUsers);


    // POST ADD-DELETE-UPDATE FUNCTIONALITY
    app.post('/addPost',authenticate,postController().addPost);
    app.post('/updatePost',authenticate,postController().updatePost);
    app.post('/deletePost/:postId',authenticate,postController().deletePost);


    // MESSAGE FUNCTINALITY
    app.get('/dmPage',authenticate,pageController().dmPage);
    app.get('/prevChatUsers',authenticate,userController().prevChatUsers);
    app.get('/loadOldMessages/:roomId',loadOldMessages().loadOldMessages);

    
    // GETTING IMAGE FROM DATABASE
    app.get('/Images/:imageId',authenticate,postController().getImage);


    // USER-PROFILE PAGE FUNCTIONALITY
    app.get("/user/:userName",authenticate,pageController().sendUserProfile);
    app.get("/editProfile",authenticate,pageController().editProfilePage);
    app.post("/editProfile",authenticate,userController().editProfile);
    app.post("/updateProfileImage",authenticate,userController().updateProfileImage);

    // FOLLOWER-FOLLOWING FUNCTINALITY
    app.get('/getFollowers/:userId',authenticate,userController().getFollowers);
    app.get('/getFollowings/:userId',authenticate,userController().getFollowings);
    app.post("/addFollowing/:userId",authenticate,userController().addFollowing);
    app.post("/rmvFollowing/:userId",authenticate,userController().rmvFollowing);
    app.post("/removeFollower/:userId",authenticate,userController().removeFollower);

    // USER SAVED & POSTED POSTS   
    app.get('/getSavedPosts/:userId',authenticate,userController().getSavedPosts);
    app.get('/getPostedPosts/:userId',authenticate,userController().getPostedPosts);    
}

module.exports = allRoutes;