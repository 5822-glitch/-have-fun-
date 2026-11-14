# Oakfall — Math Royale

A browser-based 3D arena prototype. Explore the island, outlast 59 bot rivals,
solve math challenges to unlock 20 weapon skins, and use the hollow oak as a
walk-through hideout.

## Website

Once the GitHub Pages workflow finishes deploying, play at
[https://5822-glitch.github.io/-have-fun-/](https://5822-glitch.github.io/-have-fun-/).

## Run locally

Open `index.html` through a local web server (ES modules and the Three.js
import map require HTTP; opening the file directly may not work). For example:

```sh
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000). An internet
connection is required to load Three.js and the optional Google Fonts.

## Controls

- **W A S D** — move
- **Mouse** — look around; **click** — fire / resume pointer lock
- **1–5** — select a weapon; **R** — reload
- **E** — pick up a nearby weapon; **F** — toss the selected weapon
- **M** or **Math Challenge** — solve a problem and unlock the next weapon
- Walk through the opening at the large oak in the southeast corner to hide;
  walk back out to leave.

This prototype uses local AI opponents, not a networked multiplayer server.
Online multiplayer and a public hosted website require backend and hosting
services that are not configured in this repository.