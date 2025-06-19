import mongoose from 'mongoose';

const WindowLogSchema = new mongoose.Schema({
  window_title: String,
  data_logged: String
});

const LogBatchSchema = new mongoose.Schema({
  start: Date,
  end: Date,
  windows: [WindowLogSchema]
});

const UserSchema = new mongoose.Schema({
  hostname: { type: String, required: true, unique: true },
  Logs: [LogBatchSchema]
});

export default mongoose.model('User', UserSchema); 