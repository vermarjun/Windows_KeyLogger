import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  oAuthCredentials: [{
    type: String, // Store JSON stringified credentials
    required: false,
  }],
  client: [{
    type: Schema.Types.ObjectId,
    ref: 'Client',
  }],
  profilePhoto: {
    type: String, // URL or path to profile photo
    default: '',
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  bio: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  // Add any other fields you think are useful for a user
});

export default mongoose.model('User', UserSchema); 