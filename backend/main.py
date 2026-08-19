import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

load_dotenv(ROOT / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.copilot import router as copilot_router
from routes.simulation import router as simulation_router

app = FastAPI(
    title="Entrouge API",
    description="Urban mobility simulation platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation_router, prefix="/api")
app.include_router(copilot_router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "entrouge"}
