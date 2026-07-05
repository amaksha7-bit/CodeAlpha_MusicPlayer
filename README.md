# 🎵 Simple Music Player

A lightweight, no-framework music player built with vanilla **HTML**, **CSS**, and **JavaScript**. Load your own mp3 files straight from your computer — song title, artist, and cover art are read automatically from each file's embedded metadata, and a real-time audio visualizer reacts to whatever's playing.

![No frameworks](https://img.shields.io/badge/frameworks-none-blue) ![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **Play / pause / next / previous** playback controls
- **Progress bar** — scrub to any point in the song, updates live as it plays
- **Volume control** with a draggable slider
- **Playlist** — click any track to jump straight to it, active track highlighted
- **Autoplay** — automatically advances to the next song when one finishes
- **Live audio visualizer** — a full-screen background canvas analyzes the currently playing song in real time (via the Web Audio API) and renders a reactive equalizer effect, plus a subtle "beat pulse" on the album cover synced to the bass
- **Keyboard shortcuts**:

  | Key | Action |
  |---|---|
  | `Space` | Play / Pause |
  | `→` | Next song |
  | `←` | Previous song |

- **Dynamic song loading** — click "Load Songs," select any mp3 files from your computer, and the player reads each file's:
  - Title (from ID3 tag, or filename if untagged)
  - Artist (from ID3 tag, or "Unknown Artist" if untagged)
  - Cover art (extracted directly from the file's embedded artwork)
- **Responsive design** — adapts down to small screens (~320px wide)
- **Dark theme** with a customizable accent palette

---

## 🛠️ Tech Stack

- **HTML5** — structure, semantic markup, `<audio>` and `<canvas>` elements
- **CSS3** — custom range-input styling, flexbox layout, media queries
- **JavaScript (ES6+)** — no frameworks, no build tools
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** — real-time frequency analysis for the background visualizer
- **[jsmediatags](https://github.com/aadsm/JavaScript-ID3-Reader)** (via CDN) — reads ID3 tags from audio files in the browser
- **[Font Awesome](https://fontawesome.com/)** (via CDN) — control icons

---

## 📁 Project Structure

```
music-player/
├── index.html      # Page structure and markup
├── styles.css       # Styling, dark theme, slider design, visualizer canvas positioning
└── script.js        # Playback logic, tag reading, playlist rendering, audio visualizer
```

---

## 🚀 Getting Started

No build step, no dependencies to install — this runs directly in a browser.

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/music-player.git
   cd music-player
   ```

2. **Open `index.html`** in your browser (double-click it, or right-click → Open With → your browser).

3. **Load your songs**
   - Click the **"Load Songs"** button
   - Select one or more mp3 files from your computer
   - Titles, artists, and cover art populate automatically from each file's tags

4. **Hit play** — the background visualizer and cover-art pulse activate automatically on first playback (browsers require a user gesture like a click before audio processing can start).

> 💡 Tip: for the smoothest experience with correct song titles/artists/covers, use mp3 files that already have embedded ID3 metadata (most songs downloaded from legitimate music services or ripped with tagging software will have this).

---

## 🎛️ How the Visualizer Works

The background canvas taps into the actual `<audio>` element's output using the **Web Audio API**:

1. An `AnalyserNode` reads real-time frequency data from whatever song is currently playing.
2. A `requestAnimationFrame` loop redraws mirrored equalizer-style bars every frame, colored to match the theme.
3. The album cover scales slightly larger in sync with the bass frequencies, giving it a subtle "breathing" effect.

This only works with **locally loaded files** — the analyser needs same-origin audio data, which local file blobs satisfy automatically (no CORS issues).

---

## ⚠️ Known Limitations

- **Browser security requires a manual file selection.** A webpage cannot silently scan a folder on your computer — you'll need to click "Load Songs" and select files each session. This is a browser security boundary, not a bug.
- **No persistence between page reloads.** Since files are loaded via the browser's File API (not stored on a server), refreshing the page clears the playlist — you'll need to reload your files again.
- **Untagged files fall back to filename.** If an mp3 has no embedded title/artist/cover art, the player uses the filename as the title and shows a placeholder icon instead of cover art.
- **Visualizer requires a user gesture to start**, per browser autoplay policy — it activates the first time you click play, not on page load.
- **Requires internet access on first load** for the Font Awesome and jsmediatags CDN scripts (both cached by the browser afterward).

---

## 🗺️ Possible Future Improvements

- [ ] Drag-and-drop file support in addition to the file picker
- [ ] Persist the last-loaded playlist using IndexedDB
- [ ] Shuffle and repeat modes
- [ ] Selectable visualizer styles (bars, waveform, radial)
- [ ] Local storage for volume/theme preference

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙌 Acknowledgements

- [jsmediatags](https://github.com/aadsm/JavaScript-ID3-Reader) for in-browser ID3 tag parsing
