# Neon Swarm - original Thinklet spec

The prompt this panel was built from (Thinklet panel id `umnuuo9q`).

---

Neon Swarm: a fast, addictive arcade roguelite survival shooter you play right in the panel. Make it a polished, interactive game panel (scene.interactive = true), using canvas with no external libraries, at a smooth 60fps.

Concept: You pilot a small glowing ship in a dark neon arena. Waves of geometric enemies swarm in from all sides and keep getting bigger. Your ship fires automatically at the nearest enemy, so all you do is move and dodge. Survive as long as you can.

Core loop:
- Defeated enemies drop XP shards that get pulled toward you when you're close. Filling the XP bar pauses the game and shows 3 random upgrade cards to pick from. Upgrades include: more projectiles, fire rate, piercing shots, orbiting blades, chain lightning, homing missiles, a shockwave nova every few seconds, move speed, max HP, magnet range, and crit chance. Each upgrade stacks up to 5 levels. Certain pairs evolve into a super weapon when both are maxed (for example, orbiting blades plus nova becomes a "Saw Storm").
- Enemy types: chasers (triangles), tanks (big hexagons that split when killed), dashers (telegraph with a flash, then lunge), shooters (fire slow bullets), and swarmers (tiny and fast, in packs). Every 2 minutes a boss arrives with a health bar, attack patterns and a big reward chest.
- Difficulty ramps over time. A run should last about 5 to 15 minutes.

Look & feel (make it feel incredible):
- Deep space background with a subtle parallax starfield and a faint pulsing grid that warps around explosions.
- Everything glows with additive blending and bloom-like neon. Use colored trails behind the ship and projectiles.
- Lots of juice: hit flashes, enemy death particle bursts, screen shake scaled to impact, hit-stop on big kills, chromatic flash when you take damage, floating damage numbers, and a combo counter that builds as kills chain.
- Level-up cards slide in with a satisfying animation. Each rarity has its own glow (common, rare, epic).
- Boss intro has a warning banner and a slow zoom.
- Death: slow-motion explosion, then a stats screen (time survived, kills, level, best combo, build summary) and a big Play Again button.

Audio: synth sound effects for shots, hits, pickups, level-ups and explosions (Web Audio, generated with no files), plus a driving synthwave loop whose intensity rises with the danger. Include a mute toggle that stays set.

Controls: WASD or arrow keys to move, or click/tap and drag anywhere for a virtual joystick on touch. Esc or P pauses. Show a tiny controls hint on the start screen.

Meta progression: Earn "cores" each run and save them in cabinet.memory. On the start screen, offer a small permanent upgrade shop (starting HP, damage, speed, an extra reroll on upgrade cards) and 2 unlockable ships with different starting weapons. Also save your best time and top 5 runs.

UI: Show a slim HP bar, XP bar, timer and kill count at the top, kept minimal so the action stays readable. The start screen has an animated title, Play, Upgrades and Best Runs. The game should scale cleanly to the panel size and keep a crisp look on Retina screens.

Change requested 2026-10-11: its blooming too much when I stated playing there is some animation that is light bloom way too much please fix and make sure everyting is better designed
