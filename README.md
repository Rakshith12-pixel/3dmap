# Karnataka in 3D

A 3D map of Karnataka exploring all 31 districts, built on Google Maps 3D (`Map3DElement`) and Places API (New).

## Run it

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Then open http://localhost:8080 and paste your Google Maps API key when asked
(or copy `config.example.js` to `config.js` and put it there). You can also jump directly to any district using a URL parameter, e.g. `http://localhost:8080/?district=mysuru` or `?district=vijayanagara`.

## Getting a key

- Quickest: a free **Maps Demo Key** at https://developers.google.com/maps/demo-key (no credit card, daily limit). It doesn't include Google place photos.
- Or a regular key from Google Cloud Console with **Maps JavaScript API** and **Places API (New)** enabled,
  restricted to `http://localhost:*` referrers.

## What it does

- **All 31 Districts of Karnataka**: Switch between any district (Udupi, Mysuru, Bengaluru Urban, Vijayanagara/Hampi, Dakshina Kannada, Kodagu, Uttara Kannada, Belagavi, etc.) with a grouped dropdown selector. The camera smoothly flies across the state to the selected district.
- **Real satellite imagery on 3D terrain**. Move with the mouse: drag to pan, right-drag or Ctrl+drag to rotate and tilt, scroll to zoom. WASD, Q/E, R/F and Z/X also fly the camera.
- **District-focused Search**: Search any building, street or business restricted and biased to the active district.
- **Curated Landmarks & 3D Tours**: Over 375 curated heritage sites, temples, waterfalls, hills, sanctuaries, and monuments across all 31 districts with guided 3D fly-and-orbit tours.
- **Explore around the view**: Pins restaurants, shops, hotels, hospitals, temples, and sights near the camera with multi-batch querying for up to 40 pins.
- **Click anywhere on the map**: Click any label for photos, reviews, hours and contact info, or click any spot to see everything Google knows within 250 m (up to 20 places).
- **Street View**: Jump to real street-level panoramas in Google Maps.
- **Official Karnataka Land Records**: Every spot and landmark links directly to Karnataka's official land record portals (Dishaank, Bhoomi RTC, Kaveri 2.0, e-Aasthi).

## Project Structure

```text
3dmap-main/
├── index.html               # Main application entry point with preloading & performance hints
├── config.example.js        # Optional API key template (copy to config.js or assets/js/config.js)
├── README.md                # Documentation and quickstart
├── .gitignore               # Git rules protecting keys and cache files
└── assets/
    ├── css/
    │   └── style.css        # Responsive dark UI theme, panel layouts & controls
    ├── js/
    │   └── app.js           # 3D map engine, district switching, camera flights & tours
    └── data/
        ├── districts.js     # Data for all 31 Karnataka districts (boundaries, coordinates & 375+ landmarks)
        └── landmarks.js     # Deep historical landmarks & citations for Udupi
```

### Performance & Fast Access
- **Parallel Deferred Loading**: Scripts and stylesheets load with `preload`, `modulepreload`, and `defer`, cutting parser-blocking wait times.
- **Preconnected API Endpoints**: Preconnects and DNS-prefetches Google Fonts, Google Maps JS API, and Places API for immediate connection reuse.
- **O(1) In-Memory Indexing**: District lookups and landmark markers use instant Map keys rather than linear search scans.
- **Local Cache**: Resolved Google Place IDs and coordinates persist in `localStorage` to avoid redundant Places API roundtrips.

Google has no photorealistic 3D buildings for India yet (checked against Google's official coverage map in Nov 2026).
If Google adds them, this page shows them automatically with no code changes.
