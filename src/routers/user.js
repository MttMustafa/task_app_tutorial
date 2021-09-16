const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account');

router.post('/users', async (req,res) => {
    const newUser = new User(req.body);
    try {
        const token = await newUser.generateAuthToken(); //generating authentication tokens
        const user = await newUser.save({runValidators: true});
        sendWelcomeEmail(user.email, user.name);
        res.status(201).send({user, token});
    } catch(e) {
        res.status(500).send(e)
    }
});

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredential(req.body.email, req.body.password);
        const token = await user.generateAuthToken(); //generating authentication tokens and adding tokens array in the user doc
        res.send({user, token});
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/logout', authMiddleware, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send('Logged out successfully!');
    } catch (e) {
        res.status(500).send(e);
        
    }
});

router.post('/users/logoutAll', authMiddleware, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send('Logged out from all accounts successfully!');
    } catch (e) {
        res.status(500).send(e);
        
    }
});

//authMiddleware used for checking authetication key
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).send(users);
    } catch(e) {
        res.status(500).send(e);
    }
});

router.get('/users/me', authMiddleware, async (req, res) => {
    try {
        const user = req.user; //we get the user inserted into request obj in authentication
        res.status(200).send(user);
    } catch(e) {
        res.status(500).send(e);
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        if(!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
            return callback(new Error('File format does not supported'));
        }

        callback(undefined, true);
    }
});

//express cant handle file uploads so we use upload library
//then we use the sharp library to edit file (buffer) 
router.post('/users/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    const imgFile = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    req.user.avatar = imgFile;
    await req.user.save();
    res.send('Uploaded!');
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message});
});

router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id);
        res.status(200).send(user);
    } catch(e) {
        res.status(404).send(e);
    }
});

router.delete('/users/me/avatar', authMiddleware, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send('User avatar deleted!');
});

router.patch('/users/me', authMiddleware, async (req, res) => {
    const updates = Object.getOwnPropertyNames(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if(!isValidOperation) return res.status(400).send('Error: Invalid update(s)!');

    try {
        const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true, runValidators: true});
        if(!user) res.status(400).send('Not found!');
        res.status(200).send(user);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.delete('/users/me', authMiddleware, async (req, res) => {
    try {
        const user = await req.user.delete();
        sendCancelEmail(user.email, user.name);
        res.send(user);
    } catch(e) {
        res.status(500).send('error');
    }
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar) throw new Error();

        res.set('Content-Type', 'image/jpeg'); //setting up http header
        res.send(user.avatar);

    } catch (e) {
        res.status(404).send();
    }
})
module.exports = router;