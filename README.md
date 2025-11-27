# 🦅 **Hawkeye — Cybersafe Inspector**

*A real-time digital-footprint and browser-fingerprinting demo tool.*

This README is suitable for GitHub, Railway, Render, and classroom documentation.
Tone: professional, clear, deployable.

---

# 🦅 Hawkeye

Hawkeye is a fast, lightweight, privacy-education tool built with **FastAPI**.
It shows users—in real time—what their device, browser, and network reveal the moment they load a webpage.

Originally designed for Cyberpsychology workshops, Hawkeye is now a fully self-contained demo you can run locally or deploy anywhere.

## ✨ Features

### 🔍 **Instant Server-Side Detection**

Hawkeye detects:

* IP address
* City / region / country
* ISP and ASN
* Simple ISP reputation score (Clean / Cloud / VPN / Unknown)
* Latitude/longitude (if available)

### 🧭 **Browser & Device Fingerprinting**

Collected entirely client-side:

* Browser user agent
* CPU cores
* Approx RAM
* Language stack
* Timezone
* Screen resolution & color depth
* Cookie support

### 🧠 **Uniqueness & Trackability**

Hawkeye computes:

* Fingerprint entropy score
* Uniqueness percentile (comparison mode)
* Trackability grade (Low / Medium / High)

### 🗺 **Privacy Map**

Local Leaflet.js map shows approximate geolocation from the visitor’s IP.

### 📊 **Comparison Mode**

Compares the current visitor fingerprint to previous visitors to show:

* How many visitors share the same fingerprint
* How unique the visitor appears
* Percentile among all recent visitors

### 📱 **QR Code Sharing**

A built-in QR generator makes it easy for students to open the demo on their phones instantly.

### 🌓 **Dark / Light Mode Toggle**

Clean, simple, immediate theme switch.

---

# 🚀 Getting Started

## 1. Clone the repo

```bash
git clone https://github.com/yourname/hawkeye.git
cd hawkeye
```

## 2. Install dependencies

```bash
pip install -r requirements.txt
```

## 3. Run the server

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Open:

```
http://localhost:8000/inspector
```

---

# 🐳 Docker

Hawkeye ships with a production-ready Dockerfile.
Build and run:

```bash
docker build -t hawkeye .
docker run -p 8000:8000 hawkeye
```

Visit:

```
http://localhost:8000/inspector
```

---

# 🧩 Docker Compose

A full `docker-compose.yml` is included:

```bash
docker compose up --build -d
```

---

# 🛠 Makefile

Use simple commands:

```bash
make compose     # build + run in Docker
make logs        # follow logs
make restart     # rebuild + restart
make clean       # prune Docker
```

---

# ☁ Deploying to Railway

Hawkeye includes a Railway config file (`railway.json`).

Deploy:

```bash
railway init
railway up
```

Or connect to GitHub and Railway auto-deploys via Docker.

---

# ☁ Deploying to Render

A `render.yaml` is included.
Render automatically detects the Dockerfile.

Deploy via:

* GitHub → Render Web Service → Use Dockerfile
* Apply `render.yaml` settings

---

# 📂 Project Structure

```
hawkeye/
  app.py               -- FastAPI backend
  static/
    inspector.html     -- UI shell
    inspector.css      -- UI styling
    inspector.js       -- UI logic
    leaflet.css        -- Local Leaflet assets
    leaflet.js
  Dockerfile
  docker-compose.yml
  Makefile
  requirements.txt
  railway.json
  render.yaml
```

---

# 🔒 Privacy Notes

Hawkeye is intentionally:

* stateless
* ephemeral
* educational

Fingerprint comparisons are stored **only in RAM** and discarded when the process stops.

No personally identifiable information (PII) is stored.
No data is logged or transmitted to third parties.

---

# 🎓 Classroom Use

Hawkeye was designed for live cyberpsychology demonstrations, including:

* Online behavior & digital footprints
* Privacy awareness
* Tracking & fingerprinting
* Adolescent risk perception
* System 1 / System 2 responses
* Misinformation environments

Students see their own device fingerprint instantly, which makes the theory *real*.

---

# 🤝 Contributing

Pull requests are welcome.
Feel free to open issues for:

* new visualizations
* better entropy estimation
* improved ISP reputation heuristics
* teacher dashboard features

---

# 🦊 Author

Built as part of Foxxe Labs’ Cyberpsychology teaching tools.

