import mongoose from "mongoose";
import { DB_CONFIG } from '../config.js';

const connectDB = async () => {
  try {
    await mongoose.connect(DB_CONFIG.url, DB_CONFIG.options);
    console.log('MongoDB connected succesfully');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

export default  connectDB;