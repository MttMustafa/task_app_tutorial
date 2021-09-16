const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');
//In order to create a model we need a schema here we create one
const userSchema = new mongoose.Schema({
    name: {
        type: String, //type validations
        trim: true, //trims string before saving the db
        required: true //we can assign validators for attributes. in this case our validates indicates name attributes has to be required while creating a new 'User'
    },
    age: {
        type: Number,
        //we can also create custom validations with validate function. In this case we check if the age is negative if it is we thow an error.
        // validate(value){
        //     if (value < 0) {
        //         throw new Error('Age must be a positive number');
        //     }
        // }
        min: 1,
        default: 1
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true, //lowercases the string before saving the db 
        validate(value){
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid!');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 6,
        validate(value){
            if (value.toLowerCase().includes('password')) throw new Error('Please choose a more complex password');
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
});

//creating a connection with task model
userSchema.virtual('userTasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'ownerId'
});

//toJSON is a default express function. Whenever a user object converted to json this function will run automaticly
userSchema.methods.toJSON = function() {
    const userPublicObj = this.toObject();

    delete userPublicObj.password;
    delete userPublicObj.tokens;
    delete userPublicObj.avatar;
    return userPublicObj;
}

//this is a mongoose method created for creating authentication tokens for signups and signins
//in signup and sign in routes this function is called
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JSON_SECRET, { expiresIn: '1 hour'});
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
}

//findByCredential function defined for express server so we can handle logins from database. 
//This function returns the user info if user entered the correct email password combo
userSchema.statics.findByCredential = async function (email, password) {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('There is no user with this email!');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) throw new Error('Wrong password!');
    
    return user;
}

//we can define processing function for our schema
//here we define a 'save' fucntion that runs BEFORE saving a document
//this spesific function used for hashing passwords
userSchema.pre('save', async function (next) {
    const user = this;
    //we check if password key is modified
    if(user.isModified('password')) user.password = await bcrypt.hash(user.password, 8); 
    next(); //next call ends the async process
});

userSchema.pre('findOneAndUpdate', async function (next) {
    
    const user = this; //target document
    const update = user.getUpdate(); //getting what changes user want to make
    //checking if there is any password changes
    if(update.password){
        //hashing the new password value and and replacing new password with the hashed version of it
        update.password = await bcrypt.hash(update.password, 8);
    }
    next(); //next call ends the async process
});

userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ownerId: user._id});
    next();
})

// mongoose model function helps us to create a db model
// in this case we define a user model, attributes and data types for the attributes
const User = mongoose.model('User', userSchema);

module.exports = User;