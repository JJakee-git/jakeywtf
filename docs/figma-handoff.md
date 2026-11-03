# Supplied Figma export

The user supplied a `Home` React/TSX component, a Tailwind configuration, and global CSS. The verbatim component and configuration are retained in the ignored `original-assets/figma-export/` source archive. The original color values are used in `src/design-tokens.css`.

This export uses an absolute 1728 × 4467 layout. Its Experience section precedes the older three-row Projects section. The user has explicitly identified that Projects section as outdated. Framer remains the reference for the current section ordering, responsive spacing, gold frame, and gallery behavior. The component is a reference, not a replacement specification for the current site.

The live Figma link returned HTTP 403. The user subsequently supplied `original-assets/figma-export/PORTFOLIO WEBSITE.fig`. Its archive was extracted locally: 153 embedded image files and a readable Kiwi document with 1,613 layers. The local design source is now available; no Figma login or hosted access is needed for inspection. The original `.fig` was left unchanged.

`scripts/extract-figma-assets.ps1` extracts and inventories the embedded images and produces private contact sheets. `scripts/inspect-figma.mjs` decodes the document using the file's own embedded schema. Its optional utility dependency is installed under `.local/figma-tools/` rather than in the website's dependencies. The decoded document stays inside the ignored source archive. A compact design map is in `figma-design-map.json`.

The original My Work canvas is layer `114:717`, inside the user's linked frame `27:638`. It measures 5697 × 5201. `scripts/import-figma-gallery.mjs` generates `src/content/gallery-scene.json` and copies the 24 referenced original images to the public gallery asset folder. `src/gallery-template.mjs` renders its original positions, dimensions, labels, clipping, opacity, and shadows within the newer Framer gold frame. Only the three requested project groups link to detail pages; the other original artwork remains part of the gallery scene.

Image imports not included with the pasted code:

- `194-1941681-basquiat-crown-png-jean-michel-basquiat-crown-png-1.png`
- `assets3-3.png`
- `ellipse-1.png`
- `group-1.png`
- `image.png`
- `image.svg`
- `line-1.png`
- `rectangle-1.svg`
- `rectangle-4.svg`
- `rectangle-5.png`
- `rectangle-5-2.png`
- `rectangle-5-3.png`
- `rectangle-6.png`
- `rectangle-6-2.png`
- `vector.svg`

The JSX also refers to `/rectangle-8.svg` and `/logowhite-01-1.png` in CSS background URLs.

The primary original-artwork directory is `D:\00 Chapman Work\GD 402 - UX2\P3_Portfolio\Works`. Its image dimensions and filenames are inventoried in `portfolio-assets.json`. That folder includes complete framed previews (`frame2.png`, `frame3.png`), the Spierer University mascot and catalog, labels, and gallery decorations. Website copies of those originals are used directly where available.
