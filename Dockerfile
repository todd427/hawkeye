# ============================================================
#  Stage 1 — Builder (optional, for installing dependencies)
# ============================================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies (for Pillow / qrcode)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --prefix=/install -r requirements.txt


# ============================================================
#  Stage 2 — Runner Image (small, fast)
# ============================================================
FROM python:3.11-slim

# Create non-root user
RUN useradd -m appuser

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy app source
COPY app.py .
COPY static ./static

# Expose port
EXPOSE 8000

# Switch to non-root
USER appuser

# Uvicorn command
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

