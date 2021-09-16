const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');

router.post('/tasks', authMiddleware, async (req, res) => {
    const newTask = new Task({
        ...req.body,
        ownerId: req.user._id
    });

    try {
        await newTask.save();
        res.status(201).send(newTask);
    } catch(e) {
        res.status(500).send(e);
    }

});

router.get('/tasks', authMiddleware, async (req, res) => {
    try {
        // const task = await Task.find({ ownerId: req.user._id });
        
        const queries = {}; //obj that we keep our queries in
        const sort = {};
        if(req.query.completed) {
            queries.completed = req.query.completed === 'true'; //queries are in string form so we check if query is equal to 'true' if it is queries.completed will get the value true otherwise false
        }
        if(req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        }

        await req.user.populate({
            path: 'userTasks',
            match: queries,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });
        res.status(200).send(req.user.userTasks);
    } catch(e) {
        res.status(504).send(e);
    }
});

router.get('/tasks/:id', authMiddleware,async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({ _id, ownerId: req.user._id });
        if(!task) return res.status(404).send();
        res.status(200).send(task);
    } catch(e) {
        res.status(500).send('Failed!');
    }
});

router.patch('/tasks/:id', authMiddleware, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if(!isValidOperation) return res.status(400).send('Error: Invalid update(s)!'); 
    
    try {
        const task = await Task.findOneAndUpdate({_id: req.params.id, ownerId: req.user._id}, req.body, {runValidators:true, new: true});
        if(!task) res.status(400).send('Error: Not found!');
        res.status(200).send(task);
    } catch (e) {
        res.status(400).send('Error: Update Failed!');
    }
});

router.delete('/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, ownerId: req.user._id});
        if(!task) return res.status(404).send('Not found!');
        res.status(200).send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;