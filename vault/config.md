---
type: dashboard_config
music:
  tracks:
    - title: "Fury Bay Panorama"
      src: "/music/01 - Fury Bay Panorama.mp3"
    - title: "Pride of Crato"
      src: "/music/06 - Pride of Crato.mp3"
    - title: "Stoutmarch Panorama"
      src: "/music/57 - Stoutmarch Panorama.mp3"
---

# Dashboard config

Edit this file to control runtime settings of the dashboard.

## Background music

Add tracks under `music.tracks`. The player in the sidebar will cycle through
them. To use a local file:

1. Drop an audio file into `dashboard/public/music/your-track.mp3`.
2. Add `- title: "Your track"\n  src: "/music/your-track.mp3"` here.

To use a remote URL, just paste the URL as `src`.
