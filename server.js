// Importing all the required packages
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const chatControlller = require('./Controllers/chatControllers');

// set view engine and path of the views folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + "/FrontEnd/views"));

// including the css file
app.use(express.static(__dirname + '/FrontEnd/public'));

// for getting env files variables
require('dotenv').config();

// for getting the cookie
app.use(cookieParser());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.urlencoded({ extended: true }));

// mongodb connection
const connectDb = async () => {
    try {
        await mongoose.connect(`mongodb+srv://rishabhkumrawat02:Ideafi%4012345@idea-fi.4an7gor.mongodb.net/Idea-Fi?retryWrites=true&w=majority`, {
            useNewUrlParser: true
        });
        console.log("Database Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        process.exit(1);
    }
}
connectDb();

// getting all the routes
require('./routes')(app);

// creating the server
let server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})


// For Live Data Update
const io = require('socket.io')(server);

io.on('connection', (socket) => {    
    socket.on('connect',()=>{
        // console.log('Connection SuccessFull');
    })
    socket.on('disconnect', () => {
        // console.log('Connection Unsuccessfull');
    });
});

app.set('socketio',io);


// handling chat system
const {chatController} = require('./Controllers/chatControllers');
chatController(app);

