# Framer build scripts

`index.html` stays the source of truth for the landing page. These scripts turn it
into the Framer code components used by the live site, so the two never drift.

| Script | Produces | Notes |
| --- | --- | --- |
| `extract_assets.py` | `assets/*.jpg|png|svg` | Pulls every base64 image out of `index.html` so they can be uploaded to Framer's CDN and cached by the browser. |
| `build_component.py` | `AlthioLanding.tsx` | The whole page as one component. Scopes every CSS selector to `#althio-root`, drops `overflow-x: hidden` (it breaks `position: sticky`), swaps base64 for CDN URLs, and strips the nav and footer. |
| `build_chrome.py` | `AlthioNav.tsx`, `AlthioFooter.tsx` | The shared nav and footer, extracted from the same CSS so every page matches the homepage. |
| `AlthioNotFound.tsx` | — | Hand-written 404 screen (day sky, white numeral). Not generated. |

## Regenerating after editing index.html

```bash
python3 framer/extract_assets.py     # only when images change
python3 framer/build_component.py
python3 framer/build_chrome.py
```

Then push the generated `.tsx` files into Framer with the agent CLI
(`framer.getCodeFiles()` → `setFileContent`) and publish.

## Two traps worth remembering

1. **CSS comments break selector extraction.** The brace scanner treats a comment
   above a rule as part of that rule's selector. `build_chrome.py` strips comments
   first; without that, `nav { position: fixed }` silently disappears.
2. **Look up code files by id, not name.** `framer.getCodeFile("Name.tsx")` can
   return null for a file that exists, and creating again produces `Name_1.tsx`
   duplicates. `getCodeFiles()` plus an id match is reliable.
