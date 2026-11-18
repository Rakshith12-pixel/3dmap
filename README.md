# Udupi in 3D

A 3D map of Udupi district built on Google Maps 3D (Maps JavaScript API) and Places API (New).

## Run it

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Then open http://localhost:8080 and paste your Google Maps API key when asked
(or copy `config.example.js` to `config.js` and put it there).

## Getting a key

- Quickest: a free **Maps Demo Key** at https://developers.google.com/maps/demo-key (no credit card, daily limit). It doesn't include Google place photos.
- Or a regular key from Google Cloud Console with **Maps JavaScript API** and **Places API (New)** enabled,
  restricted to `http://localhost:*` referrers.

## What it does

- Real satellite imagery on 3D terrain. Move with the mouse: drag to pan, right-drag or Ctrl+drag to rotate and tilt, scroll to zoom.
  WASD, Q/E, R/F and Z/X also fly the camera.
- Click any label on the map (shop, building, temple, office) for Google's details: photos, rating, hours, phone, website.
- Click anywhere else to list everything Google knows of within 150 m.
- Over 35 curated landmarks with history notes, plus a guided tour.
- "Explore around the view" pins restaurants, shops, hotels, hospitals and more near the camera.
- Street View button opens Google Maps at street level for real photos of the buildings.
- Major landmarks show who owns or runs them (institutions only, such as ASI, MAHE or the Diocese of Udupi), with links to public sources.
- Each landmark has a "Land records" section with its coordinates and links to the official Karnataka portals
  (Dishaank, Bhoomi RTC, Kaveri 2.0, e-Aasthi) for looking up a property yourself.

## Files

- `index.html`, `style.css`: page layout and styling
- `app.js`: map, search, details panel, keyboard controls, tour
- `landmarks.js`: curated landmarks with history notes and ownership sources
- `config.example.js`: template for `config.js`, an optional place for your API key. `config.js` is git-ignored so the key stays off GitHub.

Google has no photorealistic 3D buildings for India yet (checked against Google's official coverage map in Nov 2026).
If Google adds Udupi, this page shows them automatically with no code changes.
