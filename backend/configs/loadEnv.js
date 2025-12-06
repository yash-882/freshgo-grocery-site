import dotenv from 'dotenv';

function loadEnv() {
  // Load environment variables from the .env file  
dotenv.config({ path: './configs/file.env', quiet: true });

}
loadEnv()
export default loadEnv