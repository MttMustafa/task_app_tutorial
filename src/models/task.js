const mongoose = require('mongoose');
const validator = require('validator');



const taskSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            trim: true,
            required: true
        },
        completed: {
            type: Boolean,
            default: false
        },
        ownerId: {
            ref: 'User', //ref creates a connection with user database so we can get the user from task owner id
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        creationDate: {
            type: mongoose.Schema.Types.Date,
            required: true,
            default: Date.now
        }
    },
    {
        timestamps : true,
        toJSON: {virtuals: true}
    }
);


const Task = mongoose.model('Task', taskSchema);

module.exports = Task;