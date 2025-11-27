from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx
import qrcode
import io
import base64
import time
from typing import Optional, List, Dict, Any

app = FastAPI(title="Hawkeye")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Comparison mode memory store
VISITORS: List[Dict[str, Any]] = []
MAX_VISITORS = 500


# -----------------------------
# Models
# -----------------------------
class FingerprintIn(BaseModel):
    id: str
    entropy: int
    vpn: Optional[bool] = False
    cloud_network: Optional[bool] = False
    rare_lang: Optional[bool] = False


# -----------------------------
# IP Lookup
# -----------------------------
async def lookup_ip(ip: str) -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"https://ipapi.co/{ip}/json/", timeout=2)
            return r.json()
    except Exception:
        return {}


# -----------------------------
# ISP Reputation Heuristic
# -----------------------------
def isp_reputation(org: Optional[str], asn: Optional[str]) -> str:
    if not org:
        return "Unknown"

    o = org.lower()

    if any(x in o for x in ["eir", "virgin", "vodafone", "sky", "bt ireland", "comcast", "verizon"]):
        return "Clean (residential ISP)"

    if any(x in o for x in ["aws", "amazon", "google", "azure", "ovh", "linode", "digitalocean", "hetzner"]):
        return "Cloud / Medium Risk"

    if any(x in o for x in ["nord", "proton", "expressvpn", "mullvad", "surfshark"]):
        return "VPN (High Obfuscation)"

    return "Unclassified"


# -----------------------------
# /visitor-info
# -----------------------------
@app.get("/visitor-info")
async def visitor_info(request: Request) -> Dict[str, Any]:
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else request.client.host

    geo = await lookup_ip(ip)
    rep = isp_reputation(geo.get("org"), geo.get("asn"))

    return {
        "ip": ip,
        "city": geo.get("city"),
        "region": geo.get("region"),
        "country": geo.get("country_name"),
        "latitude": geo.get("latitude"),
        "longitude": geo.get("longitude"),
        "timezone": geo.get("timezone"),
        "org": geo.get("org"),
        "asn": geo.get("asn"),
        "network_type": geo.get("network", geo.get("asn_org")),
        "isp_reputation": rep,
    }


# -----------------------------
# /compare
# -----------------------------
@app.post("/compare")
async def compare(fp: FingerprintIn):
    VISITORS.append({"fp": fp.dict(), "t": time.time()})
    if len(VISITORS) > MAX_VISITORS:
        VISITORS.pop(0)

    identical = sum(1 for v in VISITORS if v["fp"]["id"] == fp.id)

    entropies = [v["fp"]["entropy"] for v in VISITORS]
    percentile = sum(1 for e in entropies if e <= fp.entropy) / len(entropies)

    return {
        "total_visitors": len(VISITORS),
        "identical": identical,
        "percentile": round(percentile * 100, 1),
    }


# -----------------------------
# /trackability
# -----------------------------
@app.post("/trackability")
async def trackability(fp: FingerprintIn):
    score = fp.entropy
    if fp.vpn:
        score += 1
    if fp.cloud_network:
        score += 1
    if fp.rare_lang:
        score += 1

    if score <= 1:
        grade = "Low (difficult to follow)"
    elif score == 2:
        grade = "Medium (moderately trackable)"
    else:
        grade = "High (easy to track)"

    return {"trackability_score": score, "grade": grade}


# -----------------------------
# /qr
# -----------------------------
@app.get("/qr")
async def qr(url: str):
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode()
    return {"qr": encoded}


# -----------------------------
# Serve static inspector
# -----------------------------
@app.get("/inspector")
async def serve_inspector():
    return FileResponse("static/inspector.html")


# Static files (Leaflet + HTML)
app.mount("/static", StaticFiles(directory="static"), name="static")


# Dev entrypoint
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", reload=True, host="0.0.0.0", port=8000)

