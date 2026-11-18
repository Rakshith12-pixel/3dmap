// Udupi in 3D — Google Maps 3D (Map3DElement) + Places API (New).

const LANDMARKS = window.UDUPI_LANDMARKS;
const CATS = window.UDUPI_CATEGORIES;

// Udupi district, with a small margin.
const DISTRICT = { north: 13.98, south: 13.05, east: 75.25, west: 74.55 };
const HOME = { center: { lat: 13.3445, lng: 74.7655, altitude: 0 }, range: 5200, tilt: 58, heading: 20 };

const DETAIL_FIELDS = [
  "displayName", "formattedAddress", "location", "rating", "userRatingCount",
  "regularOpeningHours", "nationalPhoneNumber", "websiteURI", "googleMapsURI",
  "editorialSummary", "photos", "types", "businessStatus", "primaryType",
];
const BASIC_FIELDS = ["displayName", "formattedAddress", "location", "googleMapsURI", "types"];

const EXPLORE = [
  { label: "Restaurants", types: ["restaurant"] },
  { label: "Cafés", types: ["cafe", "bakery"] },
  { label: "Shops", types: ["store", "supermarket", "shopping_mall", "clothing_store"] },
  { label: "Hotels", types: ["lodging"] },
  { label: "Temples", types: ["hindu_temple"] },
  { label: "Churches & mosques", types: ["church", "mosque"] },
  { label: "Hospitals", types: ["hospital", "pharmacy"] },
  { label: "Banks & ATMs", types: ["bank", "atm"] },
  { label: "Schools & colleges", types: ["school", "university"] },
  { label: "Sights", types: ["tourist_attraction", "museum", "park"] },
  { label: "Fuel", types: ["gas_station"] },
];

// ---------- small helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
  json(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } },
};
const KEY_STORE = "udupi3d.apiKey";
const PLACE_CACHE = "udupi3d.placeCache.v1";
const placeCache = store.json(PLACE_CACHE, {});
const saveCache = () => store.set(PLACE_CACHE, JSON.stringify(placeCache));

function toast(msg, ms = 3500) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), ms);
}
function distM(a, b) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtDist = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
const ll = (p) => (p ? { lat: typeof p.lat === "function" ? p.lat() : p.lat, lng: typeof p.lng === "function" ? p.lng() : p.lng } : null);
// Do two place names refer to the same thing? ("Malpe Beach" vs "Malpe Beach, Udupi")
const STOP = new Set(["sri", "shri", "the", "of", "and", "temple", "udupi", "manipal", "&"]);
const nameTokens = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
function namesMatch(a, b) {
  const ta = nameTokens(a.split("(")[0].split(",")[0]);
  const tb = new Set(nameTokens(b));
  if (!ta.length || !tb.size) return false;
  const hits = ta.filter((w) => tb.has(w)).length;
  return hits >= Math.min(2, ta.length);
}
const prettyType = (t) => (t ? t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "");

// ---------- API key ----------
function getKey() {
  return (window.UDUPI_CONFIG?.apiKey || "").trim() || (store.get(KEY_STORE) || "").trim();
}
function showSetup(errorMsg = "") {
  $("#setup").classList.remove("hidden");
  $("#setup-error").textContent = errorMsg;
  $("#setup-key").focus();
}
$("#setup-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const k = $("#setup-key").value.trim();
  if (!/^AIza[0-9A-Za-z_\-]{30,}$/.test(k)) {
    $("#setup-error").textContent = "That doesn't look like a Google Maps API key (they start with “AIza”).";
    return;
  }
  store.set(KEY_STORE, k);
  location.reload();
});
$("#key-btn").addEventListener("click", () => {
  if (window.UDUPI_CONFIG?.apiKey) { toast("The key is set in config.js. Edit that file to change it."); return; }
  store.del(KEY_STORE);
  location.reload();
});

// Google calls this when the key is rejected (wrong key, API not enabled, referrer not allowed).
window.gm_authFailure = () => {
  if (!window.UDUPI_CONFIG?.apiKey) store.del(KEY_STORE);
  showSetup("Google rejected that key. Check that Maps JavaScript API and Places API (New) are enabled for it, and that http://localhost is an allowed referrer.");
};

