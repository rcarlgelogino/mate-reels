# Mate reels (automated)

Builds Spanish (rioplatense) Instagram reels about mate: 3D/2D scenes rendered with Three.js in headless Chrome, voice by Gemini TTS (voice Charon, Edge TTS fallback), captions from local Whisper word timings, music and SFX mixed with ffmpeg.

## Daily automation (GitHub Actions)
- `.github/workflows/daily-reels.yml` runs every day at 08:30 UTC (after the Gemini quota reset) and builds the next 3 specs from `queue/`.
- Finished videos + captions are published as a **GitHub release** ("Reels YYYY-MM-DD"); built specs move to `done/<date>/`.
- Manual run: Actions → daily-reels → *Run workflow* (option `test` builds `samples/test_reel.json` only).

## Layers (content and look are separate)
- **Scripts** in `queue/`: what the reel says and shows, style-neutral (`docs/SCRIPT.md`).
- **Watch-time rules**: `docs/WATCHTIME.md`, apply to every script.
- **Styles** in `styles/`: `<name>.json` look + `<name>.js` translator. The active one is set in `styles/active.json` (one word). Current: `flat2d`.
- Local test: `node scripts/make.js samples/script_cebador.json --build`.

## Setup
- Repository secret `GEMINI_API_KEY` (Settings → Secrets and variables → Actions). Free tier: 10 requests/day, 1 request per reel. Never enable billing.
- Add reel scripts to `queue/` (format: `docs/SCRIPT.md`), named `0001_topic.json`, `0002_...` so they build in order. Raw render specs (`SPEC.md`) also work.

## Local
`npm ci --prefix tools` then `node pipeline/build.js <spec.json>` (key in `.env` as `GEMINI_API_KEY=...`).
