# Framer interaction reference

Compared the public component modules in the user's local Framer export with the native implementation. Source files remain in Downloads; captured editor and account data are not used.

| Control | Framer definition | Local treatment |
| --- | --- | --- |
| Menu | 240 × 64, white text, 8px red shadow; hover gray, press 10px shadow | Shared size/state styles with Submit; four equal navigation cells, with an optional Test link controlled by `showScrollTests` |
| Menu motion | One spring row, bounce .2, no stagger | User-requested slower motion; a fixed mask lets the opaque row slide behind Menu |
| Submit | 240 × 64, .2s tween; hover gray, press 10px shadow, disabled opacity .5 | Same dimensions as Menu at each breakpoint; existing configured delivery states retained |
| Logo | 64 × 64; press opacity .9 | Press opacity .9; shared header dimensions on all pages |
| Résumé | 24px regular; 2px outline becomes 3px on hover/press; offset frame changes on press | Fixed secondary control dimensions with thicker outline and offset frame; pending PDF label stays noninteractive |
| Name | Marble overlay on hover/press; red layer offset 4px on hover and 6px on press | Marble text with crisp 4px/6px shadow, preserving the user's no-blur preference |
| Back to Top | Press scale .9, spring .4s | Press scale .9 with .4s transition |
| About portrait | Monochrome to color on hover | Existing color transition retained |

The user's later choices take precedence: only Contact Me receives an underline, its white rule has no red shadow, and the crown has a slower 25px float. Project artwork interactions come from the supplied Figma prototype because the Framer capture contains no project pages.

Email and phone inputs use required native format constraints and red inline errors on blur. This checks the entered format; confirming ownership or reachability would require a verification service.