// Google's official dynamic library loader (inline bootstrap).
function loadGoogleMaps(key) {
  ((g) => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set(), e = new URLSearchParams(), u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => (h = n(Error(p + " could not load."))); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a); })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n))); })({ key, v: "weekly", language: "en", region: "IN" });
}

// ---------- state ----------
let map, Place, Marker3D, PinElement;
const landmarkMarkers = new Map(); // id -> marker
let exploreMarkers = [];
let activeExplore = null;
let touring = false;

// ---------- boot ----------
buildLandmarkList(); // works without Google, so the list shows even before a key is entered
const key = getKey();
if (!key) showSetup();
else start(key).catch((err) => {
  console.error(err);
  showSetup("Couldn't start the 3D map: " + (err?.message || err));
});

async function start(key) {
  loadGoogleMaps(key);
  const maps3d = await google.maps.importLibrary("maps3d");
  const places = await google.maps.importLibrary("places");
  const marker = await google.maps.importLibrary("marker");

  Place = places.Place;
  PinElement = marker.PinElement;
  Marker3D = maps3d.Marker3DInteractiveElement || maps3d.Marker3DElement;

  map = new maps3d.Map3DElement({
    ...HOME,
    mode: "HYBRID",
    gestureHandling: "GREEDY",
    language: "en",
  });
  $("#map-host").append(map);
  map.addEventListener("gmp-error", (e) => console.warn("Map3D error", e));
  // Imagery (especially offshore) can take a few seconds; say so instead of showing a blank view.
  let loadTimer;
  map.addEventListener("gmp-steadychange", (e) => {
    clearTimeout(loadTimer);
    if (e.isSteady) $("#loading").classList.add("hidden");
    else loadTimer = setTimeout(() => $("#loading").classList.remove("hidden"), 1200);
  });
  map.addEventListener("gmp-click", onMapClick);
  map.addEventListener("pointerdown", () => { lastTarget = null; if (touring) stopTour(); }); // the user is moving the camera

  addLandmarkMarkers();
  buildExploreChips();
  buildSearch(places);
  wireControls();
  wireKeyboard();
  correctApproxLandmarks();
}

// ---------- camera ----------
function camNow() {
  const tilt = map.tilt ?? HOME.tilt, heading = map.heading ?? 0;
  const c = map.center;
  // Over land, Google's reported centre is the point under the middle of the screen.
  // Over the sea it can come back far away and deep below sea level, so in that case
  // work out the look-at point ourselves from the camera position, heading and tilt.
  if (c && c.altitude > -300 && c.altitude < 9000) {
    return { lat: c.lat, lng: c.lng, range: map.range ?? HOME.range, tilt, heading };
  }
  const cp = map.cameraPosition;
  if (!cp) return { ...HOME.center, range: HOME.range, tilt, heading };
  const alt = Math.max(cp.altitude, 30);
  const t = (Math.min(tilt, 80) * Math.PI) / 180, h = (heading * Math.PI) / 180;
  const d = alt * Math.tan(t);
  const lat = cp.lat + (d * Math.cos(h)) / 111320;
  const lng = cp.lng + (d * Math.sin(h)) / (111320 * Math.cos((cp.lat * Math.PI) / 180));
  // If we just flew to a place nearby, that is the true focus (sea level makes the estimate drift).
  if (lastTarget && distM(lastTarget, { lat, lng }) < 1500) return { ...lastTarget, range: lastTarget.range, tilt, heading };
  return { lat, lng, range: alt / Math.cos(t), tilt, heading };
}
let lastTarget = null;
function flyTo(pos, { range = 650, tilt = 62, heading, duration = 2800 } = {}) {
  map.stopCameraAnimation?.();
  lastTarget = { lat: pos.lat, lng: pos.lng, range };
  return new Promise((resolve) => {
    const done = () => { map.removeEventListener("gmp-animationend", done); resolve(); };
    map.addEventListener("gmp-animationend", done);
    map.flyCameraTo({
      endCamera: { center: { lat: pos.lat, lng: pos.lng, altitude: 0 }, range, tilt, heading: heading ?? camNow().heading },
      durationMillis: duration,
    });
    setTimeout(done, duration + 1500); // safety net
  });
}
function orbit(pos, { range, tilt, seconds = 24 } = {}) {
  const c = camNow();
  const p = pos || c;
  return new Promise((resolve) => {
    const done = () => { map.removeEventListener("gmp-animationend", done); resolve(); };
    map.addEventListener("gmp-animationend", done);
    map.flyCameraAround({
      camera: { center: { lat: p.lat, lng: p.lng, altitude: 0 }, range: range ?? c.range, tilt: tilt ?? Math.max(c.tilt, 55), heading: c.heading },
      durationMillis: seconds * 1000,
      repeatCount: 1,
    });
    setTimeout(done, seconds * 1000 + 1500); // safety net
  });
}

