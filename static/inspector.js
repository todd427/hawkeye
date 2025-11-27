// FoxxeEye Inspector Frontend — Restored Version
// Matches inspector.html exactly

// ----------------------------
// DOM helpers & utilities
// ----------------------------
function $(id) {
  return document.getElementById(id);
}

async function getJSON(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`GET ${url} failed: ${resp.status}`);
  return resp.json();
}

async function postJSON(url, data) {
  const resp = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });
  if (!resp.ok) throw new Error(`POST ${url} failed: ${resp.status}`);
  return resp.json();
}

function setStatus(msg, error = false) {
  const el = $("status");
  if (!el) return;
  el.textContent = msg;
  el.style.color = error ? "#ff6b8b" : "#9ca3af";
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16);
}

// ----------------------------
// Card builder
// ----------------------------
function createCard(title, rows) {
  const div = document.createElement("div");
  div.className = "card";

  const h3 = document.createElement("h3");
  h3.textContent = title;
  div.appendChild(h3);

  const dl = document.createElement("dl");
  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value == null ? "n/a" : String(value);
    dl.appendChild(dt);
    dl.appendChild(dd);
  });

  div.appendChild(dl);
  return div;
}

// ----------------------------
// Render Server Info
// ----------------------------
function renderServerCards(data) {
  const container = $("serverCards");
  container.innerHTML = "";

  const geo = data.geo || {};

  const networkCard = createCard("Network & Location", [
    ["IP Address", data.ip],
    ["City", geo.city],
    ["Region", geo.region || geo.region_code],
    ["Country", geo.country_name || geo.country],
    ["Timezone", geo.timezone || "n/a"]
  ]);

  const ispCard = createCard("ISP", [
    ["Organisation", geo.org],
    ["ASN", geo.asn],
    ["Network Type", geo.network_type],
    ["ISP Reputation", "Unknown"]  // placeholder
  ]);

  container.appendChild(networkCard);
  container.appendChild(ispCard);
}

// ----------------------------
// Render Browser Info
// ----------------------------
function renderClientCards(serverData) {
  const c = $("clientCards");
  c.innerHTML = "";

  const nav = navigator;
  const scr = screen;

  const browserCard = createCard("Browser", [
    ["User Agent", nav.userAgent],
    ["Platform", nav.platform],
    ["Languages", (nav.languages || []).join(", ")],
    ["Timezone", Intl.DateTimeFormat().resolvedOptions().timeZone]
  ]);

  const deviceCard = createCard("Device", [
    ["CPU Cores", nav.hardwareConcurrency],
    ["Approx RAM (GB)", "n/a"],
    ["Cookies Enabled", navigator.cookieEnabled]
  ]);

  const screenCard = createCard("Screen", [
    ["Resolution", `${scr.width} × ${scr.height}`],
    ["Color Depth", scr.colorDepth]
  ]);

  c.appendChild(browserCard);
  c.appendChild(deviceCard);
  c.appendChild(screenCard);
}

// ----------------------------
// Fingerprint & Trackability
// ----------------------------
function gatherTrackabilityPayload() {
  const nav = navigator;
  const plugins = nav.plugins ? [...nav.plugins].map(p => p.name) : [];

  return {
    hasCanvas: !!document.createElement("canvas").getContext,
    hasWebGL: (function () {
      try {
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
      } catch { return false; }
    })(),
    fonts: nav.languages || [],
    plugins: plugins
  };
}

async function renderRiskCards(serverData) {
  const container = $("riskCards");
  container.innerHTML = "";

  const nav = navigator;
  const scr = screen;

  const fingerprintSource = [
    serverData.ip,
    nav.userAgent,
    (nav.languages || []).join(","),
    scr.width, scr.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join("|");

  const fpId = simpleHash(fingerprintSource);

  const fpCard = createCard("Fingerprint", [
    ["ID", fpId],
    ["Entropy (0–4)", 4],
    ["Uniqueness", "High (fairly unique combination)"]
  ]);

  container.appendChild(fpCard);

  const payload = gatherTrackabilityPayload();
  const res = await postJSON("/trackability", payload);

  const score = res.trackability_score || 0;
  const assessment = score >= 3 ? "High"
                   : score === 2 ? "Medium"
                   : "Low";

  const trackCard = createCard("Trackability", [
    ["Score", score],
    ["Assessment", assessment]
  ]);

  container.appendChild(trackCard);
}

// ----------------------------
// Comparison
// ----------------------------
function renderCompareCards() {
  const c = $("compareCards");
  c.innerHTML = "";

  const card = createCard("Comparison", [
    ["Total Recent Visitors", "1"],
    ["With Identical Fingerprint", "1"],
    ["Your Uniqueness Percentile", "100%"]
  ]);

  c.appendChild(card);
}

// ----------------------------
// Raw Data
// ----------------------------
function renderRaw(serverData) {
  const clientData = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    languages: navigator.languages,
    screen: {width: screen.width, height: screen.height},
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  $("raw").textContent = JSON.stringify({
    server: serverData,
    client: clientData
  }, null, 2);
}

// ----------------------------
// Map
// ----------------------------
function renderMap(serverData) {
  const geo = serverData.geo || {};
  const lat = parseFloat(geo.latitude);
  const lon = parseFloat(geo.longitude);

  if (!lat || !lon) return;

  const mapEl = $("map");
  mapEl.innerHTML = "";

  const map = L.map("map").setView([lat, lon], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  L.marker([lat, lon]).addTo(map);
}

// ----------------------------
// QR Code
// ----------------------------
function renderQR() {
  const el = $("qrPreview");
  if (!el) return;

  const url = window.location.href;
  el.innerHTML = "";
  const img = document.createElement("img");
  img.src = `/qr?url=${encodeURIComponent(url)}&t=${Date.now()}`;
  img.alt = "QR Code";
  el.appendChild(img);
}

// ----------------------------
// Theme Toggle
// ----------------------------
function toggleTheme() {
  const b = document.body;
  const now = b.getAttribute("data-theme") || "dark";
  b.setAttribute("data-theme", now === "dark" ? "light" : "dark");
}

// ----------------------------
// Copy JSON
// ----------------------------
function copyJSON() {
  const pre = $("raw");
  navigator.clipboard.writeText(pre.textContent).then(() => {
    setStatus("JSON copied to clipboard.");
  });
}

// ----------------------------
// Main Init
// ----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    setStatus("Loading…");

    $("copyBtn").onclick = copyJSON;
    $("qrButton").onclick = renderQR;
    $("themeToggle").onclick = toggleTheme;

    const serverData = await getJSON("/visitor-info");

    renderServerCards(serverData);
    renderClientCards(serverData);
    await renderRiskCards(serverData);
    renderCompareCards();
    renderRaw(serverData);
    renderMap(serverData);
    renderQR();

    setStatus("Ready.");
  } catch (err) {
    console.error(err);
    setStatus("Error loading data.", true);
  }
});

