# Working on The Sunken Throne

- **Push to `main`.** When work is committed, push it straight to `main` as well as to any working branch the session was given (`git push origin HEAD:main`). If `main` has moved on, merge it in first, and never force-push `main`.
- Everything in the game lives in `index.html`; `README.md` describes every feature and is kept up to date with each change.
- The land comes from `map/painted-map.jpg` via `python3 map/build.py`. Places (`PLACES`), roads (`ROADS`) and rivers (`RIVERS`) are hand-written lists in `index.html`.
