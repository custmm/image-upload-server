// serverConfig.js
import dotenv from "dotenv";
dotenv.config();

const serverConfig = {
  port: process.env.PORT || 42057,
  baseUrl: process.env.BASE_URL,
  nodeEnv: process.env.NODE_ENV,
  sessionSecret: process.env.SESSION_SECRET,
  uploadPath: process.env.UPLOAD_PATH,
  maxDescriptionLength: parseInt(process.env.MAX_DESCRIPTION_LENGTH, 10) || 500,
};

export default serverConfig;
