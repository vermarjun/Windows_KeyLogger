import express from "express";
import dayjs from "dayjs";
import cors from 'cors'
import dotenv from "dotenv";
import GoogleDriveService from "./util/googleDrive.js";
import BatchProcessor from "./util/batchProcessor.js";

dotenv.config({});

const app = express();

// Initialize Google Drive service
export const root_folder = "1c-6HpFy91j6GWOwNrMON7BW0pHv7evFM"; 
const googleDriveService = new GoogleDriveService();
const batchProcessor = new BatchProcessor();

// Middleware with increased body size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// allow all origins
app.use(cors());

// check backend working
app.get("/", (req, res) => {
    return res.status(200).json({
        message: "I am coming from backend",
        success: true
    });
});

app.post("/", async (req, res) => {
    console.log(`request to save logs came`)
    const { logs, hostname } = req.body;
    console.log(`request to save logs came by ${hostname} with ${logs.length} logs`)
    
    if (!Array.isArray(logs) || !hostname) {
        return res.status(400).json({ success: false, message: "Missing logs array or hostname" });
    }
    
    try {
        // Always use batch processing for consistency and reliability
        const result = await batchProcessor.processLargeDataset(hostname, logs);
        
        res.send({ 
            success: true, 
            message: "Logs processed successfully", 
            result: result 
        });
    } catch (err) {
        console.error('Error processing logs:', err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
    try {
        console.log(`Server running at port ${PORT}`);
        console.log('Google Drive Connected');
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }    
});