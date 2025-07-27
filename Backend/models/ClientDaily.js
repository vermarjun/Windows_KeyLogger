import mongoose from 'mongoose';

const CognitiveBehaviorSchema = new mongoose.Schema({
    avg_typing_speed_wpm: Number,
    avg_backspace_freq: Number,
    avg_session_length_ms: Number,
    max_session_length_ms: Number,
    context_switch_count: Number,
    typing_bursts_avg_per_session: Number,
    peak_typing_speed_wpm: Number
}, { _id: false });

const ActiveAppSchema = new mongoose.Schema({
    name: String,
    category: String,
    total_duration_ms: Number
}, { _id: false });

const TopWindowTitleSchema = new mongoose.Schema({
    title: String,
    count: Number
}, { _id: false });

const ContentStatsSchema = new mongoose.Schema({
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
}, { _id: false });

const ClipboardStatsSchema = new mongoose.Schema({
    total_copy: Number,
    total_paste: Number
}, { _id: false });

const KeyboardShortcutSchema = new mongoose.Schema({
    shortcut: String,
    count: Number
}, { _id: false });

const ActivityTimelineSchema = new mongoose.Schema({
    time: Date,
    dominant_app: String,
    activity: String
}, { _id: false });

const SessionSchema = new mongoose.Schema({
    reconstructed_text: String,
    start_time: Date,
    end_time: Date,
    app: String,
    clipboard: String
}, { _id: false });

const ContentClassificationStatsSchema = new mongoose.Schema({}, { strict: false, _id: false });

const ClientDailySchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientProfile', required: true }, // Reference to ClientProfile
    date: { type: String, required: true },
    total_active_time_ms: Number,
    total_sessions: Number,
    total_words_typed: Number,
    total_keystrokes: Number,
    cognitive_behavior: CognitiveBehaviorSchema,
    active_apps: [ActiveAppSchema],
    top_window_titles: [TopWindowTitleSchema],
    content_classification_stats: [ContentClassificationStatsSchema],
    content_stats: ContentStatsSchema,
    clipboard_stats: ClipboardStatsSchema,
    keyboard_shortcuts_used: [KeyboardShortcutSchema],
    activity_timeline: [ActivityTimelineSchema],
    sessions: [SessionSchema],
    FinalReport: String,
    last_updated: { type: Date, default: Date.now }
});

const ClientDaily = mongoose.model('ClientDaily', ClientDailySchema);

// --- Utility Static Methods ---

// Fetch a client daily document by clientId and date
ClientDaily.fetchByClientIdAndDate = async function(clientId, date) {
    return this.findOne({ clientId, date });
};

// Update a specific field (subdocument) by clientId and date
ClientDaily.updateFieldByClientIdAndDate = async function(clientId, date, field, value) {
    const update = {};
    update[field] = value;
    return this.findOneAndUpdate(
        { clientId, date },
        { $set: update, last_updated: new Date() },
        { new: true, upsert: true }
    );
};

// Fetch a specific field (subdocument) by clientId and date
ClientDaily.fetchFieldByClientIdAndDate = async function(clientId, date, field) {
    const doc = await this.findOne({ clientId, date }).select(field);
    return doc ? doc[field] : null;
};

// Convenience methods for each subdocument
ClientDaily.updateActivityTimeline = async function(clientId, date, activity_timeline) {
    return this.updateFieldByClientIdAndDate(clientId, date, 'activity_timeline', activity_timeline);
};
ClientDaily.fetchActivityTimeline = async function(clientId, date) {
    return this.fetchFieldByClientIdAndDate(clientId, date, 'activity_timeline');
};

ClientDaily.updateCognitiveBehavior = async function(clientId, date, cognitive_behavior) {
    return this.updateFieldByClientIdAndDate(clientId, date, 'cognitive_behavior', cognitive_behavior);
};
ClientDaily.fetchCognitiveBehavior = async function(clientId, date) {
    return this.fetchFieldByClientIdAndDate(clientId, date, 'cognitive_behavior');
};

ClientDaily.updateContentStats = async function(clientId, date, content_stats) {
    return this.updateFieldByClientIdAndDate(clientId, date, 'content_stats', content_stats);
};
ClientDaily.fetchContentStats = async function(clientId, date) {
    return this.fetchFieldByClientIdAndDate(clientId, date, 'content_stats');
};

ClientDaily.updateClipboardStats = async function(clientId, date, clipboard_stats) {
    return this.updateFieldByClientIdAndDate(clientId, date, 'clipboard_stats', clipboard_stats);
};
ClientDaily.fetchClipboardStats = async function(clientId, date) {
    return this.fetchFieldByClientIdAndDate(clientId, date, 'clipboard_stats');
};

ClientDaily.updateKeyboardShortcutsUsed = async function(clientId, date, keyboard_shortcuts_used) {
    return this.updateFieldByClientIdAndDate(clientId, date, 'keyboard_shortcuts_used', keyboard_shortcuts_used);
};
ClientDaily.fetchKeyboardShortcutsUsed = async function(clientId, date) {
    return this.fetchFieldByClientIdAndDate(clientId, date, 'keyboard_shortcuts_used');
};

ClientDaily.updateSessions = async function(clientId, date, sessions) {
    return this.updateFieldByClientIdAndDate(clientId, date, 'sessions', sessions);
};
ClientDaily.fetchSessions = async function(clientId, date) {
    return this.fetchFieldByClientIdAndDate(clientId, date, 'sessions');
};

ClientDaily.updateTopWindowTitles = async function(clientId, date, top_window_titles) {
    return this.updateFieldByClientIdAndDate(clientId, date, 'top_window_titles', top_window_titles);
};
ClientDaily.fetchTopWindowTitles = async function(clientId, date) {
    return this.fetchFieldByClientIdAndDate(clientId, date, 'top_window_titles');
};

export default ClientDaily; 