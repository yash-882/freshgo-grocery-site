import dotenv from 'dotenv';
import path from 'path';

function loadEnv() {
  // Load environment variables from the .env file  
  dotenv.config({
    path: path.resolve(process.cwd(), 'src/configs/file.env'),
    quiet: true
  });

}
loadEnv()
export default loadEnv