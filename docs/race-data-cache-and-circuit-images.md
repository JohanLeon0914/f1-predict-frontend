# Race data cache and circuit images

The race calendar is loaded through `getLocalF1DataServer()` in
`src/lib/local-f1-data-server.ts` and refreshed client-side through
`getLocalF1Data()` in `src/lib/f1-ranker-api.ts`. Both paths request fresh
data; the calendar payload is not persisted in a server or browser cache.

When the payload shape or circuit-image matching changes, bump both keys. This
keeps the fast initial load while forcing stale browser/server data to refresh.

Circuit images are sourced only from OpenF1 after strict matching against the
race year, date/name, and country where available. Do not fall back to local or
hand-drawn circuit outlines for real races: an approximate outline is worse
than no outline because it can show the wrong track for a race card.

If OpenF1 has not published a reliable `circuit_image` for a future race yet,
`CircuitSilhouette` renders an empty stable placeholder. The card layout stays
stable and the image appears automatically after the cached race payload is
refreshed once OpenF1 provides a trustworthy match.
