---
type: dashboard_config
music:
  tracks:
    # Add tracks the dashboard will play in the background. Each entry needs:
    #   - title: optional display label
    #   - src:   absolute URL OR a path inside dashboard/public/ (e.g. /music/foo.mp3)
    #
    # Examples (uncomment to use, replace URLs):
    # - title: "Lo-fi study mix"
    #   src: "https://example.com/lofi.mp3"
    # - title: "Local track"
    #   src: "/music/track1.mp3"
---

# Dashboard config

Edit this file to control runtime settings of the dashboard.

## Background music

Add tracks under `music.tracks`. The player in the sidebar will cycle through
them. To use a local file:

1. Drop an audio file into `dashboard/public/music/your-track.mp3`.
2. Add `- title: "Your track"\n  src: "/music/your-track.mp3"` here.

To use a remote URL, just paste the URL as `src`.
