from fastapi import FastAPI

app = FastAPI(
    title="NetPilot X API",
    description="AI-powered Network Operations Platform",
    version="1.0.0"
)

@app.get("/")
def root():
    return {"message": "NetPilot X Backend Running"}