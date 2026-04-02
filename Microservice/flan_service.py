from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch

app = FastAPI()

# Load model and tokenizer at startup
MODEL_NAME = "google/flan-t5-small"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

class PromptRequest(BaseModel):
    prompt: str

class GenerationResponse(BaseModel):
    response: str

@app.post("/generate", response_model=GenerationResponse)
def generate_text(request: PromptRequest):
    print("request came!")
    try:
        inputs = tokenizer(request.prompt, return_tensors="pt").to(device)
        outputs = model.generate(**inputs, max_new_tokens=64)
        result = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return GenerationResponse(response=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
