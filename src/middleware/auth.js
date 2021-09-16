const jwt = require('jsonwebtoken');
const User = require('../models/user');

async function authMiddleware(req, res, next){
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decodedToken = jwt.verify(token, 'thisisanauthkey');
        const user = await User.findOne({ _id: decodedToken._id, 'tokens.token': token});
        if(!user) return res.status(401).send({Error: 'Authentication failed'});
        req.token = token; //we modify the request and add the token given with header to the reqeust object
        req.user = user; //we modify the request and add the found user(if we did found) to request object
        next();
    } catch (e) {
        res.status(500).send({Error: 'Authentication failed'});
    }
}

module.exports = authMiddleware;

