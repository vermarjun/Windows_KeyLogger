import { KEYLOGGER_PROCESSING_CONFIG } from '../config.js';

class KeyloggerProcessor {
  constructor() {
    this.specialKeys = new Set([
      '[LCONTROL]', '[RCONTROL]', '[LSHIFT]', '[RSHIFT]', '[LALT]', '[RALT]',
      '[CAPSLOCK]', '[TAB]', '[ENTER]', '[SPACE]', '[BACKSPACE]', '[DELETE]',
      '[LEFT]', '[RIGHT]', '[UP]', '[DOWN]', '[HOME]', '[END]', '[PAGEUP]',
      '[PAGEDOWN]', '[INSERT]', '[ESC]', '[F1]', '[F2]', '[F3]', '[F4]',
      '[F5]', '[F6]', '[F7]', '[F8]', '[F9]', '[F10]', '[F11]', '[F12]'
    ]);

    this.applicationCategories = {
      'visual studio code': 'ide',
      'cursor': 'ide',
      'notepad': 'text_editor',
      'google chrome': 'browser',
      'firefox': 'browser',
      'microsoft word': 'document_editor',
      'excel': 'spreadsheet',
      'powerpoint': 'presentation',
      'discord': 'communication',
      'slack': 'communication',
      'zoom': 'communication'
    };
  }

  processKeyloggerData(rawData) {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Invalid input data: expected non-empty array');
    }

    // Sort data by timestamp
    const sortedData = this.sortByTimestamp(rawData);
    
    // Group data by application sessions
    const sessions = this.groupByApplicationSessions(sortedData);
    
    // Process each session
    const processedSessions = sessions.map(session => this.processSession(session));
    
