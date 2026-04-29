# Weekly Slides

One Marp deck per week. Reviewed every Monday with the team.

> **All commands must be run from the repo root** (`whynot/`), not from inside `slides/`.

## Create a new week

```bash
bash slides/new-week.sh
```

This copies `template.md` into `slides/YYYY-WNN.md` for the current ISO week.

## Fill it in

Open the generated file and replace every `_placeholder_` and `XX` value. Takes ~15 minutes if you do it right before the meeting.

## Render to HTML (shareable)

```bash
npx @marp-team/marp-cli slides/2026-W17.md -o slides/2026-W17.html
```

## Live preview while editing

```bash
npx @marp-team/marp-cli slides/2026-W17.md --preview
```

## Export to PDF

```bash
npx @marp-team/marp-cli slides/2026-W17.md --pdf -o slides/2026-W17.pdf
```

## Post-launch KPI swap

Once the app is live, update these two rows in your weekly deck:

| Pre-launch | Post-launch |
|------------|-------------|
| Launch Readiness % | GMV this week (€) |
| Seller Pipeline (funnel) | Active Sellers this week |
| Buyer Waitlist | New Buyers (first order) |
