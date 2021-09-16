const sgMail = require('@sendgrid/mail');
const sendgridAPIKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(sendgridAPIKey);

// sgMail.send({
//     to:'mustafasen@tuta.io',
//     from: 'mustafasen@tuta.io',
//     subject: 'Task App Email',
//     text: 'Crossing fingers'
// });

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mustafasen@tuta.io',
        subject: 'Welcome the Task App!',
        text: 'Welcome to the Task App ' + name + '!'
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mustafasen@tuta.io',
        subject: 'We are sorry to see you go :(',
        text: name + ' ' + 'your Task App account has been deleted!'
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}