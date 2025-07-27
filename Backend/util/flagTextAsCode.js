export class CodeDetector {
    constructor() {
        // Reduced and more focused keywords (lower weight)
        this.keywords = new Set([
            // Core programming constructs only
            'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export',
            'def', 'async', 'await', 'try', 'catch', 'throw', 'new', 'typeof', 'instanceof',
            'public', 'private', 'protected', 'static', 'void', 'abstract', 'interface',
            'select', 'from', 'where', 'insert', 'update', 'delete', 'create', 'drop'
        ]);

        // Strong syntax patterns (high weight)
        this.syntaxPatterns = [
            // Function calls with specific patterns
            /\w+\s*\([^)]*\)\s*[;{]?/,
            
            // Variable assignments with operators
            /\w+\s*[+\-*\/]?=\s*[^=]/,
            
            // Object/array access patterns
            /\w+[\.\[][\w\d"']+[\]\.]*/,
            
            // Control flow with brackets
            /\b(if|for|while|switch)\s*\([^)]+\)\s*[{]/,
            
            // Arrow functions
            /\(?[\w\s,]*\)?\s*=>\s*[{\w]/,
            
            // Method chaining
            /\w+\.\w+\([^)]*\)\.\w+/,
            
            // Multiple operators in sequence
            /[=!<>]=|&&|\|\||<<|>>|\+\+|--|[+\-*\/]=|\?\?/,
            
            // Semicolon endings (strong indicator)
            /[^;]\s*;\s*$/m,
            
            // Curly braces with structured content
            /\{\s*[\w"']+\s*:\s*[^}]+\}/,
            
            // Import/require statements
            /(import|require|from)\s+['"][^'"]+['"]/,
            
            // Template literals
            /`[^`]*\$\{[^}]+\}[^`]*`/,
            
            // Regex patterns
            /\/[^\/\n]+\/[gimuy]*\b/,
            
            // Comments (code-specific)
            /^\s*\/\/|\/\*[\s\S]*?\*\/|^\s*#(?![ \t]*$)/m
        ];

        // Structural code indicators (medium weight)
        this.structuralPatterns = [
            // JSON/Object structure
            /^\s*[\[\{][\s\S]*[\]\}]\s*$/,
            
            // HTML/XML tags
            /<[a-zA-Z][^>]*>[\s\S]*<\/[a-zA-Z][^>]*>/,
            
            // CSS rules
            /[.#]?[\w-]+\s*\{[^}]*\}/,
            
            // SQL patterns
            /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP)\s+[\w\s,*()]+/i,
            
            // Command line patterns
            /^\s*(cd|ls|dir|mkdir|rm|cp|mv|git|npm|node|python|java)\s+/m,
            
            // Multiple indented lines
            /^(\s{2,}|\t+)[\w\S]/m
        ];

        // Code density indicators
        this.densityPatterns = [
            // High special character density
            /[{}[\]().,;:=+\-*\/\\<>!&|?~^%#@$]{3,}/,
            
            // Camelcase/snake_case variables
            /\b[a-z]+[A-Z][a-zA-Z0-9]*\b|\b\w+_\w+\b/,
            
            // Escaped characters
            /\\[nrtbf"'\\\/]|\\u[0-9a-fA-F]{4}|\\x[0-9a-fA-F]{2}/,
            
            // Hexadecimal or binary numbers
            /\b0x[0-9a-fA-F]+\b|\b0b[01]+\b/
        ];
    }

    /**
     * Main detection method - returns only true or false
     * @param {string} text - The text to analyze
     * @param {object} options - Configuration options
     * @returns {boolean} true if code, false if natural language
     */
    detectCode(text, options = {}) {
        const {
            threshold = 0.4, // Higher threshold for more precision
            codeRatio = 0.7   // Minimum ratio of code-like content
        } = options;

        if (!text || typeof text !== 'string' || text.trim().length < 3) {
            return false;
        }

        const cleanText = this.preprocessText(text);
        
        // Early detection for obvious non-code
        if (this.isObviousNaturalLanguage(cleanText)) {
            return false;
        }

        // Calculate weighted scores
        const syntaxScore = this.calculateSyntaxScore(cleanText);
        const structuralScore = this.calculateStructuralScore(cleanText);
        const densityScore = this.calculateDensityScore(cleanText);
        const keywordScore = this.calculateKeywordScore(cleanText);
        const balanceScore = this.calculateBalanceScore(cleanText);
        
        // Weighted combination (syntax is most important)
        const finalScore = (
            syntaxScore * 0.40 +        // Syntax patterns (highest weight)
            structuralScore * 0.25 +    // Code structure
            densityScore * 0.20 +       // Character density
            balanceScore * 0.10 +       // Bracket/quote balance
            keywordScore * 0.05         // Keywords (lowest weight)
        );

        // Additional context checks
        const contextScore = this.calculateContextScore(cleanText);
        const adjustedScore = finalScore * contextScore;

        // Handle mixed content scenarios
        const codeContentRatio = this.calculateCodeContentRatio(cleanText);
        
        // If it's mostly natural language with small code snippets, return false
        if (codeContentRatio < codeRatio && adjustedScore < threshold * 1.2) {
            return false;
        }

        // If it's mostly code with some natural language, return true
        if (codeContentRatio > codeRatio || adjustedScore >= threshold) {
            return true;
        }

        return false;
    }

    preprocessText(text) {
        return text
            .replace(/\\n|\\r|\\t/g, ' ')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\s+/g, ' ')
            .trim();
    }

    isObviousNaturalLanguage(text) {
        // Check for common natural language patterns
        const naturalPatterns = [
            /\b(the|and|or|but|in|on|at|to|for|of|with|by)\s+\b/gi,
            /\b(is|are|was|were|been|being|have|has|had)\s+\b/gi,
            /\b(I|you|he|she|it|we|they)\s+\b/gi,
            /[.!?]\s+[A-Z]/g  // Sentence endings followed by capital letters
        ];

        let naturalScore = 0;
        const words = text.split(/\s+/).length;
        
        for (const pattern of naturalPatterns) {
            const matches = text.match(pattern) || [];
            naturalScore += matches.length;
        }

        // If high ratio of natural language words and low code indicators
        return (naturalScore / words) > 0.3 && !this.hasStrongCodeIndicators(text);
    }

    hasStrongCodeIndicators(text) {
        const strongIndicators = [
            /[{}[\]();]/,
            /\w+\s*=\s*[^=]/,
            /\w+\.\w+/,
            /\/\*|\/\/|<!--/,
            /<\/?[a-zA-Z]/
        ];

        return strongIndicators.some(pattern => pattern.test(text));
    }

    calculateSyntaxScore(text) {
        let score = 0;
        let matches = 0;

        for (const pattern of this.syntaxPatterns) {
            if (pattern.test(text)) {
                matches++;
                // Weight certain patterns higher
                if (pattern.source.includes('function\\|def') || 
                    pattern.source.includes('=>') || 
                    pattern.source.includes('\\w+\\s*\\(')) {
                    score += 0.15;
                } else {
                    score += 0.08;
                }
            }
        }

        return Math.min(score, 1.0);
    }

    calculateStructuralScore(text) {
        let score = 0;

        for (const pattern of this.structuralPatterns) {
            if (pattern.test(text)) {
                score += 0.2;
            }
        }

        // Check for consistent indentation
        const lines = text.split('\n');
        const indentedLines = lines.filter(line => /^\s{2,}/.test(line));
        if (indentedLines.length > 1 && indentedLines.length / lines.length > 0.3) {
            score += 0.3;
        }

        return Math.min(score, 1.0);
    }

    calculateDensityScore(text) {
        let score = 0;

        // Special character density
        const specialChars = text.match(/[{}[\]().,;:=+\-*\/\\<>!&|?~^%#@$]/g) || [];
        const charRatio = specialChars.length / text.length;
        
        if (charRatio > 0.15) score += 0.4;
        else if (charRatio > 0.08) score += 0.2;
        else if (charRatio > 0.04) score += 0.1;

        // Pattern density
        for (const pattern of this.densityPatterns) {
            if (pattern.test(text)) {
                score += 0.15;
            }
        }

        return Math.min(score, 1.0);
    }

    calculateKeywordScore(text) {
        const words = text.toLowerCase().split(/\s+/);
        const keywordCount = words.filter(word => 
            this.keywords.has(word.replace(/[^\w]/g, ''))
        ).length;

        // Reduced impact of keywords
        return Math.min(keywordCount / Math.max(words.length, 1) * 3, 0.5);
    }

    calculateBalanceScore(text) {
        const brackets = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
        const stack = [];
        let balanced = 0;
        let total = 0;

        for (const char of text) {
            if (brackets[char] && char !== '"' && char !== "'") {
                stack.push(brackets[char]);
                total++;
            } else if (char === '"' || char === "'") {
                if (stack.length > 0 && stack[stack.length - 1] === char) {
                    stack.pop();
                    balanced++;
                } else {
                    stack.push(char);
                }
                total++;
            } else if (Object.values(brackets).includes(char) && char !== '"' && char !== "'") {
                if (stack.length > 0 && stack.pop() === char) {
                    balanced++;
                }
                total++;
            }
        }

        return total > 0 ? (balanced / total) * 0.5 : 0;
    }

    calculateContextScore(text) {
        // Reduce score for obvious natural language contexts
        const textLower = text.toLowerCase();
        
        // Check for question/conversational patterns
        if (/\b(what|how|why|when|where|who|can you|please|could you)\b/.test(textLower)) {
            return 0.7;
        }

        // Check for explanation patterns
        if (/\b(this is|that is|here is|there are|explanation|example|means that)\b/.test(textLower)) {
            return 0.8;
        }

        return 1.0;
    }

    calculateCodeContentRatio(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length === 0) return 1.0;

        let codelikeSentences = 0;
        
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (this.hasStrongCodeIndicators(trimmed) || 
                this.syntaxPatterns.some(p => p.test(trimmed))) {
                codelikeSentences++;
            }
        }

        return codelikeSentences / sentences.length;
    }

    // Utility method for batch processing
    batchDetect(texts, options = {}) {
        return texts.map(text => this.detectCode(text, options));
    }
}