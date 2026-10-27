# HeartFrame Studio

A free, responsive scrapbook-style photocard editor built with plain HTML, CSS, and JavaScript. It works on GitHub Pages and keeps photos in the browser unless the user downloads or saves a project file.

## Files
- `index.html` — editor structure and controls
- `styles.css` — scrapbook styling and responsive layout
- `script.js` — photo editor, sticker controls, history, export, and print sheet
- `README.md` — this guide

## Publish on GitHub Pages
1. Download and extract this ZIP.
2. Open your GitHub repository.
3. Choose **Add file → Upload files**.
4. Upload the four files above into the repository root (do not upload the ZIP itself).
5. Commit the files to your `main` branch.
6. Open **Settings → Pages**.
7. Under Build and deployment, choose **Deploy from a branch**, then `main` and `/(root)`.
8. Save and wait for GitHub Pages to publish the site.

If you already have a HeartFrame repository, upload these updated files into the same repository and confirm the replacements before committing. Keep a copy of your old files so you can roll back if needed.

## Current features
- Photo upload for JPG, PNG, and WebP (up to 10 MB)
- Rosy, Dreamy, Vintage, Mono, Glow, and Original filters
- Brightness, contrast, saturation, photo zoom, and drag-to-position crop
- Caption, note, fan message, and optional bias profile fields
- Paper colors, paper texture styles, washi tape, and themed sticker packs
- Add, select, drag, rotate, resize, layer, and delete stickers
- Holographic overlay, four card formats, and original concept themes
- Undo/redo history
- Save/load a project JSON file in the browser
- PNG export and a print-sheet view with cut guides

## Notes and limitations
- This version has no account system or cloud sync. Saved project JSON files are downloaded to your device; they are not uploaded to a server.
- Print layout is a browser print view. Check print preview and use Actual Size / 100% for accurate sizing; printer margins differ.
- Emoji appearance depends on the device and browser fonts. Google Fonts are optional; fallback fonts are used if unavailable.
- GitHub Pages hosts static files for free; no backend is required for the editor features above.
- Use photos and artwork you have permission to use. Themes are original mood concepts rather than official album artwork.
