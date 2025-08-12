import mailer from 'nodemailer';

// create a transporter object using SMTP transport
const transporter = mailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production' //NEVER SET IT TO FALSE IN PRODUCTION
    },
    
})

async function sendEmail(to, subject, text) {

    // sending email...
    await transporter.sendMail({
        from: 'FreshGo' ,
        to, //email address of the recipient,
        subject, // subject of the email
        text // body of the email
    });
}

export default sendEmail;