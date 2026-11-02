# Roadwise Arlington

A dependency-free, mobile-first course for building a practical mental map of Arlington, Massachusetts and its regional gateways. Roadwise teaches a sparse network progressively: recognize a corridor, connect it to familiar anchors, choose the next major direction, and rehearse useful destination journeys.

## Course

The vertical course path unlocks one lesson at a time. Each normal round mixes recognition, route-chain, and next-decision questions internally rather than asking the learner to choose a mode. Once prior material exists, rounds target roughly **70% familiar recall / 30% newer material**, and each lesson introduces at most 2–3 concepts.

- **Unit 1 — Arlington backbone:** Mass Ave, Arlington Center, Broadway, Pleasant Street / Route 60, Mystic Street.
- **Unit 2 — Cross-town connectors:** Summer Street, Park Avenue, Lake Street, Arlington Heights, East Arlington, Spy Pond.
- **Unit 3 — Regional gateways:** Route 2, Route 16 / Alewife Brook Parkway / Mystic Valley Parkway, Alewife, Fresh Pond, Lexington / Wilson Farm, Medford, and Davis Square.
- **Unit 4 — Destination journeys:** Fenway Park and downtown / TD Garden, including primary and alternate gateway concepts and the reverse trip home.
- **Unit 5 — Airport journey:** Logan Airport at a high level, with an explicit reminder that tunnels, ramps, traffic, construction, and the terminal approach require current GPS guidance.

Checkpoints emphasize ordered route chains through previously learned anchors. The compact **Explore map** switches between local and regional study views and only reveals learned roads plus a preview of what comes next.

## Progress and review

Progress is stored only in the browser under `localStorage["roadwise-progress"]` using schema version 2:

- per-concept mastery (0–100)
- completed lessons and next/current unit
- XP, daily streak, answered count, and mistakes
- review-due timestamps for weak concepts

Wrong answers lower relevant mastery and schedule those concepts for **Review weak spots**. Correct review answers raise mastery and clear due status once the concept is stronger.

Older prototype data containing only `points`, `streak`, and `answered` is migrated defensively into the new schema. Malformed or unavailable storage falls back to a clean course without throwing.

## Run locally

No build, package manager, backend, account, analytics, or service worker is required.

```bash
cd /home/mbohnenberger/.openclaw/workspace/apps/roadwise-arlington
python3 -m http.server 8765
# open http://127.0.0.1:8765
```

## Accessibility and mobile behavior

- Semantic buttons and headings, skip link, visible keyboard focus, Escape-to-close, and number-key answer shortcuts.
- Reduced-motion and increased-contrast accommodations.
- Phone-first layout with safe-area padding.
- The fixed answer-feedback footer is measured with `ResizeObserver`; the lesson body dynamically reserves its actual rendered height so questions and controls are not hidden behind it on small screens.
- Add-to-Home-Screen-friendly metadata is included; offline caching is intentionally not implemented.

## Important limitations

Roadwise is a **study tool, not navigation**. All paths, junctions, route chains, labels, and relative positions are hand-authored, approximate, simplified, and not to scale. They omit exact ramps, turn restrictions, one-way rules, construction, traffic, travel time, lane choice, bike suitability, and many local streets. Destination lessons teach robust high-level structure—gateway, decision point, alternate, and reverse/home direction—not turn-by-turn directions.

Always obey posted signs and use authoritative current navigation when traveling. This is especially important for Logan Airport’s tunnel, ramp, traffic, and terminal approach.

## Verification

The redesign was checked with:

```bash
node --check app.js
python3 -m http.server 8765
curl -I http://127.0.0.1:8765/
curl -I http://127.0.0.1:8765/styles.css
curl -I http://127.0.0.1:8765/app.js
```

Additional source/state checks cover the old `points/streak/answered` migration path, the complete curriculum and destination data, localStorage schema fields, review scheduling, and the dynamic `--footer-space` / safe-area CSS path.
