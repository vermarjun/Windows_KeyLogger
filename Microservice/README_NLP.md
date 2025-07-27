# NLP Text Analysis Endpoint

This microservice provides a robust NLP pipeline for comprehensive text analysis including Named Entity Recognition (NER), text classification, and pattern detection.

## Features

### Named Entity Recognition (NER)
- **Person Names**: Detects individual names using spaCy NER
- **Organizations**: Identifies company names, institutions
- **Locations**: Cities, countries, states, addresses
- **Dates & Times**: Various date formats and time expressions
- **Monetary Values**: Currency amounts and financial data
- **Cardinal Numbers**: Numeric values and quantities
- **Facilities**: Buildings, airports, highways, etc.
- **Products**: Brand names, product names
- **Events**: Named events and occasions
- **Works of Art**: Titles of books, movies, songs
- **Laws**: Legal documents and regulations
- **Languages**: Language names and codes
- **Quantities**: Measurements and amounts
- **Percentages**: Percentage values

### Pattern Detection
- **Email Addresses**: Validated email formats
- **Phone Numbers**: International phone number formats
- **Credit Card Numbers**: Validated credit card patterns
- **IP Addresses**: IPv4 address detection
- **URLs**: Web addresses and links
- **Passwords**: Password-like strings
- **Social Security Numbers**: SSN patterns
- **Dates**: Various date formats
- **Times**: Time expressions
- **Monetary Amounts**: Currency values

### Text Classification
- **Code**: Programming code and technical syntax
- **Email**: Formal email communication
- **Chat**: Informal conversation
- **Search Query**: Web search terms
- **Social Media**: Social platform content
- **Technical**: API, database, server content
- **Business**: Professional communication
- **Academic**: Research and scholarly content
- **Web Content**: URLs and web-related text
- **Offensive**: Profanity and offensive language
- **Sexual**: Adult or sexual content
- **Religious**: Religious references and content

## API Endpoint

### POST /analyze-text

**Request Body:**
```json
{
  "text": "Your text to analyze here"
}
```

**Response:**
```json
{
  "entities": {
    "PERSON": ["John Smith", "Sarah Wilson"],
    "EMAIL": ["john.smith@example.com"],
    "PHONE": ["+1-555-123-4567"],
    "GPE": ["New York City"],
    "CREDIT_CARD": ["4532-1234-5678-9012"],
    "DATE": ["March 15, 2024"],
    "TIME": ["2:00 PM"]
  },
  "text_classification": ["email", "business"],
  "confidence_scores": {
    "entity_detection": 0.8,
    "text_classification": 0.9,
    "pattern_detection": 0.7
  }
}
```

## Installation

1. Install dependencies:
```bash
pip install -r Requirements.txt
```

2. Download spaCy model:
```bash
python -m spacy download en_core_web_sm
```

3. Run the server:
```bash
python flan_service.py
```

## Usage Examples

### Python Client
```python
import requests

response = requests.post(
    "http://localhost:8000/analyze-text",
    json={"text": "Hi, I'm John and my email is john@example.com"},
    headers={"Content-Type": "application/json"}
)

result = response.json()
print(f"Detected names: {result['entities']['PERSON']}")
print(f"Detected emails: {result['entities']['EMAIL']}")
print(f"Text type: {result['text_classification']}")
```

### cURL
```bash
curl -X POST "http://localhost:8000/analyze-text" \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello, my name is Alice and my phone is (555) 123-4567"}'
```

## Testing

Run the test script to see examples:
```bash
python test_nlp_endpoint.py
```

## Configuration

The pipeline can be customized by modifying:

- **PATTERNS**: Regex patterns for entity detection
- **KEYWORDS**: Classification keywords
- **spaCy model**: Change from `en_core_web_sm` to other models
- **Confidence thresholds**: Adjust scoring algorithms

## Performance

- **Processing Speed**: ~100-500ms per request (depending on text length)
- **Memory Usage**: ~500MB (spaCy model + transformers)
- **Accuracy**: High precision for structured data (emails, phones, etc.)
- **Scalability**: Can handle concurrent requests

## Error Handling

The endpoint includes comprehensive error handling:
- Invalid input validation
- Model loading errors
- Processing exceptions
- Graceful degradation for malformed text

## Security Considerations

- Input sanitization to prevent injection attacks
- Rate limiting recommended for production
- Logging of analysis requests for monitoring
- No storage of sensitive detected data 