# Lucra Image Search

## How to run app
1. Open two separate terminals from repo root.
2. Run `npm run pre-dev` in any terminal. This will delete the `.vite` dependencies cache in node_modules (causes blank white screen issue). This is needed when running in IP mode to bypass Imgur's `localhost` restrictions.
3. In one terminal, run `npm run dev:data`. This will start the data app.
4. In another terminal, run `npm run dev:host`. This will start the host app. To access the UI, open the `Network` route. This should format as `http://<your machine's IP>:5554/`.

## Future Ideas

### Bonus points
* Improved caching: add Redis cache or DB cache layer with TTL index. Currently using built-in React `cache` functionality, limited to in-memory storage so cache wouldn't persist when app goes down.
* Testing: add unit tests for all components.
* Fullscreen view: add overlay on top of UI that opens on a button click. Zoom/expand button would live on corner of image gallery. Cache UI state in browser local storage and retrieve on refresh. Local storage cache would extend to query, album results, and gallery state (open/closed, index, etc.) so refresh persists the entire UI state. Could expand this idea into session management where UI state is stored in Redis cache or some form of DB.

### UX
1. Add pagination and scrolling. POC was limited to 6 results for simplicity.
2. Shuffle button that randomizes results based on your query. Applicable for limited number of results, not so much when showing all results.
3. Filtering by tags.

### Misc
* Better local build mechanism. Current build requires deleting modules and running off host IP since Imgur kept blocking API calls from `localhost`.