# Production course generation API contract

GitHub Pages does not provide this endpoint. `core.js` nevertheless defines `courseGenerator.endpoint = "/api/courses/generate"` and a production adapter so a backend can replace the static fallback without changing the setup UI.

## Request

`POST /api/courses/generate`

```http
Content-Type: application/json
```

```json
{
  "schemaVersion": 1,
  "place": {
    "name": "Arlington",
    "displayName": "Arlington, Massachusetts, USA",
    "lat": 42.4154,
    "lon": -71.1565,
    "providerId": "optional-provider-stable-id"
  },
  "options": {
    "title": "Roadwise Arlington",
    "roads": [{ "id": "mass-ave", "name": "Mass Ave", "direction": "east–west" }],
    "anchors": [{ "id": "center", "name": "Arlington Center", "type": "landmark", "roadId": "mass-ave", "direction": "central" }],
    "locale": "en-US",
    "transportModes": ["driving"],
    "sourceRevision": "optional optimistic-concurrency token"
  }
}
```

Required input limits should match or be tighter than the static client: 3–8 roads, 3–12 anchors, bounded text, valid coordinates, and safe IDs. Authentication, quotas, CSRF/CORS policy, request-size limits, and abuse controls belong on the production service.

## Success

`200 OK`

```json
{
  "requestId": "req_…",
  "course": { "schemaVersion": 1, "id": "…", "units": [] },
  "warnings": [
    { "code": "LOW_CONFIDENCE_POI", "message": "Review the suggested anchor.", "path": "concepts.anchor-id" }
  ],
  "provenance": {
    "geocoder": "provider/version",
    "mapExtract": "snapshot/revision",
    "generator": "service/version",
    "generatedAt": "2026-11-04T00:00:00Z"
  }
}
```

The returned `course` must pass the same v1 validator. Generated courses remain `draft` until a QA/review step promotes them.

## Errors

All errors use a stable envelope:

```json
{
  "requestId": "req_…",
  "error": {
    "code": "INVALID_INPUT",
    "message": "Human-readable safe summary",
    "retryable": false,
    "fields": [{ "path": "options.roads", "message": "Add 3–8 roads." }]
  }
}
```

Recommended statuses/codes:

- `400 INVALID_INPUT` — schema or coordinate failure
- `404 PLACE_NOT_FOUND`
- `409 SOURCE_REVISION_CONFLICT`
- `422 INSUFFICIENT_CONFIRMED_RELATIONSHIPS`
- `429 RATE_LIMITED` — include `Retry-After`
- `502 PROVIDER_UNAVAILABLE` — usually retryable
- `503 GENERATION_UNAVAILABLE` — retryable
- `500 GENERATION_FAILED` — no provider internals or secrets in the response

Idempotency via an `Idempotency-Key` header is recommended. Log provenance and QA decisions server-side, not private user content beyond the documented retention policy.

## Production boundary

The server should geocode through a compliant provider, cache a bounded OSM extract or use a commercial dataset, construct a route graph, rank POIs, generate lessons, and run automated plus human QA. Public Nominatim/Overpass endpoints are not the production generation architecture.
