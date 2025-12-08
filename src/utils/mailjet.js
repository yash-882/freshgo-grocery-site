const mailjet = require('../configs/mailjet.js');

const sendEmail = async (to, subject, text) => {
    // implement email sending logic here using Mailjet or any other service
    await mailjet.post("send", { 'version': 'v3.1' }).request({
        "Messages": [
            {
                "From": {
                    "Email": process.env.FRESHGO_EMAIL,
                    "Name": "FreshGo"
                },  
                "To": [
                    {
                        "Email": to,
                    }
                ],
                "Subject": subject,
                "TextPart": text,
            }
        ]
    });
}

module.exports = sendEmail;