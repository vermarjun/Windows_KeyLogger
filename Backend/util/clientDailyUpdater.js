import ClientDaily from '../models/ClientDaily.js';
import { extractContentFromText } from './contentDetection.js';

/**
 * Updates ClientDaily model with processed logs data
 * @param {string} clientId - The client ID (from hostname)
 * @param {Array} processedLogs - Array of processed log objects
 */
export async function updateClientDailyWithLogs(clientId, processedLogs) {
    if (!processedLogs || processedLogs.length === 0) {
        console.log('No processed logs to update');
        return;
    }

    // Group logs by date for batch updating
    const logsByDate = {};
    for (const log of processedLogs) {
        const date = log.start_time.split('T')[0]; // e.g., "2025-07-24"
        if (!logsByDate[date]) logsByDate[date] = [];
        logsByDate[date].push(log);
    }

    console.log(`Processing ${processedLogs.length} logs for ${Object.keys(logsByDate).length} dates`);

    for (const [date, logs] of Object.entries(logsByDate)) {
        try {
            // Fetch or create the ClientDaily doc
            let clientDaily = await ClientDaily.fetchByClientIdAndDate(clientId, date);
            if (!clientDaily) {
                clientDaily = new ClientDaily({ 
                    clientId, 
                    date,
                    total_active_time_ms: 0,
                    total_sessions: 0,
                    total_words_typed: 0,
                    total_keystrokes: 0,
                    cognitive_behavior: {},
                    active_apps: [],
                    top_window_titles: [],
                    content_classification_stats: [],
                    content_stats: {},
                    clipboard_stats: { total_copy: 0, total_paste: 0 },
                    keyboard_shortcuts_used: [],
                    activity_timeline: [],
                    sessions: []
                });
            }

            // Initialize if not exists
            if (!clientDaily.cognitive_behavior) clientDaily.cognitive_behavior = {};
            if (!clientDaily.active_apps) clientDaily.active_apps = [];
            if (!clientDaily.top_window_titles) clientDaily.top_window_titles = [];
            if (!clientDaily.content_classification_stats) clientDaily.content_classification_stats = [];
            if (!clientDaily.content_stats) clientDaily.content_stats = {};
            if (!clientDaily.clipboard_stats) clientDaily.clipboard_stats = { total_copy: 0, total_paste: 0 };
            if (!clientDaily.keyboard_shortcuts_used) clientDaily.keyboard_shortcuts_used = [];
            if (!clientDaily.activity_timeline) clientDaily.activity_timeline = [];
            if (!clientDaily.sessions) clientDaily.sessions = [];

            // Process each log for this date
            for (const log of logs) {
                await processSingleLog(clientDaily, log);
            }

            // Update last_updated
            clientDaily.last_updated = new Date();

            // Save the updated doc
            await clientDaily.save();
            console.log(`Updated ClientDaily for client ${clientId} on date ${date}`);

        } catch (error) {
            console.error(`Error updating ClientDaily for client ${clientId} on date ${date}:`, error);
        }
    }
}

/**
 * Process a single log object and update the ClientDaily document
 * @param {Object} clientDaily - The ClientDaily document to update
 * @param {Object} log - Single processed log object
 */
async function processSingleLog(clientDaily, log) {
    // Update basic stats
    clientDaily.total_active_time_ms += log.duration_ms || 0;
    clientDaily.total_sessions += 1;
    clientDaily.total_words_typed += log.content?.word_count || 0;
    clientDaily.total_keystrokes += log.raw_events?.length || 0;

    // Update cognitive behavior
    updateCognitiveBehavior(clientDaily, log);

    // Update active apps
    updateActiveApps(clientDaily, log);

    // Update top window titles
    updateTopWindowTitles(clientDaily, log);

    // Update clipboard stats
    updateClipboardStats(clientDaily, log);

    // Update keyboard shortcuts
    updateKeyboardShortcuts(clientDaily, log);

    // Update activity timeline
    updateActivityTimeline(clientDaily, log);

    // Update sessions (only if content is non-empty)
    updateSessions(clientDaily, log);

    // Update content stats
    updateContentStats(clientDaily, log);
}

/**
 * Update cognitive behavior metrics
 */