// ---------- landmarks ----------
function landmarkPos(lm) {
  const c = placeCache[lm.id];
  return c?.lat ? { lat: c.lat, lng: c.lng } : { lat: lm.lat, lng: lm.lng };
}

function buildLandmarkList(filter = "") {
  const list = $("#landmark-list");
  const f = filter.trim().toLowerCase();
  list.innerHTML = "";
  for (const [catId, cat] of Object.entries(CATS)) {
    const items = LANDMARKS.filter((l) => l.cat === catId && (!f || (l.name + " " + l.blurb).toLowerCase().includes(f)));
    if (!items.length) continue;
    const g = document.createElement("div");
    g.className = "lm-group";
    g.innerHTML = `<h3><span class="dot" style="background:${cat.color}"></span>${esc(cat.label)}</h3>`;
    for (const lm of items) {
      const b = document.createElement("button");
      b.className = "lm-item";
      b.dataset.id = lm.id;
      b.innerHTML = `<b>${esc(lm.name)}</b><small>${esc(lm.blurb)}</small>`;
      b.addEventListener("click", () => {
        if (!map) { showSetup(); return; }
        stopTour(); openLandmark(lm); closeSidebarMobile();
      });
      g.append(b);
    }
    list.append(g);
  }
  if (!list.children.length) list.innerHTML = `<p class="hint">No landmark matches “${esc(filter)}”. Try the search box above to find any place on Google Maps.</p>`;
}

function makePin(color, scale = 1) {
  if (!PinElement) return null;
  try { return new PinElement({ background: color, borderColor: "#ffffff", glyphColor: "#ffffff", scale }); } catch { return null; }
}

function addLandmarkMarkers() {
  for (const lm of LANDMARKS) {
    const pos = landmarkPos(lm);
    const mk = new Marker3D({
      position: { lat: pos.lat, lng: pos.lng, altitude: lm.featured ? 70 : 45 },
      altitudeMode: "RELATIVE_TO_GROUND",
      extruded: true,
      label: lm.name,
    });
    const pin = makePin(CATS[lm.cat].color, lm.featured ? 1.25 : 1);
    if (pin) mk.append(pin);
    mk.addEventListener("gmp-click", (e) => { e.stopPropagation?.(); stopTour(); openLandmark(lm); });
    map.append(mk);
    landmarkMarkers.set(lm.id, mk);
  }
}

function setActiveListItem(id) {
  document.querySelectorAll(".lm-item").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
}

const pendingLookups = {};
function resolveLandmark(lm) {
  if (placeCache[lm.id]?.id) return Promise.resolve(placeCache[lm.id]);
  // Share one in-flight lookup per landmark so repeated clicks don't repeat API calls.
  return (pendingLookups[lm.id] ||= lookupLandmark(lm).finally(() => delete pendingLookups[lm.id]));
}
async function lookupLandmark(lm) {
  try {
    const { places } = await Place.searchByText({
      textQuery: lm.query,
      fields: ["id", "displayName", "location"],
      locationBias: { center: { lat: lm.lat, lng: lm.lng }, radius: lm.approx ? 5000 : 2000 },
      maxResultCount: 1,
      region: "in",
    });
    const p = places?.[0];
    if (!p?.location) return null;
    const loc = ll(p.location);
    // Only trust the Google match if it's close to where we expect the landmark.
    if (distM(loc, lm) > (lm.approx ? 6000 : 2500)) return null;
    placeCache[lm.id] = { id: p.id, lat: loc.lat, lng: loc.lng };
    saveCache();
    return placeCache[lm.id];
  } catch (err) {
    console.warn("Places lookup failed for", lm.name, err);
    return null;
  }
}

// Landmarks whose position we only know roughly get snapped to Google's location once.
async function correctApproxLandmarks() {
  for (const lm of LANDMARKS.filter((l) => l.approx && !placeCache[l.id])) {
    const r = await resolveLandmark(lm);
    if (r) {
      const mk = landmarkMarkers.get(lm.id);
      if (mk) mk.position = { lat: r.lat, lng: r.lng, altitude: lm.featured ? 70 : 45 };
    }
  }
}

async function openLandmark(lm, { fly = true } = {}) {
  setActiveListItem(lm.id);
  renderDetails({ landmark: lm, loading: true });
  // Look up Google's exact position first (cached after the first time), then fly once.
  // Two overlapping camera flights can leave the 3D camera in a broken state.
  const timeout = new Promise((res) => setTimeout(() => res(null), 2000));
  const r = await Promise.race([resolveLandmark(lm), timeout]);
  if (fly) flyTo(r?.lat ? r : landmarkPos(lm), { range: lm.cat === "coast" ? 1400 : 650 });
  if (r?.lat) { const mk = landmarkMarkers.get(lm.id); if (mk) mk.position = { lat: r.lat, lng: r.lng, altitude: lm.featured ? 70 : 45 }; }
  const rr = r || (await resolveLandmark(lm)); // if the lookup was slow, wait for it for the details
  let place = null;
  if (rr?.id) place = await fetchDetails(new Place({ id: rr.id }));
  renderDetails({ landmark: lm, place });
}

// ---------- place details ----------
async function fetchDetails(place) {
  try {
    await place.fetchFields({ fields: DETAIL_FIELDS });
  } catch (err) {
    console.warn("Full details failed, retrying basic fields", err);
    try { await place.fetchFields({ fields: BASIC_FIELDS }); } catch (e2) { console.warn(e2); return null; }
  }
  return place;
}

async function openPlace(place, { fly = true } = {}) {
  setActiveListItem(null);
  renderDetails({ loading: true, title: place.displayName || "Loading…" });
  const p = await fetchDetails(place);
  if (!p) { renderDetails({ error: "Couldn't load details for this place." }); return; }
  const loc = ll(p.location);
  // If this Google place is one of our curated landmarks, show the extra history too.
  const lm = LANDMARKS.find((l) => placeCache[l.id]?.id === p.id)
    || (loc && LANDMARKS.find((l) => distM(loc, landmarkPos(l)) < 40))
    || (loc && LANDMARKS.find((l) => distM(loc, landmarkPos(l)) < 800 && namesMatch(l.name, p.displayName)));
  if (fly && loc) {
    const c = camNow();
    flyTo(loc, { range: Math.min(Math.max(c.range, 350), 900), duration: 1800 });
  }
  renderDetails({ landmark: lm, place: p });
}

function renderDetails({ landmark: lm, place: p, loading, error, title, html }) {
  const panel = $("#details");
  const body = $("#details-body");
  panel.classList.remove("hidden");
  panel.scrollTop = 0;
  if (error) { body.innerHTML = `<div class="d-main"><p class="error">${esc(error)}</p></div>`; return; }
  if (html) { body.innerHTML = html; return; }

  const cat = lm ? CATS[lm.cat] : null;
  const name = lm?.name || p?.displayName || title || "";
  const photos = (p?.photos || []).slice(0, 8);
  const loc = ll(p?.location) || (lm ? landmarkPos(lm) : null);

  let out = "";
  if (photos.length) {
    out += `<img class="d-photo" id="d-photo" alt="${esc(name)}" src="${esc(photos[0].getURI({ maxWidth: 800, maxHeight: 500 }))}">`;
    out += `<div class="d-attr" id="d-attr">${photoAttr(photos[0])}</div>`;
    if (photos.length > 1) {
      out += `<div class="d-strip">${photos.map((ph, i) => `<img data-i="${i}" class="${i ? "" : "on"}" alt="Photo ${i + 1} of ${esc(name)}" src="${esc(ph.getURI({ maxWidth: 200, maxHeight: 140 }))}">`).join("")}</div>`;
    }
  }
  out += `<div class="d-main">`;
  if (cat) out += `<div class="d-cat"><span class="dot" style="background:${cat.color}"></span>${esc(cat.label)}</div>`;
  else if (p?.primaryType || p?.types?.length) out += `<div class="d-cat">${esc(prettyType(p.primaryType || p.types[0]))}</div>`;
  out += `<h2 class="d-title">${esc(name)}</h2>`;
  if (p?.rating) out += `<div class="d-rating">★ ${p.rating.toFixed(1)} <span>(${(p.userRatingCount || 0).toLocaleString("en-IN")} Google reviews)</span></div>`;
  if (p?.businessStatus && p.businessStatus !== "OPERATIONAL") out += `<p class="error">${esc(prettyType(p.businessStatus.toLowerCase()))}</p>`;

  if (lm) {
    out += `<p class="d-blurb">${esc(lm.blurb)}</p>`;
    if (lm.details?.length) out += `<div class="d-text">${lm.details.map((d) => `<p>${esc(d)}</p>`).join("")}</div>`;
    if (lm.owner) out += ownerBlock(lm.owner);
  }
  const summary = p?.editorialSummary;
  if (summary && (!lm || !lm.blurb.toLowerCase().includes(summary.toLowerCase().slice(0, 20)))) {
    out += `<p class="d-blurb">${esc(summary)}</p>`;
  }

  if (loading) out += `<p class="d-loading">Loading Google photos and details…</p>`;

  const rows = [];
  if (p?.formattedAddress) rows.push(["Address", esc(p.formattedAddress)]);
  const hours = p?.regularOpeningHours?.weekdayDescriptions;
  if (hours?.length) rows.push(["Hours", `<ul class="d-hours">${hours.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`]);
  if (p?.nationalPhoneNumber) rows.push(["Phone", `<a href="tel:${esc(p.nationalPhoneNumber.replace(/\s/g, ""))}">${esc(p.nationalPhoneNumber)}</a>`]);
  if (p?.websiteURI) rows.push(["Website", `<a href="${esc(p.websiteURI)}" target="_blank" rel="noopener">${esc(p.websiteURI.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a>`]);
  if (loc) rows.push(["Location", `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`]);
  if (rows.length) out += `<div class="d-rows">${rows.map(([k, v]) => `<div class="d-row"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("")}</div>`;

  if (loc) {
    const gmaps = p?.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
    out += `<div class="d-actions">
      <button class="btn primary" id="d-orbit">⟳ Orbit in 3D</button>
      <button class="btn" id="d-street">Street View ↗</button>
      <a class="btn" href="${esc(gmaps)}" target="_blank" rel="noopener">Open in Google Maps</a>
      <a class="btn" href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}" target="_blank" rel="noopener">Directions</a>
    </div>`;
  }
  if (lm && loc) out += landRecordsBlock(loc);
  if (p) out += `<p class="d-src">Photos, ratings and hours from Google Maps.${lm ? " History and ownership notes curated for this site from the linked public sources." : ""}</p>`;
  out += `</div>`;
  body.innerHTML = out;

  // photo strip
  body.querySelectorAll(".d-strip img").forEach((img) => img.addEventListener("click", () => {
    const ph = photos[+img.dataset.i];
    $("#d-photo").src = ph.getURI({ maxWidth: 800, maxHeight: 500 });
    $("#d-attr").innerHTML = photoAttr(ph);
    body.querySelectorAll(".d-strip img").forEach((x) => x.classList.toggle("on", x === img));
  }));
  $("#d-orbit")?.addEventListener("click", () => {
    flyTo(loc, { range: lm?.cat === "coast" ? 1400 : 600, duration: 1500 }).then(() => orbit(loc));
  });
  $("#d-street")?.addEventListener("click", () => showStreetView(loc));
}

// Who owns or runs a landmark (institutions only), with the public sources it came from.
function ownerBlock(o) {
  const src = (o.src || []).map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join(" · ");
  return `<div class="d-owner">
    <div class="d-owner-k">Owned / run by</div>
    <div class="d-owner-v"><b>${esc(o.by)}</b>${o.weak ? ` <span class="tag">unconfirmed</span>` : ""}</div>
    ${o.note ? `<p>${esc(o.note)}</p>` : ""}
    ${src ? `<p class="d-owner-src">Source: ${src}</p>` : ""}
  </div>`;
}

// Links to the Government of Karnataka's official land-record services, for looking up one property.
function landRecordsBlock(loc) {
  const link = (href, label) => `<a class="btn" href="${href}" target="_blank" rel="noopener">${label} ↗</a>`;
  return `<details class="d-land">
    <summary>Land records (Government of Karnataka)</summary>
    <p>Spot: <b>${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</b>. To look up this property's official record:</p>
    <ol>
      <li>Open the <b>Dishaank</b> app at this spot to get its survey number.</li>
      <li>Enter it on <b>Bhoomi</b> (View RTC: Udupi district, then taluk, hobli, village) to see the record of rights.</li>
      <li>For registered sales and mortgages, use <b>Kaveri 2.0</b>. Town properties are recorded with the city council (<b>e-Aasthi</b>).</li>
    </ol>
    <div class="d-actions">
      ${link("https://mapps.mgov.gov.in/details?appid=2100", "Dishaank app")}
      ${link("https://landrecords.karnataka.gov.in/", "Bhoomi RTC")}
      ${link("https://kaveri.karnataka.gov.in/", "Kaveri 2.0")}
      ${link("https://eaasthi.karnataka.gov.in/", "e-Aasthi")}
    </div>
    <p class="d-owner-src">Records can be out of date, and temples, campuses and government sites are usually held by the institution itself.</p>
  </details>`;
}

function photoAttr(ph) {
  const a = ph?.authorAttributions?.[0];
  if (!a) return "";
  const n = esc(a.displayName || "Google user");
  return a.uri ? `Photo: <a href="${esc(a.uri)}" target="_blank" rel="noopener">${n}</a>` : `Photo: ${n}`;
}

// Street View opens in Google Maps itself: it works with every key (including the
// free Demo Key, which can't embed Street View) and shows the real street-level photos.
function showStreetView(loc) {
  window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${loc.lat},${loc.lng}`, "_blank", "noopener");
}

// ---------- clicking the map ----------
async function onMapClick(e) {
  if (touring) stopTour();
  if (e.placeId) {
    e.preventDefault(); // we show our own panel instead of Google's popover
    try {
      const place = await e.fetchPlace();
      openPlace(place, { fly: false });
    } catch (err) {
      console.warn(err);
      renderDetails({ error: "Couldn't load that place." });
    }
    return;
  }
  if (e.position) whatsHere(ll(e.position));
}

async function whatsHere(pos) {
  setActiveListItem(null);
  renderDetails({ html: `<div class="d-main"><div class="d-cat">This spot</div><h2 class="d-title">${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}</h2><p class="d-loading">Finding nearby buildings and businesses…</p></div>` });
  let places = [];
  try {
    const res = await Place.searchNearby({
      fields: ["id", "displayName", "location", "primaryType", "types", "formattedAddress"],
      locationRestriction: { center: pos, radius: 150 },
      maxResultCount: 12,
      rankPreference: google.maps.places.SearchNearbyRankPreference?.DISTANCE ?? "DISTANCE",
    });
    places = res.places || [];
  } catch (err) { console.warn(err); }

  const gmaps = `https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`;
  let html = `<div class="d-main"><div class="d-cat">This spot</div><h2 class="d-title">${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}</h2>`;
  html += places.length
    ? `<p class="d-blurb">${places.length} place${places.length > 1 ? "s" : ""} on Google Maps within 150 m:</p><div class="near-list">${places.map((p, i) => `
        <button class="near-item" data-i="${i}"><span><b>${esc(p.displayName)}</b><small>${esc(prettyType(p.primaryType || p.types?.[0]))}</small></span><span class="dist">${fmtDist(distM(pos, ll(p.location)))}</span></button>`).join("")}</div>`
    : `<p class="d-blurb">Google Maps lists no businesses or landmarks within 150 m of this spot.</p>`;
  html += `<div class="d-actions"><button class="btn" id="d-street">Street View ↗</button><a class="btn" href="${gmaps}" target="_blank" rel="noopener">Open in Google Maps</a></div></div>`;
  renderDetails({ html });
  $("#details-body").querySelectorAll(".near-item").forEach((b) => b.addEventListener("click", () => openPlace(places[+b.dataset.i])));
  $("#d-street")?.addEventListener("click", () => showStreetView(pos));
}

// ---------- explore nearby (shops, restaurants, …) ----------
function buildExploreChips() {
  const wrap = $("#explore-chips");
  for (const ex of EXPLORE) {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = ex.label;
    b.addEventListener("click", () => toggleExplore(ex, b));
    wrap.append(b);
  }
}

