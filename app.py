from fastapi import FastAPI, Request
from fastapi.responses import (
    HTMLResponse,
    RedirectResponse,
    StreamingResponse,
    JSONResponse,
)
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import httpx
import qrcode
import io
import uvicorn

app = FastAPI(
    title="FoxxeEye",
    docs_url=None,
    redoc_url=None,
    description="Browser and network fingerprint inspector"
)

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")


# ------------------------------------------------------------
# Utility: Load static HTML files safely
# ------------------------------------------------------------
def load_html(filename: str) -> str:
    path = Path("static") / filename
    return path.read_text(encoding="utf-8")


# ------------------------------------------------------------
# Routes
# ------------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
def root():
    # Redirect base URL → inspector UI
    return RedirectResponse(url="/inspector")


@app.get("/inspector", response_class=HTMLResponse)
def inspector():
    return load_html("inspector.html")


@app.get("/privacy", response_class=HTMLResponse)
def privacy():
    return load_html("privacy.html")


# ------------------------------------------------------------
# Visitor Info (IP, headers, GeoIP)
# ------------------------------------------------------------
@app.get("/visitor-info")
async def visitor_info(request: Request):
    client_ip = request.client.host

    geo = {}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://ipapi.co/{client_ip}/json/")
            if resp.status_code == 200:
                geo = resp.json()
    except Exception:
        geo = {"error": "GeoIP lookup failed"}

    headers = dict(request.headers)

    return {
        "ip": client_ip,
        "headers": headers,
        "geo": geo
    }


# ------------------------------------------------------------
# Comparison endpoint (placeholder logic)
# ------------------------------------------------------------
@app.post("/compare")
async def compare(payload: dict):
    return {"comparison": "ok", "input": payload}


# ------------------------------------------------------------
# Trackability scoring endpoint
# ------------------------------------------------------------
@app.post("/trackability")
async def trackability(payload: dict):
    score = 0
    if payload.get("hasCanvas"):
        score += 1
    if payload.get("hasWebGL"):
        score += 1
    if payload.get("fonts"):
        score += 1
    if payload.get("plugins"):
        score += 1

    return {"trackability_score": score}


# ------------------------------------------------------------
# QR Code Generator — FIXED (uses StreamingResponse)
# ------------------------------------------------------------
@app.get("/qr")
def generate_qr(url: str):
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


# ------------------------------------------------------------
# Health Check
# ------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


# ------------------------------------------------------------
# Local dev entrypoint
# ------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )

