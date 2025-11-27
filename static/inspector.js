/* --------------------------------------------------------------
   Utility helpers
-------------------------------------------------------------- */

function kv(k, v) {
  if (v === null || v === undefined || v === "")
    v = "<span style='opacity:0.5'>n/a</span>";
  return `<div class="kv"><div class="kv-key">${k}</div><div class="kv-value">${v}</div></div>`;
}

function ispBadge(rep) {
  if (!rep) return "";
  const lower = rep.toLowerCase();
  let cls = "badge ";

  if (lower.includes("clean")) cls += "badge-good";
  else if (lower.includes("cloud") || lower.includes("medium")) cls += "badge-warn";
  else if (lower.includes("vpn") || lower.includes("high")) cls += "badge-bad";

  return `<span class="${cls}">${rep}</span>`;
}

function showStatus(msg, bad=false) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.style.color = bad ? "#ef4444" : "var(--muted)";
  if (msg) setTimeout(() => el.textContent = "", 3000);
}


/* --------------------------------------------------------------
   Collection
-------------------------------------------------------------- */

async function fetchServer() {
  const r = await fetch("/visitor-info");
  return r.json();
}

function clientData() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    languages: navigator.languages || [navigator.language],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    cookies: navigator.cookieEnabled,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth
    }
  };
}

function entropyEstimate(c) {
  let s = 0;
  if (c.languages.length > 1) s++;
  if (c.hardwareConcurrency >= 8) s++;
  if (c.deviceMemory >= 8) s++;
  if (c.screen.width > 2000) s++;
  return s;
}

function hashFingerprint(c) {
  const str = [
    c.userAgent,
    c.platform,
    c.languages.join(","),
    c.timezone,
    c.screen.width + "x" + c.screen.height,
    c.screen.colorDepth,
    c.hardwareConcurrency,
    c.deviceMemory
  ].join("|");

  let hash = 5381;
  for (let i = 0; i < str.length; i++)
    hash = ((hash << 5) + hash) + str.charCodeAt(i);

  return (hash >>> 0).toString(16).padStart(8,"0");
}

function detectRareLang(langs) {
  const common = ["en","en-US","en-GB","en-IE","es","fr","de"];
  return !common.includes(langs[0]);
}

function detectVPNOrCloud(rep, org) {
  const r = (rep || "").toLowerCase();
  const o = (org || "").toLowerCase();

  const vpn = r.includes("vpn");
  const cloud =
    r.includes("cloud") ||
    ["aws","amazon","google","linode","ovh","digitalocean"]
      .some(x => o.includes(x));

  return { vpn, cloud_network: cloud };
}


/* --------------------------------------------------------------
   UI Rendering
-------------------------------------------------------------- */

function renderServer(d) {
  serverCards.innerHTML = `
    <div class="card">
      <h3>Network & Location</h3>
      ${kv("IP Address", d.ip)}
      ${kv("City", d.city)}
      ${kv("Region", d.region)}
      ${kv("Country", d.country)}
      ${kv("Timezone", d.timezone)}
    </div>

    <div class="card">
      <h3>ISP</h3>
      ${kv("Organisation", d.org)}
      ${kv("ASN", d.asn)}
      ${kv("Network Type", d.network_type)}
      ${kv("ISP Reputation", ispBadge(d.isp_reputation))}
    </div>
  `;
}

function renderClient(c) {
  const s = c.screen;
  clientCards.innerHTML = `
    <div class="card">
      <h3>Browser</h3>
      ${kv("User Agent", c.userAgent)}
      ${kv("Platform", c.platform)}
      ${kv("Languages", c.languages.join(", "))}
      ${kv("Timezone", c.timezone)}
    </div>

    <div class="card">
      <h3>Device</h3>
      ${kv("CPU Cores", c.hardwareConcurrency)}
      ${kv("Approx RAM (GB)", c.deviceMemory)}
      ${kv("Cookies Enabled", c.cookies)}
    </div>

    <div class="card">
      <h3>Screen</h3>
      ${kv("Resolution", `${s.width} × ${s.height}`)}
      ${kv("Color Depth", s.colorDepth)}
    </div>
  `;
}

function renderRisk(fp, track) {
  const percent = Math.min(100, Math.max(0, (track.trackability_score/5)*100));

  riskCards.innerHTML = `
    <div class="card">
      <h3>Fingerprint</h3>
      ${kv("ID", fp.id)}
      ${kv("Entropy (0–4)", fp.entropy)}
      ${kv("Uniqueness", fp.entropy <=1 ? "Low" : fp.entropy===2 ? "Medium" : "High")}
    </div>

    <div class="card">
      <h3>Trackability</h3>
      ${kv("Score", track.trackability_score)}
      ${kv("Assessment", track.grade)}
      <div class="meter-bar"><div id="trackMeter" class="meter-fill"></div></div>
    </div>
  `;

  const meter = document.getElementById("trackMeter");
  if (meter) meter.style.width = percent + "%";
}

function renderCompare(res) {
  compareCards.innerHTML = `
    <div class="card">
      <h3>Comparison</h3>
      ${kv("Total Visitors", res.total_visitors)}
      ${kv("Identical Fingerprints", res.identical)}
      ${kv("Uniqueness Percentile", res.percentile + "%")}
    </div>
  `;
}

function showMap(lat, lon) {
  if (!lat || !lon) return;
  const map = L.map('map').setView([lat, lon], 11);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.marker([lat, lon]).addTo(map);
}


/* --------------------------------------------------------------
   QR
-------------------------------------------------------------- */

async function generateQR() {
  try {
    const res = await fetch(`/qr?url=${encodeURIComponent(window.location.href)}`);
    const data = await res.json();
    document.getElementById("qrPreview").innerHTML =
      `<img src="data:image/png;base64,${data.qr}" alt="QR code" />`;
  } catch {
    showStatus("QR Error", true);
  }
}


/* --------------------------------------------------------------
   MAIN
-------------------------------------------------------------- */

(async function run() {
  const server = await fetchServer();
  const client = clientData();

  renderServer(server);
  renderClient(client);
  showMap(server.latitude, server.longitude);

  const entropy = entropyEstimate(client);
  const id = hashFingerprint(client);
  const { vpn, cloud_network } = detectVPNOrCloud(server.isp_reputation, server.org);
  const rare_lang = detectRareLang(client.languages);

  const fp = { id, entropy, vpn, cloud_network, rare_lang };

  const compare = await fetch("/compare", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(fp)
  }).then(r=>r.json());

  renderCompare(compare);

  const track = await fetch("/trackability", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(fp)
  }).then(r=>r.json());

  renderRisk(fp, track);

  const all = { server, client, fingerprint: fp, compare, trackability: track };
  document.getElementById("raw").textContent = JSON.stringify(all, null, 2);

  await generateQR();

  /* Copy JSON */
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(all, null, 2));
      showStatus("Copied JSON.");
    } catch {
      showStatus("Clipboard error.", true);
    }
  };

  /* Manual QR */
  qrButton.onclick = generateQR;

  /* Theme toggle */
  themeToggle.onclick = () => {
    document.documentElement.classList.toggle("light-theme");
  };
})();

