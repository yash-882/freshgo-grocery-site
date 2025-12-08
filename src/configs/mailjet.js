const mj = require('node-mailjet');

// sends email using Mailjet 
const mailjet = mj.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET)

module.exports = mailjet;