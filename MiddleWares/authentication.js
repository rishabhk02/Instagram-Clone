const jwt = require('jsonwebtoken');


function authenticate(req,res,next){
    if(req.admin){
        return next();
    }
    const token = req.cookies.jwtToken;
    if(!token){
        return res.status(401).redirect('/login');
    }
    try {
        // adding user to the request header
        req.admin=jwt.verify(token,"thisissecret");
        return next();
    } catch (error) {
        console.error(error);
        return res.status(401).redirect('/login');
    }
}

function unAuthenticate(req,res,next){
    const token = req.cookies.jwtToken;
    if(!token){
        return next();
    }
    try {
        jwt.verify(token, "thisissecret");
        return res.status(401).redirect('/');
    } catch (error) {
        return next();
    }
}



module.exports = {authenticate,unAuthenticate};
