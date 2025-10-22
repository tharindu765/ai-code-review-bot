# server.py
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

app = FastAPI()

MODEL_NAME = "mistral-7B-instruct"   # small code model (free to download)
print("Loading model:", MODEL_NAME)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
model.to("cpu")
model.eval()
print("Model loaded")

class Payload(BaseModel):
    diff: str

@app.post("/review")
async def review(payload: Payload):
    prompt = """
You are a senior software engineer reviewing code. 
For each code snippet, provide:
1. Problems found
2. Suggested improvements

Example:
Code:
def foo(x): return x*x

Review:
- Missing type hints
- No docstring
- Single-line function reduces readability
- Suggestion: use `def foo(x: int) -> int:` with proper docstring

Now review this code:

Code:
""" + payload.diff

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        out = model.generate(
    **inputs,
    max_new_tokens=256,
    num_beams=4,
    temperature=0.9,   # more creative
    top_p=0.95,
    do_sample=True
)

    text = tokenizer.decode(out[0], skip_special_tokens=True)
    return {"review": text}
