---
name: dev-server
description: Starts the local Eleventy dev server (the website) and the Decap CMS proxy server (the admin/content-manager backend) together for local development and preview. Use when the user wants to "turn on the site", "start the dev server", "run the website locally", or open/edit the admin CMS locally.
---

# Run website + admin locally

This site needs two processes running at once for the admin CMS to work locally:

- `npm start` → `eleventy --serve`, serves the website at http://localhost:8080
- `npm run cms` → `decap-server`, the local git-gateway proxy the admin UI (`/admin`) needs because `src/admin/config.yml` has `local_backend: true`. Runs at http://localhost:8081.

The website works standalone without the CMS proxy, but `/admin` will fail to load content without it — always start both unless the user only asks for one.

## Steps

1. Check nothing is already bound to ports 8080/8081 (e.g. `lsof -i :8080 -i :8081`) so you don't collide with a server the user already has running. Note: `lsof` only shows your own processes — a root-owned or containerized service (e.g. another project's uvicorn app) can hold a port invisibly. Eleventy handles this by auto-incrementing to the next free port, so a taken port is not fatal.
2. Start both as background processes:
   - `npm start` (background)
   - `npm run cms` (background)
3. Confirm both came up cleanly (watch the first few lines of output — Eleventy prints "Server at http://localhost:XXXX/", decap-server prints "Decap CMS Proxy Server listening"). If either fails to start, report the error rather than retrying blindly.
4. Report the URLs to the user, using the actual port from Eleventy's output (usually 8080, but higher if 8080 was taken): website at http://localhost:XXXX/, admin at http://localhost:XXXX/admin/. The admin UI talks to the Decap proxy on 8081 directly, so it works regardless of which port the site landed on.

## Notes

- Both processes run until stopped — leave them running in the background rather than waiting on them.
- If the user asks to stop the servers, kill both background processes.
