# Desktop design standards

These standards record the user's approved direction. Desktop is the priority. Mobile-specific design decisions will be made later; keep the existing mobile layout usable meanwhile.

## Typography

- Use Brutalisme and Helvetica Neue, regular and bold, as already established.
- Preserve the approved H1/H2 styles and existing text treatments. H3, body, and caption styles are not a newly specified formal system.
- Default line height and letter spacing are acceptable. Do not invent extra type specifications without a need.
- Single-line button labels fit their fixed control height and padding.

## Colors and links

| Token | Value |
| --- | --- |
| Primary | `#ba1112` |
| Primary 2 | `#f60c09` |
| White 80 | `#b0b0b0` |
| White 95 | `#f2f2f2` |
| Black 90 | `#1a1a1a` |
| Black 95 | `#0d0d0d` |
| Black 100 | `#000000` |

- Ordinary text links use Primary, then Primary 2 once visited. Use the `text-link` class for new text links.
- Navigation items and Back to Top follow the text-link colors.
- Menu-item hover text is White 95; the black Menu button itself retains White 80 hover text.
- Artwork frames, gold nameplates, the logo, and image links keep their artwork colors.
- The approved display-heading and Contact Me marble hover treatments remain in place.

## Buttons

- Desktop action buttons are 64 px tall, including padding and any border.
- Inner padding is 8 px. Wide buttons are approximately 240 px; the Back control is square.
- Keep square corners.
- The red bottom/right treatment is a hard offset shadow: 8 px right and 8 px down, without blur.
- Pressed shadow: 10 px right and 10 px down.
- Black action buttons keep their black background; text changes from White 95 to White 80 on hover.
- Approved Back exception: white face with a transparent 3 px separation on the bottom and right only, exposing the page behind it before the standard red offset shadow. Keep the existing cover/reveal animation. Arrow and text change from Black 100 to White 80 (`#b0b0b0`) on hover.
- Approved Résumé exception: retain its current narrow, white-outline style rather than the standard wide action-button treatment.
- Form dropdown styling is a form-field decision; do not automatically restyle every HTML button as a primary action.

## Spacing

- Use the 12, 24, 36, 48, and 72 px scale.
- Project panel/image/writeup gaps: 24 px, using Spierer University as the reference.
- Writeup inner padding: 24 px. Normal paragraph gaps: 12 px.
- Home and About supporting text share the same outer insets.
- Deliberately composed artwork retains its internal geometry.
- Only project writeups and process strips show scrollbars: a 4 px Primary 2 (`#f60c09`) thumb that stays red on hover/press, with no arrow buttons. Browsers without pixel-sized scrollbar support retain their native thin-scrollbar fallback. Hide the outer page scrollbar while preserving normal page scrolling.

## Motion and exceptions

- Follow the supplied Framer reference for unspecified motion.
- Keep explicitly approved behavior, including Soft Spring section scrolling, the Menu/Back cover-and-reveal sequence, the floating crown, and project interactions.
- On desktop, overflowing project process/sketch strips pin in view while vertical page scrolling moves through all images horizontally. Continue vertically to Contact Me after the last image; scrolling upward reverses the sequence. Dragging and horizontal keyboard controls remain available. Compact layouts, reduced motion, and windows too short to show the content use the regular horizontal strip.
- Pinned horizontal travel runs at 1.6 times the vertical scroll distance, with a damped momentum glide. Direct dragging and scrollbar input stay synchronized, and the first/last image is reached before the section releases.
- Do not replace an approved motion with a new interpretation of a generic default.
- Ask the user before introducing a new exception to these standards. Record approved exceptions here.
