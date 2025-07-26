import mongoose from 'mongoose';

const { Schema } = mongoose;

const DriveSchema = new Schema({
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Token: {
    type: String,
    required: true,
  },
  Full : {
    type: Boolean,
    default: false,
  }
});

export default mongoose.model('Drive', DriveSchema); 