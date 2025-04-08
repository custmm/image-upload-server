// sslConfig.js
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

const sslConfig = {
  key: fs.readFileSync(path.resolve(process.env.SSL_KEY_PATH)),
  cert: fs.readFileSync(path.resolve(process.env.SSL_CERT_PATH)),
};

export default sslConfig;
