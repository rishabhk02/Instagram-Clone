const User = require('../Models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const path = require('path');


function authConroller() {
    return {
        
        // New User Registration
        registerUser: async (req, res) => {
            let { userName, email, password, name } = req.body;

            // checking if all fields are filled or not
            if (!userName || !email || !password || !name) {
                console.log("All fields are required for registration");
                return res.status(400).redirect('/signup');
            }

            try {
                // checking if user already exists in the database
                const user = await User.findOne({
                    $or: [{ userName: userName }, { email: email }],
                });

                if (user) {
                    console.log("Username or Email already registered");
                    return res.status(400).redirect('/signup');
                }

                // hashing the password
                const hashPassword = await bcrypt.hash(password, 12);

                // creating new user
                const newUser = new User({
                    userName: userName,
                    email: email,
                    password: hashPassword,
                    name: name,
                });

                try {
                    await newUser.save();
                    return res.status(200).redirect('/login');
                } catch (error) {
                    console.error('Error:', error);
                    return res.status(500).redirect('/signup');
                }
            } catch (error) {
                console.error('Error:', error);
                return res.status(500).redirect('/signup');
            }
        },
      
        login: async (req, res) => {
            const { userName, password } = req.body;

            // checking if all fiels are filled or not
            if (!userName || !password) {
                console.log("All fields are required");
                return res.status(401).redirect('/login');
            }

            // finding the user in database 
            const user = await User.findOne({ userName: userName });
            if (!user) {
                console.log("Invalid username or password");
                return res.status(400).redirect('/login');
            }

            // matching the password
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).redirect('/login');
                }
                if (!result) {
                    console.log("Invalid username or password");
                    return res.status(400).redirect('/login');
                }
            });

            // If password matched successfully than we will Generate a JWT token
            const maxAge = 86400000;
            const token = jwt.sign({ adminId: user._id }, process.env.SECRETE, { expiresIn: maxAge });

            // setting the token cookie to the client side browser
            res.cookie('jwtToken', token, { maxAge: maxAge });

            return res.status(200).redirect('/');
        },

        logout: function (req, res) {
            res.clearCookie('jwtToken');
            return res.status(200).redirect('/login');
        }
    }
}

module.exports = authConroller;
