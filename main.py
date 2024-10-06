from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import json
import random

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Load questions from JSON file
with open('questions.json', 'r', encoding='utf-8') as f:
    all_questions = json.load(f)['questions']

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/get_quiz")
async def get_quiz(all: bool = False):
    if all:
        quiz_questions = all_questions
    else:
        # Randomly select 30 questions or all questions if less than 30
        quiz_questions = random.sample(all_questions, min(30, len(all_questions)))
    return quiz_questions

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
