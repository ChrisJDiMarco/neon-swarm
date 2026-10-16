# Neon Swarm

A fast arcade roguelite survival shooter, built as a Thinklet (Cabinet Next) panel. You pilot a small glowing ship in a dark neon arena while waves of geometric enemies swarm in from every side. The ship fires on its own; you dodge, dash and pick upgrades that evolve into stronger forms. Between runs you spend cores on ships (Spark, Warden, Volt) and permanent upgrades, and a best-runs log records what killed you. It's drawn on canvas with no external libraries. The last saved build is "Day 8" (calmer bloom, color-crash fix, live best-time target).

Built with Claude: Thinklet's builder on claude-opus-5-5, 2026-10-10 (one more save on 2026-10-15).

## How to run

- **Inside Thinklet:** it's the "Neon Swarm" panel (id `umnuuo9q`, space "Fun").
- **Standalone:** open `index.html` in a browser, or serve the folder (`python3 -m http.server`) and open it. Tested headless on 2026-10-16: the title screen, ship picker and menus render without Thinklet. Without Thinklet, `window.cabinet` is missing, so progress isn't saved between sessions.
- Controls: WASD or drag to move, Space or double-tap to dash, P to pause.

## What's in here

| Path | What it is |
|------|-----------|
| `index.html`, `style.css`, `js/` | The game as it runs in the panel (`data.js`, `audio.js`, `game.js`, `render.js`, `ui.js`) |
| `actions.json` | Thinklet actions the panel exposes (add an upgrade, log a run, count runs) |
| `thinklet/spec-prompt.md` | The original spec prompt the panel was built from |
| `thinklet/panel.json` | The full panel entry from Thinklet's `Panels.json`: title, prompt, version log, build costs |
| `thinklet/memory.json` | Saved game state from Thinklet (cores, unlocked ships, best runs, lifetime stats) |
| `thinklet/poster.jpg` | The panel's poster thumbnail |
| `history/versions/*.json` | All 10 saved versions from Thinklet. Each one holds the full source of every file (`files`) plus the panel state at that point. File names are millisecond timestamps |

## Original location

`~/Library/Application Support/Cabinet Next/Panels/Panels/umnuuo9q` (versions in `.../Panels/Panels/versions/umnuuo9q`). Backed up on 2026-10-16.
