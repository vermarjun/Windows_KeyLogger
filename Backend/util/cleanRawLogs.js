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
      // IDEs
      'visual studio': 'ide',
      'visual studio code': 'ide',
      'cursor': 'ide',
      'pycharm': 'ide',
      'intellij idea': 'ide',
      'webstorm': 'ide',
      'android studio': 'ide',
      'eclipse': 'ide',
      'netbeans': 'ide',
      'rider': 'ide',
      'xamarin': 'ide',
      'codeblocks': 'ide',
      'dev c++': 'ide',
      'arduino ide': 'ide',
      'qt creator': 'ide',
      'thunkable': 'ide',
      'xcode': 'ide',
      'bluej': 'ide',
      'greenfoot': 'ide',

      // Text Editors
      'notepad': 'text_editor',
      'notepad++': 'text_editor',
      'sublime text': 'text_editor',
      'atom': 'text_editor',
      'vim': 'text_editor',
      'emacs': 'text_editor',
      'gedit': 'text_editor',
      'brackets': 'text_editor',

      // Browsers
      'google chrome': 'browser',
      'microsoft edge': 'browser',
      'firefox': 'browser',
      'opera': 'browser',
      'brave': 'browser',
      'tor browser': 'browser',
      'vivaldi': 'browser',
      'maxthon': 'browser',
      'avast secure browser': 'browser',
      'uc browser': 'browser',

      // Document Editors
      'microsoft word': 'document_editor',
      'libreoffice writer': 'document_editor',
      'wps writer': 'document_editor',
      'notion': 'document_editor',
      'scrivener': 'document_editor',
      'typora': 'document_editor',
      'focuswriter': 'document_editor',
      'wordpad': 'document_editor',
      'zoho writer': 'document_editor',

      // Spreadsheets
      'excel': 'spreadsheet',
      'libreoffice calc': 'spreadsheet',
      'wps spreadsheets': 'spreadsheet',
      'google sheets': 'spreadsheet',
      'gnumeric': 'spreadsheet',

      // Presentations
      'powerpoint': 'presentation',
      'libreoffice impress': 'presentation',
      'wps presentation': 'presentation',
      'google slides': 'presentation',
      'prezi': 'presentation',
      'canva presentations': 'presentation',

      // Communication
      'discord': 'communication',
      'slack': 'communication',
      'zoom': 'communication',
      'microsoft teams': 'communication',
      'skype': 'communication',
      'google meet': 'communication',
      'telegram': 'communication',
      'whatsapp': 'communication',
      'signal': 'communication',
      'facebook messenger': 'communication',
      'outlook': 'communication',
      'thunderbird': 'communication',
      'teamviewer': 'communication',
      'anydesk': 'communication',
      'viber': 'communication',
      'zoom chat': 'communication',

      // Design & Creative
      'adobe photoshop': 'design',
      'adobe illustrator': 'design',
      'adobe xd': 'design',
      'coreldraw': 'design',
      'figma': 'design',
      'canva': 'design',
      'paint.net': 'design',
      'krita': 'design',
      'gimp': 'design',
      'ms paint': 'design',
      'affinity designer': 'design',
      'adobe indesign': 'design',
      'blender': 'design',
      'inkscape': 'design',
      'sketchbook': 'design',
      'mediabang paint': 'design',

      // Video & Media Editing
      'adobe premiere pro': 'video_editing',
      'filmora': 'video_editing',
      'davinci resolve': 'video_editing',
      'sony vegas': 'video_editing',
      'obs studio': 'video_editing',
      'camstudio': 'video_editing',
      'lightworks': 'video_editing',
      'shotcut': 'video_editing',
      'openshot': 'video_editing',
      'hitfilm express': 'video_editing',
      'kdenlive': 'video_editing',
      'handbrake': 'video_editing',

      // Audio Editing
      'audacity': 'audio_editing',
      'fl studio': 'audio_editing',
      'ableton live': 'audio_editing',
      'adobe audition': 'audio_editing',
      'reaper': 'audio_editing',
      'logic pro': 'audio_editing',
      'ocenaudio': 'audio_editing',

      // Utilities
      'task manager': 'system_utility',
      'control panel': 'system_utility',
      'windows settings': 'system_utility',
      'command prompt': 'system_utility',
      'powershell': 'system_utility',
      'terminal': 'system_utility',
      'git bash': 'system_utility',
      'putty': 'system_utility',
      'docker desktop': 'system_utility',
      'vmware': 'system_utility',
      'virtualbox': 'system_utility',
      '7-zip': 'system_utility',
      'winrar': 'system_utility',
      'everything': 'system_utility',
      'ccleaner': 'system_utility',
      'process hacker': 'system_utility',
      'sysinternals': 'system_utility',
      'rufus': 'system_utility',
      'ventoy': 'system_utility',
      'autoruns': 'system_utility',
      'speccy': 'system_utility',
      'hwinfo': 'system_utility',
      'cpu-z': 'system_utility',

      // Media Players
      'vlc media player': 'media_player',
      'windows media player': 'media_player',
      'mpv player': 'media_player',
      'foobar2000': 'media_player',
      'itunes': 'media_player',
      'spotify': 'media_player',
      'audible': 'media_player',
      'groove music': 'media_player',
      'winamp': 'media_player',
      'media monkey': 'media_player',

      // Game Launchers
      'steam': 'gaming',
      'epic games launcher': 'gaming',
      'riot client': 'gaming',
      'battle.net': 'gaming',
      'origin': 'gaming',
      'gog galaxy': 'gaming',
      'rockstar launcher': 'gaming',
      'twitch desktop app': 'gaming',
      'ubisoft connect': 'gaming',
      'minecraft launcher': 'gaming',
      'roblox player': 'gaming',

      // File Sync / Cloud
      'onedrive': 'cloud_storage',
      'google drive': 'cloud_storage',
      'dropbox': 'cloud_storage',
      'mega': 'cloud_storage',
      'box': 'cloud_storage',
      'pcloud': 'cloud_storage',
      'icloud': 'cloud_storage',
      'nextcloud': 'cloud_storage',
      'syncthing': 'cloud_storage',

      // Notes & Productivity
      'onenote': 'productivity',
      'evernote': 'productivity',
      'notion': 'productivity',
      'todoist': 'productivity',
      'ticktick': 'productivity',
      'obsidian': 'productivity',
      'joplin': 'productivity',
      'simplenote': 'productivity',
      'workflowy': 'productivity',
      'todolist': 'productivity',
      'milanote': 'productivity',

      // Security
      'windows defender': 'security',
      'kaspersky': 'security',
      'bitdefender': 'security',
      'norton': 'security',
      'avast': 'security',
      'mcafee': 'security',
      'eset nod32': 'security',
      'malwarebytes': 'security',
      'glasswire': 'security',
      'zonealarm': 'security',

      // Finance
      'excel': 'finance',
      'quickbooks': 'finance',
      'gnu cash': 'finance',
      'zoho books': 'finance',
      'microsoft money': 'finance',
      'wave accounting': 'finance',
      'tally': 'finance',
      'mint': 'finance',

      // DevOps / Backend Tools
      'postman': 'devops',
      'insomnia': 'devops',
      'docker desktop': 'devops',
      'kubernetes dashboard': 'devops',
      'mongodb compass': 'devops',
      'dbeaver': 'devops',
      'robo 3t': 'devops',
      'tableplus': 'devops',
      'redis desktop manager': 'devops',
      'beekeeper studio': 'devops',
      'ngrok': 'devops',
      'k6': 'devops',
      'terraform': 'devops',

      // AI / ML / Data Science
      'anaconda navigator': 'data_science',
      'jupyter notebook': 'data_science',
      'spyder': 'data_science',
      'r studio': 'data_science',
      'orange': 'data_science',
      'weka': 'data_science',
      'rapidminer': 'data_science',
      'knime': 'data_science',
      'tableau': 'data_science',
      'power bi': 'data_science',

      // Virtual Meetings / Collaboration
      'zoom': 'collaboration',
      'microsoft teams': 'collaboration',
      'slack': 'collaboration',
      'google meet': 'collaboration',
      'webex': 'collaboration',
      'bluejeans': 'collaboration',
      'teamviewer': 'collaboration',
      'anydesk': 'collaboration',

      // Ebook Readers
      'calibre': 'ebook_reader',
      'kindle': 'ebook_reader',
      'sumatra pdf': 'ebook_reader',
      'foxit reader': 'ebook_reader',
      'adobe acrobat reader': 'ebook_reader',

      // Misc Utilities
      'calculator': 'utility',
      'snipping tool': 'utility',
      'clock': 'utility',
      'alarm & clock': 'utility',
      'sticky notes': 'utility',
      'voice recorder': 'utility',
      'magnifier': 'utility',
      'steps recorder': 'utility'
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

    // Prepare patterns sorted by length (desc) for best match
    const patterns = Object.keys(this.applicationCategories)
      .sort((a, b) => b.length - a.length);

    let matchedApp = null;

    for (const pattern of patterns) {
      // Use a loose match: pattern anywhere in the window title
      if (lowerTitle.includes(pattern)) {
        matchedApp = pattern;
        break;
      }
    }

    let appName, category;
    if (matchedApp) {
      // Normalize app name for output (e.g., replace spaces with underscores)
      appName = matchedApp.replace(/\s+/g, '_');
      category = this.applicationCategories[matchedApp];
    } else {
      appName = 'unknown';
      category = 'other';
    }

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
