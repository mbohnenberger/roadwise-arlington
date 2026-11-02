# Roadwise Arlington — throwaway spike

## Question
Can a static, phone-friendly site use a curated local road graph to teach corridor relationships, junction choices, and route sequences—not merely street-name locations?

## Run

```bash
cd /home/mbohnenberger/.openclaw/workspace/.tmp/openclaw-spikes/road-connections-trainer
python3 -m http.server 8765
# open http://localhost:8765
```

No build step or package installation is required. The prototype uses plain HTML, CSS, and JavaScript. Progress and streak data stay in the browser via `localStorage`.

## Included
- Four modes: **Trace the road**, **What connects these?**, **Next turn**, and a label-toggleable **Mental map**.
- A deliberately simplified network covering Mass Ave, Route 2, Route 16 / Mystic Valley Parkway / Alewife Brook Parkway, Route 60 / Pleasant Street, Broadway, Park Avenue, Lake Street, Summer Street, Alewife, and links toward Lexington, Belmont, Cambridge, Medford, and Somerville.
- 15 curated active-recall prompts (5 trace, 5 connection-chain, 5 next-turn), randomized into short rounds.
- Local progress: points, streak, and answered-question count.
- Responsive, keyboard-usable UI with visible labels, focusable controls, semantic headings, reduced-motion support, and high-contrast accommodation.

## Data limits
This is hand-authored teaching geometry, not a routing graph. Road positions, curves, junctions, and route chains are approximate and intentionally simplified. Some roads continue far beyond the displayed segments; Route 16 changes local names; actual turn restrictions, ramps, one-way streets, traffic, construction, bike suitability, and travel times are absent. Do **not** use this prototype for live navigation or safety decisions. A production version should validate every edge against authoritative GIS/OSM data and local review.

## Verdict: VALIDATED

**Question:** Can a static curated graph make road relationships around Arlington learnable through short active-recall exercises?

**Evidence:** The dependency-free prototype implements a shared visual graph across four distinct learning modes, seeds 15 useful prompts, persists progress, and runs from a basic static server.

**What worked:** One small graph supports shape recognition, road-chain ordering, directional junction decisions, and low-pressure study. The no-build architecture is sufficient for a polished mobile prototype.

**What failed or surprised us:** Hand-curated geographic simplification gets ambiguous quickly. The prototype can teach an orientation model but cannot safely represent exact driving routes.

**Recommendation:** Proceed with user testing of the learning loop. If retention feels promising, replace the approximate graph with reviewed OSM/GIS-derived topology and add spaced repetition before building production navigation features.
