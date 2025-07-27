import ClientProfile from '../models/ClientProfile.js';
import ClientDaily from '../models/ClientDaily.js';
import { mergeContentStats } from './contentDetection.js';



// OPTIMIZE THIS, CURRENT IMPLEMENTATION MAKES ME FUCKING SICK.

// THIS IS SHIT. I HAVE TO OPTIMIZE IT, THERE IS ABSOLUTELY NO NEED TO ITERATE OVER ALL THE DAILIES, CURRENT PROFILE STORES PAST AND I JUST NEED TO UPDATE FOR TODAY.


/**
 * Aggregates and updates ClientProfile for a given clientId (hostname)
 * Updates: TypingSpeed, total_sessions, last_seen, total_days_active, total_active_time, apps_used
 * Does NOT touch: offensive_keywords, Passwords, OTP, EmailAddresses, PhoneNumbers, IDNumbers, CreditCardNumbers, LocationReferences, Names, URLs, notes, location, system_info, tags, display_name, config
 * @param {string} clientId - The hostname/deviceName
 */
export async function updateClientProfileAggregate(clientId) {
    // console.log("------------------------------------------CLIENT PROFILE UPDATER CALLED!!!------------------------------------------------------");
    // Fetch all daily logs for this client
    const allDaily = await ClientDaily.find({ clientId });
    if (!allDaily.length) {
        // console.log("------------------------------------------NO CLIENT DAILY FOUND------------------------------------------------------");
        return;
    }

    // Aggregate total_sessions and weighted TypingSpeed
    let totalSessions = 0;
    let weightedTypingSpeedSum = 0;
    let weightedTypingSpeedCount = 0;
    let totalActiveTime = 0;
    let totalDaysActive = 0;
    const appsUsedMap = new Map(); // Use Map to track unique apps with summed time

    for (const daily of allDaily) {
        // Robustly parse total_sessions
        let sessions = 0;
        if (daily.total_sessions && typeof daily.total_sessions === 'object' && daily.total_sessions.$numberInt) {
            sessions = parseInt(daily.total_sessions.$numberInt, 10);
        } else if (typeof daily.total_sessions === 'number') {
            sessions = daily.total_sessions;
        }
        // Robustly parse total_active_time_ms
        let activeTime = 0;
        if (daily.total_active_time_ms && typeof daily.total_active_time_ms === 'object' && daily.total_active_time_ms.$numberInt) {
            activeTime = parseInt(daily.total_active_time_ms.$numberInt, 10);
        } else if (typeof daily.total_active_time_ms === 'number') {
            activeTime = daily.total_active_time_ms;
        }
        totalSessions += sessions;
        totalActiveTime += activeTime;
        
        // Count unique days (each daily record represents one day)
        if (sessions > 0 || activeTime > 0) {
            totalDaysActive++;
        }
        
        // Robustly parse avg_typing_speed_wpm
        let avgTypingSpeed = daily.cognitive_behavior?.avg_typing_speed_wpm;
        let avgTypingSpeedVal = 0;
        if (avgTypingSpeed && typeof avgTypingSpeed === 'object' && avgTypingSpeed.$numberDouble) {
            avgTypingSpeedVal = parseFloat(avgTypingSpeed.$numberDouble);
        } else if (typeof avgTypingSpeed === 'number') {
            avgTypingSpeedVal = avgTypingSpeed;
        }
        if (avgTypingSpeedVal && sessions > 0) {
            weightedTypingSpeedSum += avgTypingSpeedVal * sessions;
            weightedTypingSpeedCount += sessions;
        }
        
        // Aggregate apps_used data from active_apps
        if (daily.active_apps && Array.isArray(daily.active_apps)) {
            for (const app of daily.active_apps) {
                if (app.category && app.total_duration_ms) {
                    let timeSpent = 0;
                    if (typeof app.total_duration_ms === 'object' && app.total_duration_ms.$numberInt) {
                        timeSpent = parseInt(app.total_duration_ms.$numberInt, 10);
                    } else if (typeof app.total_duration_ms === 'number') {
                        timeSpent = app.total_duration_ms;
                    }
                    const existingTime = appsUsedMap.get(app.category) || 0;
                    appsUsedMap.set(app.category, existingTime + timeSpent);
                }
            }
        }
    }

    // Weighted average typing speed
    const TypingSpeed = weightedTypingSpeedCount ? (weightedTypingSpeedSum / weightedTypingSpeedCount) : undefined;

    // Convert apps_used Map to array format
    const appsUsed = Array.from(appsUsedMap.entries()).map(([appname, timespent]) => ({
        appname,
        timespent
    }));

    // Aggregate content stats from all daily logs (simple version)
    const contentStatsArray = allDaily.map(daily => daily.content_stats || {});
    // List of all fields to aggregate
    const allFields = [
        'offensive_keywords', 'Passwords', 'OTP', 'EmailAddresses', 'PhoneNumbers', 'IDNumbers',
        'CreditCardNumbers', 'LocationReferences', 'Names', 'URLs', 'dates', 'ip_addresses',
        'monetary_amounts', 'sexual_content', 'religious_references'
    ];
    const aggregatedContentStats = {};
    for (const field of allFields) {
        // Concatenate all arrays for this field, filter out non-arrays, deduplicate
        const allValues = contentStatsArray
            .map(obj => Array.isArray(obj?.[field]) ? obj[field] : [])
            .flat();
        aggregatedContentStats[field] = [...new Set(allValues.filter(v => v != null))];
    }

    // ---
    // notes, location, and system_info are not aggregated from daily logs and are left untouched here.
    // ---

    // Update ClientProfile
    const updateObj = {
        total_sessions: totalSessions,
        TypingSpeed,
        last_seen: new Date(),
        total_days_active: totalDaysActive,
        total_active_time: totalActiveTime,
        apps_used: appsUsed,
        ...aggregatedContentStats // All sensitive fields as unique sets
    };
    // console.log('Final updateObj for ClientProfile:', updateObj);
    const updateResult = await ClientProfile.findOneAndUpdate(
        { _id: clientId },
        { $set: updateObj },
        { new: true }
    );
    // console.log('ClientProfile update result:', updateResult);
}

/**
 * Updates only the config field for a given client
 * @param {string} clientId - The hostname/deviceName
 * @param {Object} config - The config object to update
 */
export async function updateClientConfig(clientId, config) {
    await ClientProfile.findOneAndUpdate(
        { _id: clientId },
        {
            $set: {
                config: config
            }
        },
        { new: true }
    );
}

/**
 * Updates only the tags field for a given client
 * @param {string} clientId - The hostname/deviceName
 * @param {Array} tags - The tags array to update
 */
export async function updateClientTags(clientId, tags) {
    await ClientProfile.findOneAndUpdate(
        { _id: clientId },
        {
            $set: {
                tags: tags
            }
        },
        { new: true }
    );
} 