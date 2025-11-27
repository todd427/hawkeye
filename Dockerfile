# ============================================================
#  Stage 1 — Builder (installs dependencies cleanly)
# ============================================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies (needed for Pillow / qrcode)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ============================================================
#  Stage 2 — Runtime (tiny, clean)
# ============================================================
FROM python:3.11-slim

WORKDIR /app

# Copy only what we need from builder
COPY --from=builder /usr/local /usr/local

# Copy the app source
COPY app.py .

# Copy ALL static assets (includes new privacy.html)
COPY static/ /app/static/

# Create non-root user
RUN useradd -m appuser
USER appuser

# Expose port

