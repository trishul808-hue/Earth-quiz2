
Earth Quiz PWA
==============

What you get:
- A Progressive Web App (PWA) with HTML/CSS/JS, manifest.json, and service worker.
- On first run the app attempts to fetch a comprehensive list of national capitals from Wikipedia (so you get 160+ questions).
- If offline or fetch fails, the app uses a bundled fallback list.
- Visual design: yellow background, black option boxes, shows ✅️ for correct and ❌️ for wrong.
- Replace `images/logo.png` with the earth image you provided (it should have a black background). Keep filename `logo.png`.

How to deploy on GitHub Pages / make an APK:
1. Create a new GitHub repository and push the files.
2. Enable GitHub Pages from the repository settings (serve from `main` branch / root).
3. Visit the site URL (e.g. https://yourusername.github.io/repo/).
4. To create an APK (wrapped WebView), you can use tools like:
   - Bubblewrap (by Google) to generate an Android TWA (Trusted Web Activity).
   - PWABuilder (https://www.pwabuilder.com) to generate Android packages.
   These are third-party tools and instructions are in their documentation.

Notes:
- The app fetches Wikipedia pages at runtime; if you want the quiz fully offline with 160+ questions baked in, let me know and I will embed a full dataset into the app files (this will make the JS file larger).
- I used Wikipedia as the source for capitals. You can verify or replace capitals as needed.

Sources:
- Wikipedia: "List of national capitals" and related pages.