function clearExplore() {
  exploreMarkers.forEach((m) => m.remove());
  exploreMarkers = [];
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
  $("#explore-status").textContent = "";
  activeExplore = null;
}

async function toggleExplore(ex, chip) {
  if (activeExplore === ex) { clearExplore(); return; }
  clearExplore();
  activeExplore = ex;
  chip.classList.add("on");
  const c = camNow();
  const radius = Math.round(Math.min(Math.max(c.range * 0.7, 400), 5000));
  $("#explore-status").textContent = `Searching ${ex.label.toLowerCase()} within ${fmtDist(radius)} of the view centre…`;
  try {
    const { places } = await Place.searchNearby({
      fields: ["id", "displayName", "location", "primaryType", "types", "rating"],
      locationRestriction: { center: { lat: c.lat, lng: c.lng }, radius },
      includedTypes: ex.types,
      maxResultCount: 20,
    });
    if (activeExplore !== ex) return;
    for (const p of places || []) {
      const loc = ll(p.location);
      const mk = new Marker3D({ position: { lat: loc.lat, lng: loc.lng, altitude: 25 }, altitudeMode: "RELATIVE_TO_GROUND", extruded: true, label: p.displayName });
      const pin = makePin("#E0457B", 0.8); // distinct from landmark category colours
      if (pin) mk.append(pin);
      mk.addEventListener("gmp-click", (e) => { e.stopPropagation?.(); openPlace(p, { fly: false }); });
      map.append(mk);
      exploreMarkers.push(mk);
    }
    const n = places?.length || 0;
    $("#explore-status").textContent = n
      ? `${n} ${ex.label.toLowerCase()} shown${n === 20 ? " (the 20 closest; zoom in or move to see others)" : ""}. Click a pin for details.`
      : `No ${ex.label.toLowerCase()} found here. Move the map and try again.`;
  } catch (err) {
    console.warn(err);
    $("#explore-status").textContent = "Search failed. Check that Places API (New) is enabled for your key.";
  }
}

// ---------- search ----------
function buildSearch(places) {
  const slot = $("#search-slot");
  const Ctor = places.PlaceAutocompleteElement;
  if (!Ctor) return;
  let ac;
  try {
    ac = new Ctor({ locationRestriction: DISTRICT, includedRegionCodes: ["in"] });
  } catch {
    ac = new Ctor({});
  }
  ac.setAttribute("placeholder", "Search any shop, building or address in Udupi");
  slot.append(ac);
  // Newer API: gmp-select with placePrediction. Older: gmp-placeselect with place.
  ac.addEventListener("gmp-select", async (ev) => {
    const place = ev.placePrediction?.toPlace ? ev.placePrediction.toPlace() : ev.place;
    if (place) { stopTour(); openPlace(place); closeSidebarMobile(); }
  });
  ac.addEventListener("gmp-placeselect", (ev) => { if (ev.place) { stopTour(); openPlace(ev.place); closeSidebarMobile(); } });
}

// ---------- controls ----------
function wireControls() {
  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
    map.mode = b.dataset.mode;
    document.querySelectorAll(".seg button").forEach((x) => x.classList.toggle("on", x === b));
  }));
  $("#home-btn").addEventListener("click", () => { stopTour(); flyTo(HOME.center, { range: HOME.range, tilt: HOME.tilt, heading: HOME.heading }); });
  $("#orbit-btn").addEventListener("click", () => { stopTour(); orbit(); });
  $("#topdown-btn").addEventListener("click", () => {
    stopTour();
    const c = camNow();
    flyTo(c, { range: c.range, tilt: c.tilt > 20 ? 0 : 60, heading: c.heading, duration: 900 });
  });
  $("#details-close").addEventListener("click", () => { $("#details").classList.add("hidden"); setActiveListItem(null); });
  $("#lm-filter").addEventListener("input", (e) => buildLandmarkList(e.target.value));
  $("#tour-btn").addEventListener("click", () => (touring ? stopTour() : startTour()));
  $("#help-btn").addEventListener("click", () => $("#help").classList.remove("hidden"));
  document.querySelectorAll(".modal [data-close]").forEach((b) => b.addEventListener("click", () => b.closest(".modal").classList.add("hidden")));
  $("#help").addEventListener("click", (e) => { if (e.target.id === "help") e.target.classList.add("hidden"); });
  if (store.get("udupi3d.noteSeen")) $("#note").classList.add("hidden");
  $("#note-close").addEventListener("click", () => { $("#note").classList.add("hidden"); store.set("udupi3d.noteSeen", "1"); });
  $("#sidebar-open").addEventListener("click", () => $("#sidebar").classList.add("open"));
  $("#sidebar-close").addEventListener("click", closeSidebarMobile);
}
function closeSidebarMobile() { $("#sidebar").classList.remove("open"); }

