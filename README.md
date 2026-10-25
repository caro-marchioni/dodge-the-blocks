# Dodge the Blocks

A browser arcade game built while learning TypeScript, HTML Canvas, and CSS.

## Play

Select **Start**, enter a player name (or leave it blank for a random name), then select **Play**. Move with the arrow keys or A/D to dodge falling blocks. Each dodged block earns a point; difficulty increases every five points, up to level 10.

Use the pause and restart controls during play. After a collision, review your score and choose **Restart** or **Back Home**.

Best scores are stored per name in this browser using localStorage. They are not accounts and do not sync across devices.

## Run locally

Use Node.js 22.12 or newer in the Node 22 release line, and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Validate and build

```sh
npm run build
npm run preview
```

The build runs TypeScript checks and generates the static site in `dist/`. Preview serves that build locally. Dependencies and generated output are excluded from Git.

Manual smoke check: start with an entered and a random name, move, pause/resume, earn points, collide, restart, return home, and reload to check the saved best score.

## Project layout

- `index.html`: page entry point.
- `src/main.ts`: game state, input, rendering, and screens.
- `src/style.css`: page and control styling.
- `public/`: static assets.

## Hosting and recovery

Uploading this repository does not deploy the game. A static host can serve `dist/` after a successful build. If hosting under a subdirectory, configure Vite's base path for that destination before building.

For a broken release, rebuild and redeploy the last known working commit. Check browser console errors and the smoke checks above after deployment. Clearing browser site data removes locally saved scores.
