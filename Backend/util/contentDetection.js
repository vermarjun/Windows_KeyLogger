/**
 * Content detection utility for identifying sensitive data in text
 */

// Regex patterns for different types of content
const PATTERNS = {
    // Email addresses
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    
    // Phone numbers (various formats)
    phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    
    // Credit card numbers (basic pattern)
    creditCard: /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g,
    
    // URLs
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
    
    // IP addresses
    ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    
    // Dates (various formats)
    date: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g,
    
    // Monetary amounts
    monetary: /\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|EUR|GBP|INR)/gi,
    
    // OTP (6-digit codes)
    otp: /\b\d{6}\b/g,
    
    // Common password patterns
    password: /\b(?:password|passwd|pwd|secret|key|token|auth)\s*[=:]\s*\S+/gi,
    
    // ID numbers (SSN, Aadhar, etc.)
    idNumber: /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}\s\d{4}\s\d{4}\b/g,
    
    // Names (basic pattern - first letter capitalized followed by letters)
    name: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
    
    // Location references
    location: /\b(?:street|avenue|road|drive|lane|boulevard|city|state|country|zip|postal)\b/gi,
    
    // Offensive keywords (basic list - can be expanded)
    offensive: /\b(?:fuck|shit|bitch|ass|damn|hell|piss|cock|dick|pussy|cunt|whore|slut)\b/gi,
    
    // Sexual content keywords
    sexual: /\b(?:sex|sexual|porn|pornography|nude|naked|intimate|erotic|seductive)\b/gi,
    
    // Religious references
    religious: /\b(?:god|jesus|allah|buddha|hindu|christian|muslim|jewish|bible|quran|temple|church|mosque|synagogue)\b/gi
};

/**
 * Extract content from text using regex patterns
 * @param {string} text - The text to analyze
 * @returns {Object} - Object containing arrays of detected content
 */
export function extractContentFromText(text) {
    if (!text || typeof text !== 'string') {
        return {
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

    const result = {
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

    // Extract emails
    const emails = text.match(PATTERNS.email) || [];
    result.EmailAddresses = [...new Set(emails)];

    // Extract phone numbers
    const phones = text.match(PATTERNS.phone) || [];
    result.PhoneNumbers = [...new Set(phones)];

    // Extract credit card numbers
    const creditCards = text.match(PATTERNS.creditCard) || [];
    result.CreditCardNumbers = [...new Set(creditCards)];

    // Extract URLs
    const urls = text.match(PATTERNS.url) || [];
    result.URLs = [...new Set(urls)];

    // Extract IP addresses
    const ips = text.match(PATTERNS.ipAddress) || [];
    result.ip_addresses = [...new Set(ips)];

    // Extract dates
    const dates = text.match(PATTERNS.date) || [];
    result.dates = [...new Set(dates)];

    // Extract monetary amounts
    const monetary = text.match(PATTERNS.monetary) || [];
    result.monetary_amounts = [...new Set(monetary)];

    // Extract OTP codes
    const otps = text.match(PATTERNS.otp) || [];
    result.OTP = [...new Set(otps)];

    // Extract passwords
    const passwords = text.match(PATTERNS.password) || [];
    result.Passwords = [...new Set(passwords)];

    // Extract ID numbers
    const idNumbers = text.match(PATTERNS.idNumber) || [];
    result.IDNumbers = [...new Set(idNumbers)];

    // Extract names (basic detection)
    const names = text.match(PATTERNS.name) || [];
    result.Names = [...new Set(names)];

    // Extract location references
    const locations = text.match(PATTERNS.location) || [];
    result.LocationReferences = [...new Set(locations)];

    // Extract offensive keywords
    const offensive = text.match(PATTERNS.offensive) || [];
    result.offensive_keywords = [...new Set(offensive)];

    // Extract sexual content
    const sexual = text.match(PATTERNS.sexual) || [];
    result.sexual_content = [...new Set(sexual)];

    // Extract religious references
    const religious = text.match(PATTERNS.religious) || [];
    result.religious_references = [...new Set(religious)];

    return result;
}

/**
 * Merge content stats from multiple sources
 * @param {Array} contentStatsArray - Array of content stats objects
 * @returns {Object} - Merged content stats
 */
export function mergeContentStats(contentStatsArray) {
    const merged = {
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

    // Map all possible key casings to the canonical key
    const keyMap = {
        offensive_keywords: 'offensive_keywords',
        offensiveKeywords: 'offensive_keywords',
        Passwords: 'Passwords',
        passwords: 'Passwords',
        OTP: 'OTP',
        otp: 'OTP',
        EmailAddresses: 'EmailAddresses',
        emailAddresses: 'EmailAddresses',
        PhoneNumbers: 'PhoneNumbers',
        phoneNumbers: 'PhoneNumbers',
        IDNumbers: 'IDNumbers',
        idNumbers: 'IDNumbers',
        CreditCardNumbers: 'CreditCardNumbers',
        creditCardNumbers: 'CreditCardNumbers',
        LocationReferences: 'LocationReferences',
        locationReferences: 'LocationReferences',
        Names: 'Names',
        names: 'Names',
        URLs: 'URLs',
        urls: 'URLs',
        dates: 'dates',
        Dates: 'dates',
        ip_addresses: 'ip_addresses',
        ipAddresses: 'ip_addresses',
        monetary_amounts: 'monetary_amounts',
        monetaryAmounts: 'monetary_amounts',
        sexual_content: 'sexual_content',
        sexualContent: 'sexual_content',
        religious_references: 'religious_references',
        religiousReferences: 'religious_references'
    };

    for (const stats of contentStatsArray) {
        for (const [key, value] of Object.entries(stats)) {
            const normalizedKey = keyMap[key] || key;
            if (Array.isArray(value) && Array.isArray(merged[normalizedKey])) {
                merged[normalizedKey] = [...new Set([...merged[normalizedKey], ...value])];
            }
        }
    }

    return merged;
} 