import ClientProfile from '../models/ClientProfile.js';
import ClientDaily from '../models/ClientDaily.js';
import { mergeContentStats } from './contentDetection.js';

/**
 * Aggregates and updates ClientProfile for a given clientId (hostname)
 * Only updates TypingSpeed, total_sessions, last_seen
 * Does NOT touch: offensive_keywords, Passwords, OTP, EmailAddresses, PhoneNumbers, IDNumbers, CreditCardNumbers, LocationReferences, Names, URLs, notes, location, system_info, tags, display_name
 * @param {string} clientId - The hostname/deviceName
 */
export async function updateClientProfileAggregate(clientId) {
    // Fetch all daily logs for this client
    const allDaily = await ClientDaily.find({ clientId });
    if (!allDaily.length) return;

    // Aggregate total_sessions and weighted TypingSpeed
    let totalSessions = 0;
    let weightedTypingSpeedSum = 0;
    let weightedTypingSpeedCount = 0;

    for (const daily of allDaily) {
        const sessions = daily.total_sessions || 0;
        totalSessions += sessions;
        if (daily.cognitive_behavior?.avg_typing_speed_wpm && sessions > 0) {
            weightedTypingSpeedSum += daily.cognitive_behavior.avg_typing_speed_wpm * sessions;
            weightedTypingSpeedCount += sessions;
        }
    }

    // Weighted average typing speed
    const TypingSpeed = weightedTypingSpeedCount ? (weightedTypingSpeedSum / weightedTypingSpeedCount) : undefined;

    // Aggregate content stats from all daily logs
    const contentStatsArray = allDaily
        .map(daily => daily.content_stats)
        .filter(stats => stats && Object.keys(stats).length > 0);
    
    const aggregatedContentStats = contentStatsArray.length > 0 
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

    // Update ClientProfile
    await ClientProfile.findOneAndUpdate(
        { deviceName: clientId },
        {
            $set: {
                total_sessions: totalSessions,
                TypingSpeed,
                last_seen: new Date(),
                ...aggregatedContentStats
            }
        },
        { new: true }
    );
} 