function updateCognitiveBehavior(clientDaily, log) {
    const behavior = log.behavioral_metrics;
    if (!behavior) return;

    const cb = clientDaily.cognitive_behavior;

    // Initialize if not exists
    if (cb.avg_typing_speed_wpm === undefined) {
        cb.avg_typing_speed_wpm = 0;
        cb.avg_backspace_freq = 0;
        cb.avg_session_length_ms = 0;
        cb.max_session_length_ms = 0;
        cb.context_switch_count = 0;
        cb.typing_bursts_avg_per_session = 0;
        cb.peak_typing_speed_wpm = 0;
    }

    // Update max session length
    if (log.duration_ms > cb.max_session_length_ms) {
        cb.max_session_length_ms = log.duration_ms;
    }

    // Update peak typing speed
    if (behavior.typing_speed_wpm > cb.peak_typing_speed_wpm) {
        cb.peak_typing_speed_wpm = behavior.typing_speed_wpm;
    }

    // Recalculate averages (this is simplified - you might want more sophisticated averaging)
    const totalSessions = clientDaily.total_sessions;
    cb.avg_typing_speed_wpm = ((cb.avg_typing_speed_wpm * (totalSessions - 1)) + behavior.typing_speed_wpm) / totalSessions;
    cb.avg_backspace_freq = ((cb.avg_backspace_freq * (totalSessions - 1)) + behavior.backspace_frequency) / totalSessions;
    cb.avg_session_length_ms = ((cb.avg_session_length_ms * (totalSessions - 1)) + log.duration_ms) / totalSessions;
    cb.typing_bursts_avg_per_session = ((cb.typing_bursts_avg_per_session * (totalSessions - 1)) + behavior.typing_bursts) / totalSessions;
}

/**
 * Update active apps list
 */
function updateActiveApps(clientDaily, log) {
    const app = log.application;
    if (!app || !app.window_title) return;

    // Find existing app
    const existingAppIndex = clientDaily.active_apps.findIndex(
        existing => existing.name === app.window_title && existing.category === app.category
    );

    if (existingAppIndex !== -1) {
        // Update existing app duration
        clientDaily.active_apps[existingAppIndex].total_duration_ms += log.duration_ms || 0;
    } else {
        // Add new app
        clientDaily.active_apps.push({
            name: app.window_title,
            category: app.category,
            total_duration_ms: log.duration_ms || 0
        });
    }
}

/**
 * Update top window titles
 */
function updateTopWindowTitles(clientDaily, log) {
    const windowTitle = log.application?.window_title;
    if (!windowTitle) return;

    // Find existing title
    const existingTitleIndex = clientDaily.top_window_titles.findIndex(
        existing => existing.title === windowTitle
    );

    if (existingTitleIndex !== -1) {
        // Increment count
        clientDaily.top_window_titles[existingTitleIndex].count += 1;
    } else {
        // Add new title
        clientDaily.top_window_titles.push({
            title: windowTitle,
            count: 1
        });
    }
}

/**
 * Update clipboard stats
 */
function updateClipboardStats(clientDaily, log) {
    const clipboard = log.clipboard_activity;
    if (!clipboard) return;

    clientDaily.clipboard_stats.total_copy += clipboard.copy_count || 0;
    clientDaily.clipboard_stats.total_paste += clipboard.paste_count || 0;
}

/**
 * Update keyboard shortcuts
 */
function updateKeyboardShortcuts(clientDaily, log) {
    const shortcuts = log.keyboard_shortcuts;
    if (!shortcuts || !Array.isArray(shortcuts)) return;

    for (const shortcut of shortcuts) {
        if (!shortcut.shortcut) continue;

        // Find existing shortcut
        const existingShortcutIndex = clientDaily.keyboard_shortcuts_used.findIndex(
            existing => existing.shortcut === shortcut.shortcut
        );

        if (existingShortcutIndex !== -1) {
            // Update existing shortcut
            clientDaily.keyboard_shortcuts_used[existingShortcutIndex].count += shortcut.count || 0;
            if (shortcut.timestamps && Array.isArray(shortcut.timestamps)) {
                clientDaily.keyboard_shortcuts_used[existingShortcutIndex].timestamps = 
                    clientDaily.keyboard_shortcuts_used[existingShortcutIndex].timestamps || [];
                clientDaily.keyboard_shortcuts_used[existingShortcutIndex].timestamps.push(...shortcut.timestamps);
            }
        } else {
            // Add new shortcut
            clientDaily.keyboard_shortcuts_used.push({
                shortcut: shortcut.shortcut,
                count: shortcut.count || 0,
                timestamps: shortcut.timestamps || []
            });
        }
    }
}

/**
 * Update activity timeline
 */
function updateActivityTimeline(clientDaily, log) {
    const app = log.application;
    if (!app || !app.window_title) return;

    // Add activity entry
    clientDaily.activity_timeline.push({
        time: new Date(log.start_time),
        dominant_app: app.window_title,
        activity: `Typing session - ${log.content?.word_count || 0} words`
    });
}

