import mj from 'node-mailjet'
import './loadEnv.js'
// sends email using Mailjet 
const mailjet = mj.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET)

export default mailjet;