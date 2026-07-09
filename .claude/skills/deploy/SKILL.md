---
name: deploy
description: Builds the Eleventy site, deploys it to Cloudflare Workers, then commits and pushes the source changes to GitHub. Use when the user wants to "deploy", "publish", "push live", "ship this", or otherwise update the live liliandart.ca site in one action.
---

# Deploy lilian-dart-site

This site is not git-connected to Cloudflare — pushing to GitHub does **not** deploy it.
Deploys only happen via `wrangler deploy`. Git and Cloudflare are two separate, unlinked steps, so both must run.

## Steps

1. **Check git state.** Run `git status`. If there are uncommitted changes the user wants included, stage and commit them (write a concise commit message describing the change; do not invent scope beyond what changed). If nothing is uncommitted, skip straight to build/deploy.
2. **Build.** Run `npx eleventy` to regenerate `_site/`.
3. **Confirm before going live.** Summarize what will be pushed/deployed (commit message + files changed) and ask the user to confirm before the next two steps, since they affect the shared GitHub repo and the live site.
4. **Deploy.** Run `npx wrangler deploy`.
5. **Push.** Run `git push`.
6. **Report.** State the commit pushed and confirm the deploy succeeded (wrangler prints the deployed Version ID/URL).

## Notes

- Order matters: build and deploy before push isn't required, but committing before deploying keeps the deployed `_site/` in sync with what's recorded in git history.
- If `git push` fails (e.g. remote has new commits), stop and surface the error rather than force-pushing.
- If the build or deploy step fails, stop immediately and do not push — never push source for a deploy that didn't succeed.
