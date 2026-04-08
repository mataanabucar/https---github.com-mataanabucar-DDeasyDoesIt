# Shopify Live Preview Session

## 2026-04-07
- Confirmed this repository is a Shopify theme root.
- Confirmed Shopify CLI is installed locally.
- Preparing to launch `shopify theme dev` for store `91d6kq-x1.myshopify.com` using the liquid live preview workflow.
- Launched `shopify theme dev` in the background with `-NoDelete`.
- Local preview URL: `http://127.0.0.1:9393`
- Remote preview URL: `https://91d6kq-x1.myshopify.com/?preview_theme_id=149104558215`
- Theme editor URL: `https://91d6kq-x1.myshopify.com/admin/themes/149104558215/editor?hr=9393`
- Stopped the preview process tree for port `9393` and confirmed the local listener is closed.
- Reproduced TypeScript diagnostics affecting `playwright.config.ts`; the file itself parsed correctly in Playwright, but the repo had no `tsconfig.json`, so Node globals and modern libs were missing from editor type checking.
- Added `tsconfig.json` for Playwright files with Node typings and `ESNext` libs so `process`, `Buffer`, and related type errors resolve cleanly in VS Code.
- Updated the user-level VS Code MCP config for Playwright to use browser-extension bridge mode (`--extension`) so the Chrome Playwright bridge can attach to an MCP client. Kept the token out of repo files.
- Rotated the Playwright bridge token in the user-level VS Code MCP config after the browser extension issued a new token.
- Launched `npx playwright open diamonddyes.com`; confirmed a fresh Chrome for Testing window opened with title `Coming Soon – Diamond Dyes`.
- Diagnosed the VS Code MCP bridge issue to the active profile config file: VS Code was using `C:\Users\mabuc\AppData\Roaming\Code\User\profiles\-baf6ea5\mcp.json`, which still had an outdated token, used the legacy `mcpServers` key, and omitted `-y` for `npx`.
- Updated the active profile `mcp.json` to the current VS Code schema (`servers` + `inputs`), added `type: stdio`, added `-y` to the `npx` args, and set the latest Playwright extension token.
- Rotated the Playwright bridge token again in both the active VS Code profile MCP config and the user-level fallback MCP config after the extension issued a newer token.
- Verified an existing `shopify theme dev` process was already running for this repository and store `91d6kq-x1.myshopify.com` on port `9393` with `--nodelete`.
- Confirmed the local preview at `http://127.0.0.1:9393` responds successfully (`HTTP 200`), so the live Liquid preview is active and reusable.
- Launched `npx playwright open http://127.0.0.1:9393` from the theme repo.
- Confirmed Playwright started a Chromium browser process for the local preview URL.
- Audited the coming-soon homepage against multiple viewport sizes and found short desktop heights, tablet landscape, and mobile landscape were overflowing the viewport and pushing the utility panel below the fold.
- Updated `assets/customstyle.css` so the coming-soon homepage renders as a single viewport-contained hero frame, hides non-hero chrome on the homepage, and scales the logo plus utility panel based on viewport height.
- Re-ran the viewport audit after the CSS update and confirmed no horizontal or vertical overflow, with the logo, `View gallery`, `Coming Spring 2026`, and `Contact us` all remaining fully in frame across the tested viewports.
