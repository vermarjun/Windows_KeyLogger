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
    URLs: [String]
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
    app: {
        name: String,
        category: String
    },
    clipboard: String
}, { _id: false });

const ContentClassificationStatsSchema = new mongoose.Schema({}, { strict: false, _id: false });

const ClientSchema = new mongoose.Schema({
    client_id: { type: String, required: true }, // Client id hostname
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

const Client = mongoose.model('Client', ClientSchema);

// --- Utility Static Methods ---

// Fetch a client document by client_id and date
Client.fetchByClientIdAndDate = async function(client_id, date) {
    return this.findOne({ client_id, date });
};

// Update a specific field (subdocument) by client_id and date
Client.updateFieldByClientIdAndDate = async function(client_id, date, field, value) {
    const update = {};
    update[field] = value;
    return this.findOneAndUpdate(
        { client_id, date },
        { $set: update, last_updated: new Date() },
        { new: true, upsert: true }
    );
};

// Fetch a specific field (subdocument) by client_id and date
Client.fetchFieldByClientIdAndDate = async function(client_id, date, field) {
    const doc = await this.findOne({ client_id, date }).select(field);
    return doc ? doc[field] : null;
};

// Convenience methods for each subdocument
Client.updateActivityTimeline = async function(client_id, date, activity_timeline) {
    return this.updateFieldByClientIdAndDate(client_id, date, 'activity_timeline', activity_timeline);
};
Client.fetchActivityTimeline = async function(client_id, date) {
    return this.fetchFieldByClientIdAndDate(client_id, date, 'activity_timeline');
};

Client.updateCognitiveBehavior = async function(client_id, date, cognitive_behavior) {
    return this.updateFieldByClientIdAndDate(client_id, date, 'cognitive_behavior', cognitive_behavior);
};
Client.fetchCognitiveBehavior = async function(client_id, date) {
    return this.fetchFieldByClientIdAndDate(client_id, date, 'cognitive_behavior');
};

Client.updateContentStats = async function(client_id, date, content_stats) {
    return this.updateFieldByClientIdAndDate(client_id, date, 'content_stats', content_stats);
};
Client.fetchContentStats = async function(client_id, date) {
    return this.fetchFieldByClientIdAndDate(client_id, date, 'content_stats');
};

Client.updateClipboardStats = async function(client_id, date, clipboard_stats) {
    return this.updateFieldByClientIdAndDate(client_id, date, 'clipboard_stats', clipboard_stats);
};
Client.fetchClipboardStats = async function(client_id, date) {
    return this.fetchFieldByClientIdAndDate(client_id, date, 'clipboard_stats');
};

Client.updateKeyboardShortcutsUsed = async function(client_id, date, keyboard_shortcuts_used) {
    return this.updateFieldByClientIdAndDate(client_id, date, 'keyboard_shortcuts_used', keyboard_shortcuts_used);
};
Client.fetchKeyboardShortcutsUsed = async function(client_id, date) {
    return this.fetchFieldByClientIdAndDate(client_id, date, 'keyboard_shortcuts_used');
};

Client.updateSessions = async function(client_id, date, sessions) {
    return this.updateFieldByClientIdAndDate(client_id, date, 'sessions', sessions);
};
Client.fetchSessions = async function(client_id, date) {
    return this.fetchFieldByClientIdAndDate(client_id, date, 'sessions');
};

Client.updateTopWindowTitles = async function(client_id, date, top_window_titles) {
    return this.updateFieldByClientIdAndDate(client_id, date, 'top_window_titles', top_window_titles);
};
Client.fetchTopWindowTitles = async function(client_id, date) {
    return this.fetchFieldByClientIdAndDate(client_id, date, 'top_window_titles');
};

export default Client; 