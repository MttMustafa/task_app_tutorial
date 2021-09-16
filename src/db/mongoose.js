const mongoose = require('mongoose');
const validator = require('validator');

//mongoose connect function is similar to mongodb connect function
//in mongoose connect function we define the database name inside the url as a directory
mongoose.connect(process.env.MONGODB_URL).catch(() => console.log('Connection error!'));
