import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('MongoDB connected succesfully');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

export default  connectDB;