/**
 * Update sessions (only if content is non-empty)
 */
function updateSessions(clientDaily, log) {
    const reconstructedText = log.content?.reconstructed_text || '';
    const clipboardData = log.clipboard_activity?.clipboard_data || [];
    const hasClipboardContent = clipboardData.some(item => item.content && item.content.trim() !== '');

    // If clipboard has content, always add session as before
    if (hasClipboardContent) {
        const session = {
            reconstructed_text: reconstructedText,
            start_time: new Date(log.start_time),
            end_time: new Date(log.end_time),
            app: log.application?.window_title || 'unknown',
            clipboard: JSON.stringify(clipboardData)
        };
        clientDaily.sessions.push(session);
        return;
    }

    // If clipboard is empty, filter out gibberish reconstructed text
    const trimmedText = reconstructedText.trim();
    // 1. Ignore if only one character
    if (trimmedText.length <= 1) return;
    // 2. Ignore if text is repeated single character (e.g., 'aaaaa')
    if (/^(.)\1{2,}$/.test(trimmedText)) return;
    // 3. Ignore if text is a repeated short pattern (e.g., 'asdasdasd', 'abcdabcd')
    //    We'll check for repeated patterns up to 4 chars
    for (let len = 2; len <= 4; len++) {
        if (trimmedText.length >= len * 3) { // at least 3 repeats
            const pattern = trimmedText.slice(0, len);
            const regex = new RegExp(`^(?:${pattern})+$`);
            if (regex.test(trimmedText)) return;
        }
    }
    // 4. Ignore if text is a common gibberish pattern (e.g., 'asdasd', 'asdf', 'qwer', etc.)
    const gibberishPatterns = [
        /^a?s?d{2,}$/, // asd, asdd, asddd, etc.
        /^a?s?d?a?s?d?$/, // asdasd
        /^a?s?d?f{2,}$/, // asdf, asdff, etc.
        /^q?w?e?r{2,}$/, // qwer, qwerr, etc.
        /^z?x?c?v{2,}$/, // zxcv, zxcvv, etc.
    ];
    if (gibberishPatterns.some(re => re.test(trimmedText.toLowerCase()))) return;

    // Only add session if there's non-gibberish text content
    const session = {
        reconstructed_text: reconstructedText,
        start_time: new Date(log.start_time),
        end_time: new Date(log.end_time),
        app: log.application?.window_title || 'unknown',
        clipboard: ''
    };
    clientDaily.sessions.push(session);
}

/**
 * Update content stats by analyzing reconstructed text and clipboard data
 */
function updateContentStats(clientDaily, log) {
    // Initialize content_stats if not exists
    if (!clientDaily.content_stats) {
        clientDaily.content_stats = {
            offensive_keywords: [],
            Passwords: [],
            OTP: [],
            EmailAddresses: [],
            PhoneNumbers: [],
            IDNumbers: [],
            CreditCardNumbers: [],
            LocationReferences: [],
            Names: [],
            URLs: [],
            dates: [],
            ip_addresses: [],
            monetary_amounts: [],
            sexual_content: [],
            religious_references: []
        };
    }

    // Extract content from reconstructed text
    const reconstructedText = log.content?.reconstructed_text || '';
    const textContent = extractContentFromText(reconstructedText);

    // Extract content from clipboard data
    const clipboardData = log.clipboard_activity?.clipboard_data || [];
    let clipboardContent = '';
    
    for (const clipboardItem of clipboardData) {
        if (clipboardItem.content && typeof clipboardItem.content === 'string') {
            clipboardContent += clipboardItem.content + ' ';
        }
    }
    
    const clipboardTextContent = extractContentFromText(clipboardContent);

    // Merge all detected content
    const allContent = [textContent, clipboardTextContent];
    
    // Update each field in content_stats
    for (const [key, value] of Object.entries(textContent)) {
        if (Array.isArray(value) && value.length > 0) {
            // Add new items to existing array, avoiding duplicates
            clientDaily.content_stats[key] = [...new Set([...clientDaily.content_stats[key], ...value])];
        }
    }

    // Also update from clipboard content
    for (const [key, value] of Object.entries(clipboardTextContent)) {
        if (Array.isArray(value) && value.length > 0) {
            // Add new items to existing array, avoiding duplicates
            clientDaily.content_stats[key] = [...new Set([...clientDaily.content_stats[key], ...value])];
        }
    }
}