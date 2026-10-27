# HeartFrame Studio 💗

A scrapbook-style photocard maker built with plain HTML, CSS, and JavaScript. It is designed to run on GitHub Pages for free.

## Files
- `index.html` — the page and editor controls
- `styles.css` — layout, colors, and responsive design
- `script.js` — photo upload, filters, stickers, and PNG export

## Publish on GitHub Pages
1. Create a public repository on GitHub (for example, `heartframe-studio`).
2. Upload all three files to the **root** of the repository. Keep the filenames exactly as shown.
3. Open the repository's **Settings**.
4. Select **Pages** in the sidebar.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select branch **main** and folder **/(root)**, then click **Save**.
7. Wait a minute or two. GitHub will show the published website link in Settings → Pages.

## How to use
1. Click **Choose a photo** and pick a JPG, PNG, or WebP image (up to 10 MB).
2. Tap a filter and adjust brightness, contrast, saturation, or zoom.
3. Change the caption and note, choose a paper color, and add stickers.
4. Click **Download PNG** to save the photocard.

## Privacy
The editor works in your browser. The selected photo is not sent to a server by this code. Google Fonts are loaded from an external service for the decorative typography; the app still works if those fonts cannot load.

## Notes
- The download is a high-resolution PNG.
- The first version includes a starter set of scrapbook decorations and filters; it is not yet a full drag-to-move layer editor.