    return processedSessions;
  }

  sortByTimestamp(data) {
    return data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  groupByApplicationSessions(data) {
    const sessions = [];
    let currentSession = [];
    let lastWindow = null;
    let lastTimestamp = null;

    for (const event of data) {
      const currentWindow = event.window;
      const currentTimestamp = new Date(event.timestamp);

      // Start new session if window changed or there's a gap > threshold
      if (lastWindow && 
          (currentWindow !== lastWindow || 
           (currentTimestamp - lastTimestamp) > KEYLOGGER_PROCESSING_CONFIG.sessionGapThreshold)) {
        if (currentSession.length > 0) {
          sessions.push([...currentSession]);
          currentSession = [];
        }
      }

      currentSession.push(event);
      lastWindow = currentWindow;
      lastTimestamp = currentTimestamp;
    }

    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  processSession(sessionData) {
    const startTime = new Date(sessionData[0].timestamp);
    const endTime = new Date(sessionData[sessionData.length - 1].timestamp);
    const duration = endTime - startTime;

    const application = this.extractApplicationInfo(sessionData[0].window);
    const behavioralMetrics = this.calculateBehavioralMetrics(sessionData);
    const content = this.reconstructContent(sessionData);
    const clipboardActivity = this.detectClipboardActivity(sessionData);
    const keyboardShortcuts = this.detectKeyboardShortcuts(sessionData);
    const rawEvents = this.formatRawEvents(sessionData);
    const metadata = this.generateMetadata(sessionData, content);

    // 1. Add object_id field
    const object_id = this.generateHash(
      application.name + '|' + application.window_title + '|' + startTime.toISOString()
    );

    return {
      object_id, // new field
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_ms: duration,
      application,
      behavioral_metrics: behavioralMetrics,
      content,
      raw_events: rawEvents,
      clipboard_activity: clipboardActivity,
      keyboard_shortcuts: keyboardShortcuts,
      metadata
    };
  }

  extractApplicationInfo(windowTitle) {
    const lowerTitle = windowTitle.toLowerCase();
    let appName = 'unknown';
    let category = 'other';

    // Extract application name from window title
    if (lowerTitle.includes('visual studio code')) {
      appName = 'visual_studio_code';
    } else if (lowerTitle.includes('cursor')) {
      appName = 'cursor';
    } else if (lowerTitle.includes('notepad')) {
      appName = 'notepad';
    } else if (lowerTitle.includes('chrome')) {
      appName = 'google_chrome';
    } else if (lowerTitle.includes('firefox')) {
      appName = 'firefox';
    }

    category = this.applicationCategories[appName] || 'other';

    return {
      name: appName,
      window_title: windowTitle,
      category: category
    };
  }

  calculateBehavioralMetrics(sessionData) {
    const typingEvents = sessionData.filter(event => 
      !this.specialKeys.has(event.key) && 
      event.key.length === 1 && 
      event.key !== '\n'
    );

    const backspaceEvents = sessionData.filter(event => 
      event.key === '[BACKSPACE]'
    );

    // Calculate typing speed (WPM)
    const typingSpeedWpm = this.calculateTypingSpeed(typingEvents, sessionData);
    
    // Calculate typing bursts
    const typingBursts = this.calculateTypingBursts(typingEvents);
    
    // Calculate backspace frequency
    const backspaceFrequency = typingEvents.length > 0 ? 
      backspaceEvents.length / typingEvents.length : 0;

    return {
      typing_speed_wpm: Math.round(typingSpeedWpm),
      typing_bursts: typingBursts,
      backspace_frequency: Math.round(backspaceFrequency * KEYLOGGER_PROCESSING_CONFIG.backspacePrecision) / KEYLOGGER_PROCESSING_CONFIG.backspacePrecision
    };
  }

  calculateTypingSpeed(typingEvents, allEvents) {
    if (typingEvents.length < 2) return 0;

    const startTime = new Date(allEvents[0].timestamp);
    const endTime = new Date(allEvents[allEvents.length - 1].timestamp);
    const durationMinutes = (endTime - startTime) / (1000 * 60);

    if (durationMinutes === 0) return 0;

    // Assume average word length of 5 characters
    const wordsTyped = typingEvents.length / 5;
    return wordsTyped / durationMinutes;
  }

  calculateTypingBursts(typingEvents) {
    if (typingEvents.length < 2) return 0;

    let bursts = 0;
    let inBurst = false;

    for (let i = 1; i < typingEvents.length; i++) {
      const timeDiff = new Date(typingEvents[i].timestamp) - 
                      new Date(typingEvents[i-1].timestamp);
      
      if (timeDiff < 500) { // Less than 500ms between keystrokes
        if (!inBurst) {
          bursts++;
          inBurst = true;
        }
      } else {
        inBurst = false;
      }
    }

    return bursts;
  }

  reconstructContent(sessionData) {
    let text = '';
    let capsLockOn = false;
    let shiftPressed = false;
    let ctrlPressed = false;
    let altPressed = false;

    // Complete US keyboard shifted character map
    const shiftedCharMap = {
      '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
      '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
      '-': '_', '=': '+', '[': '{', ']': '}', '\\': '|',
      ';': ':', "'": '"', ',': '<', '.': '>', '/': '?', '`': '~'
    };

    for (let i = 0; i < sessionData.length; i++) {
      const event = sessionData[i];
      const key = event.key;

      // Skip clipboard events
      if (key.length > 1 && key.startsWith('%ClipBoardText%')) {
        continue;
      }

      // Modifier key state tracking
      if (key === '[CAPSLOCK]') {
        capsLockOn = !capsLockOn;
        continue;
      } else if (key === '[LSHIFT]' || key === '[RSHIFT]') {
        shiftPressed = true;
        continue;
      } else if (key === '[LCONTROL]' || key === '[RCONTROL]') {
        ctrlPressed = true;
        continue;
      } else if (key === '[LALT]' || key === '[RALT]') {
        altPressed = true;
        continue;
      } else if (key === '[TAB]') {
        text += '\t';
        continue;
      } else if (key === '[BACKSPACE]') {
        text = text.slice(0, -1);
        continue;
      } else if (key === '\n' || key === '[ENTER]') {
        text += '\n';
        continue;
      } else if (key === '[SPACE]') {
        text += ' ';
        continue;
      } else if (key === '_') { // Parse '_' as space
        text += ' ';
        continue;
      }

      // If Ctrl or Alt is pressed, treat as shortcut, do not add to text
      if (ctrlPressed || altPressed) {
        ctrlPressed = false;
        altPressed = false;
        continue;
      }

      // Handle shifted characters and normal characters
      if (key.length === 1 && !this.specialKeys.has(key)) {
        let char = key;
        if (shiftPressed) {
          if (shiftedCharMap[char]) {
            char = shiftedCharMap[char];
          } else {
            char = char.toUpperCase();
          }
        } else if (capsLockOn && /[a-z]/.test(char)) {
          char = char.toUpperCase();
        }
        text += char;
        shiftPressed = false; // Only applies to next key
        continue;
      }

      // Reset shift if a non-shift special key is pressed
      if (this.specialKeys.has(key) && !key.includes('SHIFT') && !key.includes('CONTROL') && !key.includes('ALT')) {
        shiftPressed = false;
      }
    }

    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const contentType = this.detectContentType(text, sessionData[0].window);

    return {
      reconstructed_text: text.trim(),
      text_length: text.trim().length,
      word_count: wordCount,
      language: 'en', // Could be enhanced with language detection
      content_type: contentType
    };
  }

  detectContentType(text, windowTitle) {
    const lowerTitle = windowTitle.toLowerCase();
    const lowerText = text.toLowerCase();

    if (lowerTitle.includes('visual studio code') || lowerTitle.includes('cursor')) {
      if (lowerText.includes('//') || lowerText.includes('/*') || 
          lowerText.includes('function') || lowerText.includes('const')) {
        return 'code';
      }
      return 'code_comment';
    } else if (lowerTitle.includes('chrome') || lowerTitle.includes('firefox')) {
      return 'web_content';
    } else if (lowerTitle.includes('notepad')) {
      return 'plain_text';
    }

    return 'text';
  }

  detectClipboardActivity(sessionData) {
    let copyCount = 0;
    let pasteCount = 0;
    const clipboardData = [];

    for (let i = 0; i < sessionData.length; i++) {
      const event = sessionData[i];
      const key = event.key;
      // Detect clipboard event by key field
      if (key.length > 1 && key.startsWith('%ClipBoardText%')) {
        // Format: %ClipBoardText%<actual clipboard content>
        const clipboardContent = key.replace('%ClipBoardText%', '');
        const hash = this.generateHash(`clipboard_${event.timestamp}_${clipboardContent}`);
        clipboardData.push({
          hash: hash,
          timestamp: new Date(event.timestamp).toISOString(),
          content: clipboardContent,
          content_type: 'text',
          sensitive: false // Could add detection here if needed
        });
        continue;
      }
      // (Retain old logic for copy/paste detection if needed)
      // Detect Ctrl+C (copy)
      if (i < sessionData.length - 1) {
        const next = sessionData[i + 1];
        if ((key === '[LCONTROL]' || key === '[RCONTROL]') && next.key === 'c') {
          copyCount++;
        }
        // Detect Ctrl+V (paste)
        if ((key === '[LCONTROL]' || key === '[RCONTROL]') && next.key === 'v') {
          pasteCount++;
        }
      }
    }

    return {
      copy_count: copyCount,
      paste_count: pasteCount,
      clipboard_data: clipboardData
    };
  }

  detectKeyboardShortcuts(sessionData) {
    const shortcuts = {};

    for (let i = 0; i < sessionData.length - 1; i++) {
      const current = sessionData[i];
      const next = sessionData[i + 1];

      let shortcut = null;

      // Detect common shortcuts
      if (current.key === '[LCONTROL]' || current.key === '[RCONTROL]') {
        switch (next.key) {
          case 's': shortcut = 'ctrl+s'; break;
          case 'c': shortcut = 'ctrl+c'; break;
          case 'v': shortcut = 'ctrl+v'; break;
          case 'x': shortcut = 'ctrl+x'; break;
          case 'z': shortcut = 'ctrl+z'; break;
          case 'y': shortcut = 'ctrl+y'; break;
          case 'a': shortcut = 'ctrl+a'; break;
          case 'f': shortcut = 'ctrl+f'; break;
          case 'n': shortcut = 'ctrl+n'; break;
          case 'o': shortcut = 'ctrl+o'; break;
        }
      }

      if (shortcut) {
        if (!shortcuts[shortcut]) {
          shortcuts[shortcut] = {
            shortcut: shortcut,
            count: 0,
            timestamps: []
          };
        }
        shortcuts[shortcut].count++;
        shortcuts[shortcut].timestamps.push(new Date(next.timestamp).getTime());
      }
    }

    return Object.values(shortcuts);
  }

  formatRawEvents(sessionData) {
    return sessionData.slice(0, 50).map(event => ({ // Limit to first 50 events
      key: event.key,
      timestamp: new Date(event.timestamp).getTime()
    }));
  }

  generateMetadata(sessionData, content) {
    // Determine privacy level based on content
    let privacyLevel = 'low';
    
    const sensitivePatterns = [
      /password/i, /ssn/i, /social security/i, /credit card/i,
      /\d{4}-\d{4}-\d{4}-\d{4}/, /\d{3}-\d{2}-\d{4}/
    ];

    const hasSensitiveContent = sensitivePatterns.some(pattern => 
      pattern.test(content.reconstructed_text)
    );

    if (hasSensitiveContent) {
      privacyLevel = 'high';
    } else if (content.text_length > 100) {
      privacyLevel = 'medium';
    }

    return {
      privacy_level: privacyLevel
    };
  }

  generateHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to specified bit size integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }
}

// Example usage
export function processKeyloggerData(rawData) {
  const processor = new KeyloggerProcessor();
  
  try {
    const processedSessions = processor.processKeyloggerData(rawData);
    return processedSessions;
  } catch (error) {
    console.error('Error processing keylogger data:', error);
    return null;
  }
}
