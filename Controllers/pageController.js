const userModel = require('../Models/userModel');
const postModel = require('../Models/postModel');


function pageController(){
    return {
        signupPage: (req, res) => {
            return res.status(200).render('signup');
        },

        loginPage: (req,res)=>{
            return res.render('login');
        },
        
        homePage: async (req, res) => {
            const admin = await userModel.findById(req.admin.adminId);

            let adminFollowing = admin.following;

            // Calculate the date 3 days ago for posts
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);


            // Construct the query to find posts from the following users with a post time not more than 3 days
            const query = {
                author: { $in: adminFollowing },
                createdAt: { $gte: threeDaysAgo },
            };

            // Execute the query and retrieve the posts and also extracting user detail
            const posts = await postModel.find(query).populate("author");
            const selfPosts = await postModel.find({ $and: [{ author: admin._id }, { createdAt: { $gte: threeDaysAgo } }] }).populate('author');
            posts.push(...selfPosts);

            return res.render('homePage', { posts, admin });
        },

        dmPage: async (req,res)=>{
            const admin = await userModel.findById(req.admin.adminId);
            return res.status(200).render('chatPage',{admin});
        },

        sendUserProfile: async (req, res) => {
            try {
                const admin = await userModel.findById(req.admin.adminId);
                const user = await userModel.findOne({ userName: req.params.userName }).populate('posts');
                if (!user) {
                    console.log("User does not exist");
                    return res.status(404).redirect('/');
                }
                return res.status(200).render('profilePage', {user, admin});
            } catch (error) {
                console.error("Error while fetching user profile: ", error);
                return res.status(500).redirect('/');
            }
        },

        editProfilePage: async (req, res) => {
            const admin = await userModel.findById(req.admin.adminId);
            return res.status(200).render('editProfile', {admin});
        },
    }
}

module.exports=pageController;