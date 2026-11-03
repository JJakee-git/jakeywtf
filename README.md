# Jacob Spierer portfolio

Static portfolio rebuilt from the Framer reference and original design assets. No production framework or server dependencies. Node generates the HTML; native CSS and JavaScript handle the layout and draggable gallery. Playwright is used only for development checks.

## Local preview

```sh
npm install
npm run dev
```

Open http://127.0.0.1:4173. The dev command builds once when started. After source edits, run `npm run build` and refresh the browser.

## Build and verify

```sh
npm run build
npm test
node scripts/check-browser.mjs
node scripts/check-design.mjs
```

The browser checks require the preview server to be running and Microsoft Edge installed. They cover every page at desktop and mobile sizes, asset errors, overflow, mouse dragging, reset, keyboard panning, project navigation, and menu behavior. The design checks verify shared responsive typography, menu alignment, portrait scaling, the extended line, weighted section scrolling, crown clearance, source animations, and continuous Contact scrolling with matching custom dropdowns.

## Scroll comparisons

The comparison pages are hidden and excluded from the build. Set `showScrollTests` to `true` in `src/content/site.json` and rebuild to restore **Menu → Test** and its four demos: Rubber band, Soft spring, Momentum, and Magnetic settle. The main site uses the selected Soft spring version: short gestures preview movement and return, while longer gestures advance with a soft bounce. Contact and project pages retain normal scrolling. Reduced motion uses native section snapping.

Text selection and native image/link dragging are disabled in the composition; form inputs keep normal text editing. Hovering or focusing a gallery frame tilts its matching nameplate. The red gallery boundary uses a padded artwork union, rounded with corner cutting and then roughened with deterministic offsets; it follows future artwork bounds automatically.

## Add a project

1. Put web-ready images in `public/assets/projects/`.
2. Add an entry in `src/content/projects.json` with a unique URL slug, title, subtitle, category, preview, hero, and images. Paths start with `assets/`. Set `collection` to `testprojects` to preview a page separately while deciding where to place its frame.
3. Omit `sceneNode` and `sceneNodes` for new artwork. Add a case study in `src/content/case-studies.json`, keyed by the same slug, when written/process material is available. It contains `context`, `hero`, `left`, optional `right`, `sections`, and `process`. Each artwork object has `path`, descriptive `alt`, `width`, `height`, and an optional `caption`. The existing entries are examples.
4. Run `npm run build`. A staged project appears in `/testprojects/` and has a detail page at `/testprojects/<slug>/`. It does not appear in the Home or Work gallery. To place it in Work later, choose its canvas `position` (`x`, `y`, `width`), remove `collection: "testprojects"`, and rebuild. Its route then becomes `/projects/<slug>/`. Projects without a case-study entry display their `hero` and `images` as an artwork gallery. The three original case studies retain their Figma artwork and interactions.

There are 25 project detail routes: 11 original projects under `/projects/` and 14 newly added projects under `/testprojects/`. All descriptions and assets are retained. The Work canvas contains only the original frame arrangement. The separate `/testprojects/` index links to the 14 new pages and stays out of the main menu. Existing frame sets and plaques share a route through the `sceneNodes` list. The additional case studies use `src/case-study-template.mjs`, with aligned two-column artwork and text panels, normal page scrolling, and full-width process strips. On smaller screens the panels stack and the complete description flows normally.

The gallery background and artwork share one movable canvas. The gold frame is a stationary overlay. The original 5697 × 5201 canvas and initial center are imported from the user's Figma file into `src/content/gallery-scene.json`. Existing projects connect to artwork groups with `sceneNode` IDs. A new project without a `sceneNode` is rendered at its `position` on that same canvas with a gold frame and tilting plaque. The canvas and jagged boundary expand automatically to contain new entries; the starting view stays the same. Visitors can drag or use arrow keys; Home returns to the starting view. Keyboard focus brings each project into view.

The gallery route is `/projects/`, labeled **Work** in the menu. Individual pages include a square Back button beside Menu that returns to their parent: the Work gallery for `/projects/<slug>/`, or the preview index for `/testprojects/<slug>/`. Its Arrow Left Alt icon is a locally hosted Google Material Symbols SVG (weight 400, grade 0); the license and source notice are in `public/assets/icons/`.

## Hosting

Upload the **contents of `dist/`** to a static host. The output includes `.nojekyll` for GitHub Pages. Relative URLs support either a domain root or a GitHub repository subpath. Do not upload `original-assets/`, your Chapman work folder, or `node_modules/`.

For a manual GitHub Pages deployment, place the built files in the publishing branch and select that branch in the repository's Pages settings. Source code lives in the private `JJakee-git/jakeywtf` repository. Pushing source does not enable public hosting automatically.

## Content still needed

- Set `email` (opens a visitor's email app) or `formEndpoint` (a compatible form delivery service) in `src/content/site.json`. Submission remains disabled until one is provided. A configured endpoint must allow cross-origin form submissions and return a successful HTTP response only after accepting the request.
- Provide your current résumé PDF and set `resume` to its asset path.
- Review the rebuilt layouts and motion against the supplied Figma and Framer references. The three original project pages now use imported Figma layout and prototype data.

## Source and assets

- `src/site.css`, `src/refinements.css`, `src/display-refinements.css`, `src/gallery-refinements.css`, and `src/content-refinements.css`: shared styles followed by display, gallery, and content refinements.
- `src/design-tokens.css`: the supplied palette; only Brutalisme and Helvetica Neue regular/bold webfonts are loaded.
- `scripts/page-templates.mjs` and `scripts/contact-template.mjs`: shared page structure and the continuously scrolling contact form.
- `src/reference-template.mjs`: renders source Figma project layouts and interactive component states.
- `src/case-study-template.mjs` and `src/content/case-studies.json`: additional case studies grounded in the project briefs and process decks.
- `src/scroll-controller.js`: reversible wheel/touch pulls and four scroll models; project pages and Contact use normal scrolling. Taller biography content can scroll within its section.
- `src/gallery-outline.mjs`: the rounded, roughened artwork contour used by the gallery renderer.
- `scripts/scroll-tests-template.mjs` and `src/interaction-refinements.css`: scroll comparison routes and selection/drag behavior.
- `src/viewport-layout.js` and `src/menu-motion.js`: browser-window layout sizing and the menu's sliding motion.
- `src/app.js`: menu, pointer/keyboard gallery controls, and configurable contact delivery.
- `src/content/`: site information, projects, and verified existing copy.
- `scripts/build.mjs`: static page generator.
- `public/assets/`: website asset copies organized by purpose.
- `docs/reference-assets.json`: source URLs of assets imported from the user's Framer reference.
- `docs/portfolio-assets.json`: image inventory of the user's primary portfolio asset folder, including original paths and dimensions.
- `docs/project-content-audit.md`: found material and remaining/optional assets for all 25 projects.
- `docs/project-asset-sources.json`: exact source files, PDF pages/crops, and dimensions for newly imported artwork.
- `original-assets/`: retained source archive, excluded from Git and deployment.

Original files in `D:\00 Chapman Work` were only read. Website copies can be optimized with `scripts/optimize-assets.ps1`; that script does not modify original artwork.

The local Framer capture in Downloads is inventoried in `docs/framer-export-audit.md`. It contains Home, About and Contact, while Figma supplies the My Work scene and original project pages. The capture's editor, analytics and account-response artifacts are excluded from the site's public output.