// ---------- keyboard flying ----------
function wireKeyboard() {
  const held = new Set();
  const tapped = new Set();
  const KEYS = new Set(["w", "a", "s", "d", "q", "e", "r", "f", "z", "x", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
  const typing = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable || el.tagName?.startsWith("GMP-PLACE"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { document.querySelectorAll(".modal").forEach((m) => { if (m.id !== "setup") m.classList.add("hidden"); }); return; }
    if (typing(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (!KEYS.has(k)) return;
    e.preventDefault();
    if (touring) stopTour();
    if (!held.size && !tapped.size) { map.stopCameraAnimation?.(); last = performance.now(); requestAnimationFrame(step); }
    held.add(k);
    tapped.add(k); // so a quick tap still moves the camera a little
  });
  document.addEventListener("keyup", (e) => held.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => held.clear());

  let last = 0;
  function step(t) {
    const active = new Set([...held, ...tapped]);
    if (!active.size) return;
    const tapOnly = [...tapped].some((k) => !held.has(k));
    tapped.clear();
    const dt = Math.max(Math.min((t - last) / 1000, 0.1), tapOnly ? 0.12 : 0);
    last = t;
    const c = camNow();
    const speed = c.range * 0.9 * dt; // metres this frame, scales with zoom
    let fwd = 0, side = 0;
    if (active.has("w") || active.has("arrowup")) fwd += 1;
    if (active.has("s") || active.has("arrowdown")) fwd -= 1;
    if (active.has("d") || active.has("arrowright")) side += 1;
    if (active.has("a") || active.has("arrowleft")) side -= 1;
    let { heading, tilt, range } = c;
    if (active.has("q")) heading -= 60 * dt;
    if (active.has("e")) heading += 60 * dt;
    if (active.has("r")) tilt = Math.min(tilt + 40 * dt, 85);
    if (active.has("f")) tilt = Math.max(tilt - 40 * dt, 0);
    if (active.has("z")) range = Math.max(range * (1 - 1.2 * dt), 60);
    if (active.has("x")) range = Math.min(range * (1 + 1.2 * dt), 200000);
    const h = (heading * Math.PI) / 180;
    const north = (fwd * Math.cos(h) - side * Math.sin(h)) * speed;
    const east = (fwd * Math.sin(h) + side * Math.cos(h)) * speed;
    const lat = c.lat + north / 111320;
    const lng = c.lng + east / (111320 * Math.cos((c.lat * Math.PI) / 180));
    map.center = { lat, lng, altitude: 0 };
    lastTarget = { lat, lng, range }; // keep our own focus exact (Google's can drift over the sea)
    map.heading = (heading + 360) % 360;
    map.tilt = tilt;
    map.range = range;
    requestAnimationFrame(step);
  }
}

// ---------- guided tour ----------
let tourId = 0;
async function startTour() {
  const me = ++tourId;
  touring = true;
  $("#tour-btn").textContent = "■ Stop tour";
  const stops = LANDMARKS.filter((l) => l.featured);
  for (const lm of stops) {
    if (me !== tourId) return;
    openLandmark(lm, { fly: false });
    const pos = landmarkPos(lm);
    const range = lm.cat === "coast" ? 1500 : 700;
    await flyTo(pos, { range, tilt: 62, duration: 4000 });
    if (me !== tourId) return;
    await orbit(pos, { range, tilt: 62, seconds: 14 });
  }
  if (me === tourId) stopTour();
}
function stopTour() {
  if (!touring) return;
  touring = false;
  tourId++;
  map?.stopCameraAnimation?.();
  $("#tour-btn").textContent = "▶ Start tour";
}
