import os
from typing import Any, Dict
from backend.classifier import classify_event_background
from backend.database import get_all_events, init_db, insert_event
from backend.logic import get_dashboard_summary
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(title="ValueBin API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EventCreate(BaseModel):
    weight_g: float = Field(..., gt=0, description="Weight in grams, must be > 0")


@app.on_event("startup")
def startup_db():
    init_db()


# Check if the frontend folder exists before mounting static files
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/", response_class=HTMLResponse)
def read_root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.isfile(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return """
    <html>
        <head><title>ValueBin API</title></head>
        <body style="font-family: Arial; padding: 20px;">
            <h1>ValueBin API Server is Running!</h1>
            <p>Visit <a href="/docs">/docs</a> to view interactive API documentation.</p>
        </body>
    </html>
    """


@app.post("/event", status_code=202)
def create_event(event: EventCreate, background_tasks: BackgroundTasks):
    """POST /event: Accepts drop event, stores weight, triggers background classification."""
    event_id = insert_event(event.weight_g)
    background_tasks.add_task(classify_event_background, event_id, event.weight_g)
    return {"id": event_id, "status": "pending"}


@app.get("/summary")
def summary():
    """GET /summary: Returns aggregated daily totals, scores, trends, and AI recommendations."""
    return get_dashboard_summary()


@app.get("/events")
def events():
    """GET /events: Returns full activity log."""
    return get_all_events()