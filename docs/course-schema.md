# Roadwise course manifest schema v1

Roadwise manifests are inert JSON-compatible data. `core.js` exports `validateCourse()` and `parseCourseJSON()`; imports must pass both JSON parsing and schema validation before storage. The UI inserts user text with `textContent`, never as executable markup.

## Top-level shape

```json
{
  "schemaVersion": 1,
  "id": "place-slug",
  "slug": "place-slug",
  "title": "Roadwise Place",
  "region": "Place, Region, Country",
  "status": "draft",
  "center": { "lat": 42.0, "lon": -71.0 },
  "bounds": { "south": 41.9, "west": -71.1, "north": 42.1, "east": -70.9 },
  "attribution": { "text": "Source description", "url": "https://…" },
  "description": "Course summary",
  "pathTitle": "Place starter path",
  "heroTitle": "Build your local mental map.",
  "concepts": {},
  "map": {
    "viewBox": [0, 0, 760, 450],
    "regionalRoads": {},
    "landmarks": {},
    "tileProvider": "osm-standard",
    "featureProvenance": {
      "text": "Features derived from OpenStreetMap contributors",
      "license": "ODbL 1.0",
      "url": "https://www.openstreetmap.org/copyright",
      "retrieved": "2026-11-04"
    },
    "backgroundPaths": [
      { "view": "local", "kind": "water", "opacity": 0.5, "d": "M…Z" }
    ]
  },
  "units": [],
  "generator": { "kind": "static-manual-draft", "version": 1, "reviewed": false }
}
```

Required identity fields are `schemaVersion`, safe `id`, `title`, and `region`. `center` uses WGS84 latitude/longitude. Ordered `bounds` are required. Attribution is mandatory; a URL is optional for manually entered data.

## Concepts and map geometry

`concepts` is an object keyed by safe IDs. Each concept has:

- `name`
- `type`: `road`, `landmark`, `store`, `gateway`, `destination`, or `connection`
- optional `description`, `icon`, and `view` (`local` or `regional`)
- optional SVG study geometry: a road `d` path and `[x,y]` label, or landmark `[x,y]` point
- optional landmark callout metadata: `labelOffset: [dx,dy]` and `labelAlign: "left" | "center" | "right"`
- optional geospatial road `geometry`: GeoJSON `LineString` / `MultiLineString`, or equivalent `[lon,lat]` coordinate arrays
- optional anchor `location: { "lat": 42.0, "lon": -71.0 }`

SVG geometry is intentionally approximate study geometry, not a routable graph. Geospatial road geometry is limited to line types, valid longitude/latitude pairs, and 5,000 coordinates per concept. Polygon, point, malformed, out-of-range, and oversized geometry is rejected. Production route generation should consume a separate normalized road graph and emit reviewed study geometry.

When selected concepts have geospatial features, the player uses locally vendored Leaflet and a replaceable tile-provider registry. The prototype provider ID `osm-standard` resolves to the exact URL `https://tile.openstreetmap.org/{z}/{x}/{y}.png` with visible `© OpenStreetMap contributors` attribution linked to the OSM copyright page. The player performs normal interactive tile loading only: no tile prefetch, bulk/offline download, cache bypass, runtime Overpass, or restrictive referrer policy. Production traffic should move to a suitable OSM-derived or commercial provider.

Arlington road and anchor features are a committed static extraction with OSM/ODbL provenance. Lesson selection highlights current-question features, allows learned roads as subtle context, excludes unrelated anchors, and fits to active anchors when present. Explore selects learned/next features. If Leaflet or tiles fail, or a custom course lacks geospatial detail, the existing SVG renderer remains the explicit fallback.

`map.backgroundPaths` is optional fallback-only decorative geography. Each entry is limited to inert SVG path data, a `local` or `regional` view, a `water` or `terrain` kind, and optional opacity from 0–1. The static custom-course generator deliberately emits no background paths; it must not infer or fabricate water. When fallback callout offsets are absent, the player estimates label width from text and uses a deterministic collision fallback that does not depend on browser text measurement.

Lesson maps derive their active roads and anchors from the current question’s `concepts`. Learned roads may remain as low-emphasis context, while unrelated learned landmarks are omitted. Explore maps continue to show learned and next-up concepts with the same collision-aware callouts.

## Units, lessons, and questions

A unit has `id`, `title`, optional `subtitle`/colors, and non-empty `lessons`. A lesson has safe `id`, `title`, optional `subtitle`, `icon`, `checkpoint`, `newConcepts`, and non-empty `questions`.

Supported question interactions are intentionally generic:

- `choice`: string `prompt`, at least two string `choices`, string `answer` present in choices, concept IDs, optional explanation (`why`) and map concept ID.
- `chain`: string `prompt`, choices, ordered string-array `answer` whose entries all occur in choices, concept IDs, optional explanation and map concept ID.

Route-practice questions unlock only when their owning lesson is complete in the active course. Unit IDs and lesson IDs must be unique, every lesson/question concept reference must resolve, choices must be unique, and chain answers cannot repeat an item because the current interaction allows each choice to be selected once.

## Generator metadata

`generator` is required and identifies provenance and review status. The static fallback records:

- generator kind/version/time
- selected place
- submitted roads and anchors
- explicit anchor-to-road associations
- `reviewed: false`
- a relationship policy saying routes use only anchors confirmed on the same road

The Arlington seed uses `kind: "seed"` and records commit `b2b1d9b` as its preserved source.

## Compatibility

Schema v1 is strict at import. A future incompatible manifest must use a new `schemaVersion` and an explicit migrator rather than silently changing v1 semantics.
