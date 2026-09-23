# Prime IT Solutions website

A dark-mode, 3D animated, scroll-driven website. Pixels sampled from the Prime IT Solutions logo
morph into a different shape in each section (logo, layers, barcode, </>, knot, logo)
while a pixel-aurora background moves behind everything. No JavaScript libraries are used:
the animation is plain WebGL.

## Files

```
index.html            page content (all text is here)
css/style.css         colours (dark palette), fonts, layout
js/main.js            English/Sinhala switch, menu, POS demo, form, scroll effects
js/swarm.js           the background + pixel-swarm animation (WebGL)
js/logo-points.js     the logo mark converted into pixel coordinates
assets/               logo-mark.png (header), logo-full.png (footer)
```

## Open it

Double-click `index.html`. Only the Google Fonts need internet.

## Dark mode only

The site is always dark (there is no light theme and no toggle button). The palette is the
`:root` block at the top of `css/style.css`:

- `--gl-*` colours drive the 3D pixels, `--bg` / `--bg-bot` drive the animated background,
  `--btn-grad` / `--h1-grad` drive buttons and the headline gradient.
- The per-section aurora colours are the `FX` list in `js/swarm.js`.

## The logo animation (js/swarm.js)

- **Intro**: pixels spiral in from the dark, glowing white-hot with motion trails, lock into the
  logo, then a shockwave + light sweep goes out.
- **Spring physics**: every pixel is on a spring, so it overshoots and settles instead of sliding.
- **Cursor**: pixels swirl around the pointer, lift toward you and leave a glowing wake.
- **Click / tap anywhere**: a shockwave ring blasts through the pixels and lights up the background.
- **Energy pulse**: every 6-10 seconds a ring rolls out of the logo by itself.
- **Network**: glowing links join nearby pixels, with data packets running along them.
  Links stretch and fade while the shape morphs.
- **Glitch**: now and then a slice of the logo glitches sideways.
- **Scroll drag**: pixels lag behind when you scroll fast, then snap back.
- **Header logo**: soft pulse ring + shine sweep (CSS, `.logo-chip`).
- Respects `prefers-reduced-motion` (no waves, trails, physics or auto events).
- Quality governor: on a slow GPU it first lowers resolution, then turns off trails, then the network.

Tuning knobs in `js/swarm.js`: `N` (pixel count), `NODE_STRIDE` (network density; higher = fewer links),
`W_CLICK` / `W_PULSE` / `W_BOOT` (shockwave strength: `push`, `speed`, `life`), `INTRO_MS` (intro length),
`lineAmt` per shape (`finish(..., {line: 0.5})`).

## Design v3 "Aurora" (colours and style)

- **Palette**: deep night-indigo background with a cyan -> electric blue -> violet signature gradient
  (`--grad`, `--grad-btn`, `--grad-text` at the top of `css/style.css`). Each card gets one accent hue
  via a class: `c-cyan`, `c-blue`, `c-violet`, `c-pink`, `c-mint`, `c-amber`, `c-indigo`.
- **Fonts**: Sora (headings), Plus Jakarta Sans (text), Michroma (small tech labels), Noto Sans Sinhala.
- **Headings** have a highlighted gradient phrase (`<em>`); Sinhala versions are in `SI_HTML` in `js/main.js`.
- **Effects**: coloured light blobs per section, film grain, a soft light that follows the mouse,
  3D tilt on cards, numbered section labels, active menu highlight, two-row outlined marquee,
  colourful call-to-action band with floating orbs, big "PRIME IT" wordmark in the footer.
- The WebGL aurora colours per section are the `FX` list in `js/swarm.js`.

## What's new in the previous version

- **Hero**: bigger headline with a typing word (websites / POS systems / ...), a "taking on new projects" badge,
  three trust ticks (free quote, Sinhala & English, support after launch) and floating live-style cards.
  The typed words are the `WORDS` list in `js/main.js` (English and Sinhala).
- **Why Prime IT**: six trust cards, with an animated "Your quote" card.
- **Services**: now a grid of cards with icons, plus a "Not sure what you need?" card.
- **Sample work**: tabs with a sample restaurant website (desktop + phone), a business dashboard and a
  student library system. These are labelled "Sample design". When you have real client work, replace them
  with screenshots of real projects - that is the strongest trust signal you can add.
- **Call-to-action band** before the contact form, a **floating WhatsApp button**, and a footer with columns.
- Every new line of text has a Sinhala version in the `SI` list in `js/main.js`.

## Things you will want to edit

- **Phone / email / Facebook / WhatsApp**: search for `94765316063`,
  `primeitsolutionsplc@gmail.com` and `facebook.com` in `index.html` and `js/main.js`.
- **Text**: edit it in `index.html`. Sinhala versions are in the `SI` list at the top of
  `js/main.js` (same `data-i18n` key).
- **POS demo items and prices**: the `ITEMS` list in `js/main.js`.
- **Number of pixels** (lower if a phone feels slow): `N = 1200` in `js/swarm.js`.
  The page also lowers its own quality automatically on slow GPUs.
- **New logo**: replace the PNGs in `assets/` and re-sample the mark into `js/logo-points.js`.

## Put it online (free)

1. Drag the whole folder onto https://app.netlify.com/drop (or use Vercel / GitHub Pages).
2. Connect your own domain in the hosting dashboard.
