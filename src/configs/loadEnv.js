const dotenv = require('dotenv');
const path = require('path');

function loadEnv() {
  // Load environment variables from the .env file  
  dotenv.config({
    path: path.resolve(process.cwd(), 'src/configs/file.env'),
    quiet: true
  });

}
loadEnv()
module.exports = loadEnv