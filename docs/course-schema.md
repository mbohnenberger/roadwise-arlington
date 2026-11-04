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
  "map": { "viewBox": [0, 0, 760, 500], "regionalRoads": {}, "landmarks": {} },
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

Geometry is intentionally approximate study geometry, not a routable graph. Production route generation should consume a separate normalized road graph and emit reviewed study geometry.

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
