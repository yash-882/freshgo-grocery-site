const mailer = require('nodemailer');

// create a transporter object using SMTP transport
const transporter = mailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL,
        pass: process.env.GOOGLE_PASSWORD
    },
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production' //NEVER SET IT TO FALSE IN PRODUCTION
    },
})

async function sendEmail(to, subject, text) {

    // sending email...
    await transporter.sendMail({
        from: 'FreshGo Support <FromFreshGo>' , //'FreshGo Support' will be displayed as a sender
        to, //email address of the recipient,
        subject, // subject of the email
        text// body of the email
    });
}

module.exports = sendEmail;