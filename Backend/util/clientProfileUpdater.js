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
    console.log("------------------------------------------CLIENT PROFILE UPDATER CALLED!!!------------------------------------------------------");
    // Fetch all daily logs for this client
    const allDaily = await ClientDaily.find({ clientId });
    if (!allDaily.length) {
        console.log("------------------------------------------NO CLIENT DAILY FOUND------------------------------------------------------");
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
        const sessions = daily.total_sessions || 0;
        const activeTime = daily.total_active_time_ms || 0;
        
        totalSessions += sessions;
        totalActiveTime += activeTime;
        
        // Count unique days (each daily record represents one day)
        if (sessions > 0 || activeTime > 0) {
            totalDaysActive++;
        }
        
        if (daily.cognitive_behavior?.avg_typing_speed_wpm && sessions > 0) {
            weightedTypingSpeedSum += daily.cognitive_behavior.avg_typing_speed_wpm * sessions;
            weightedTypingSpeedCount += sessions;
        }
        
        // Aggregate apps_used data
        if (daily.apps_used && Array.isArray(daily.apps_used)) {
            for (const app of daily.apps_used) {
                if (app.appname && app.timespent) {
                    const existingTime = appsUsedMap.get(app.appname) || 0;
                    appsUsedMap.set(app.appname, existingTime + app.timespent);
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

    // Aggregate content stats from all daily logs
    const contentStatsArray = allDaily
        .map(daily => daily.content_stats)
        .filter(stats => stats && Object.keys(stats).length > 0);

    // Merge all sensitive fields as unique sets across all days
    const aggregatedContentStats = (() => {
        // Use mergeContentStats for all array fields
        const merged = contentStatsArray.length > 0 
            ? mergeContentStats(contentStatsArray)
            : {
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
        // Explicitly ensure all are unique sets (robustness)
        for (const key of Object.keys(merged)) {
            if (Array.isArray(merged[key])) {
                merged[key] = [...new Set(merged[key].filter(v => v != null))];
            }
        }
        return merged;
    })();

    // ---
    // notes, location, and system_info are not aggregated from daily logs and are left untouched here.
    // ---

    // Update ClientProfile
    await ClientProfile.findOneAndUpdate(
        { _id: clientId },
        {
            $set: {
                total_sessions: totalSessions,
                TypingSpeed,
                last_seen: new Date(),
                total_days_active: totalDaysActive,
                total_active_time: totalActiveTime,
                apps_used: appsUsed,
                ...aggregatedContentStats // All sensitive fields as unique sets
            }
        },
        { new: true }
    );
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