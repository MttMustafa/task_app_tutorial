const express = require('express');
require('./db/mongoose'); //we run the mongoose file which connects us to database
const Task = require('./models/task');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');


const app = express();
const port = process.env.PORT;


//use function is a middleware function. middleware functions runs before the route handlers
app.use(express.json()); //with this function express will automaticly parse the json to js objects
app.use(userRouter,taskRouter);
// app.use(taskRouter);

app.listen(port, () => {
    console.log(`Port ${port} up and running!`);
});

