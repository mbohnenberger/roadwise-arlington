# Roadwise

Roadwise is a mobile-first static web app for building and practicing mental maps. The original Arlington course from commit `b2b1d9b` is preserved as the built-in seed; the player now consumes a generic versioned course manifest. Leaflet 1.9.4 is vendored locally for real-map rendering, with no runtime JavaScript/CSS CDN.

## What works in the static demo

- A library lists multiple courses, percent complete, current lesson, and last activity.
- Course switching keeps progress, mastery, route unlocks, streak, and review state isolated per course.
- Existing `localStorage["roadwise-progress"]` data migrates once into Arlington’s per-course record.
- Custom courses live in browser localStorage. They can be edited/regenerated, archived/restored, removed after confirmation, reset independently, and exported/imported as validated JSON.
- The setup flow supports explicit place search, a dependency-free equirectangular world selector, and fully offline/manual place entry.
- Users enter 3–8 roads and 3–12 anchors with types, optional direction notes, and confirmed road associations.
- The fallback generates a short progressive draft covering road recognition, road-to-anchor relationships, forward A→B routes, reverse routes, and a route-practice pool.
- The generator creates routes only between anchors the user associated with the same submitted road. It does not invent geography.
- Arlington retains its course path, mastery/review mechanics, route quizzes, corrected geography, destination anchors, accessible controls, and dynamic mobile feedback-footer spacing. Lessons and Explore use a real Leaflet/OpenStreetMap basemap when visible concepts have reviewed static geospatial data; the collision-aware SVG remains the offline/missing-geometry fallback.

There is **no account, cloud sync, backend generation, or cross-device backup** in this version. Export custom manifests you want to keep. Every generated course is visibly marked **draft** until reviewed. Roadwise is a study tool, not navigation.

## Architecture

- `courses/arlington-ma.js` — portable Arlington schema-v1 seed manifest, preserved from `b2b1d9b`
- `courses/arlington-geodata.js` — simplified static OSM-derived road geometry, anchor coordinates, source way IDs, and retrieval provenance
- `vendor/leaflet/` — locally vendored Leaflet 1.9.4 assets and BSD-2-Clause license
- `core.js` — schema validation, safe JSON import, progress/store migration, course lifecycle, provider interfaces, static generator, production API adapter
- `app.js` — library, setup/editor, generic course player, map, quizzes, import/export
- `index.html` / `styles.css` — mobile-first application shell and visual system
- `docs/course-schema.md` — manifest schema and compatibility rules
- `docs/generate-api.md` — production `POST /api/courses/generate` request/response/error contract
- `test-regression.js` — deterministic schema, migration, isolation, generation, import, geography, and mobile regressions

No build step, framework, package manager, credentials, analytics, or service worker is required.

## Place search and data policy

Search happens **only after explicit form submission**. There is no client-side autocomplete, background querying, or query-as-you-type behavior. The replaceable prototype adapter calls public Nominatim with `format=jsonv2`, `limit=5`, origin referrer policy, attribution, a one-request-per-second guard, and an in-memory query cache. Browser JavaScript cannot set a reliable custom `User-Agent`; no private email or credential is sent. Requests may still be rate-limited, blocked, or unavailable, and the UI falls back to map-picked coordinates plus a manually entered place name.

Public Nominatim is suitable only for this low-volume prototype interaction under its usage policy. It is not the production course-generation backend. OpenStreetMap attribution is shown for search results and retained in generated metadata where used. No public Overpass enrichment is enabled at runtime; Arlington’s road geometry was extracted once and committed as static data.

## Basemap and Arlington geodata

The replaceable map adapter defaults to `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, maximum zoom 19, with visible clickable `© OpenStreetMap contributors` attribution. It makes normal browser requests only for the current human-visible viewport: there is no tile prefetch, bulk download, service worker, offline cache, or restrictive referrer policy. Standard public OSM tiles are best-effort and appropriate here only for a low-volume prototype; production must switch to a suitable commercial provider or self-hosted tiles.

Arlington road overlays and anchor coordinates were derived from OpenStreetMap contributors in a one-time authoring pass on **2026-11-04**, using Overpass for ways and Nominatim for anchors, then simplified into static course data. The manifest records ODbL 1.0 provenance and source way IDs. No runtime Overpass request is made. Geometry is a teaching overlay, not precise routing.

If basemap tiles fail, Leaflet keeps the course geometry visible against a neutral background and offers the schematic fallback. Custom studio courses do not fabricate lines; without reviewed geometry they use the schematic map.

## Production architecture

A production Roadwise should use:

1. a server-side geocoder with caching, policy-compliant identification, rate limits, and provider abstraction;
2. cached regional OSM extracts/Overpass data or a commercial street/POI provider—not public endpoints as an application backend;
3. route-graph processing for connectivity, directionality, turn restrictions, and transport modes;
4. POI ranking and deduplication;
5. curriculum generation plus geographic/route QA and an explicit review/publish lifecycle;
6. authentication, cloud sync, backups, audit/provenance, and privacy/retention controls if cross-device storage is desired.

The client-side adapter and full API contract are documented in [`docs/generate-api.md`](docs/generate-api.md).

## Run locally

```bash
cd /home/mbohnenberger/.openclaw/workspace/apps/roadwise-arlington
python3 -m http.server 8765
# open http://127.0.0.1:8765
```

## Verification

```bash
for file in $(find . -name '*.js' -type f); do node --check "$file"; done
node test-regression.js
git diff --check
python3 -m http.server 8765
curl -fsS http://127.0.0.1:8765/ >/dev/null
curl -fsS http://127.0.0.1:8765/core.js >/dev/null
curl -fsS http://127.0.0.1:8765/app.js >/dev/null
curl -fsS http://127.0.0.1:8765/courses/arlington-ma.js >/dev/null
curl -fsS http://127.0.0.1:8765/courses/arlington-geodata.js >/dev/null
curl -fsS http://127.0.0.1:8765/styles.css >/dev/null
curl -fsS http://127.0.0.1:8765/vendor/leaflet/leaflet.js >/dev/null
curl -fsS http://127.0.0.1:8765/vendor/leaflet/leaflet.css >/dev/null
```

The deterministic suite verifies schema validation (including malformed and oversized GeoJSON), Arlington seed/geodata, feature selection and bounds, tile-provider policy and attribution, SVG fallback selection, exact-once legacy migration, per-course isolation, generated draft shape, no invented routes, route unlock isolation, preserved Arlington geography, and mobile/footer regressions.
