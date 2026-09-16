# Jesper Font Browser

Browse the fonts installed on your computer. Each family previews in its own
face, its styles open in a panel, and favourites keep an order you set by hand.

**Live:** https://jl-font-browser.netlify.app

```bash
npm install && npm run dev
```

## Chrome only

Fonts are read with the Local Font Access API, which is Chrome and Edge on
desktop. No other way exists to enumerate installed fonts from a web page.

There are three states. First run asks permission from a gesture, because the
browser requires one. Denied explains how to undo it, since a stranger's page
asking to read your font list is a reasonable no. Unsupported offers a sample
set instead.

That last one is for phones. Local Font Access does not exist on mobile, so
without it a phone could never reach the sheet or the touch drag. Sample data is
labelled in the header, because a font browser should never let you think you
are looking at your own fonts.

## What I focused on

The list at scale, the drag, and the type itself. A font list isn't a normal long
list. The cost isn't 900 rows, it's rendering 900 typefaces. That drove most of
the architecture.

## What I left out, and what I'd do next

Parsing the font binary is where I'd start: variable axes, OpenType features,
glyph grids, filtering by kind. Then weight filtering, collections, a compare
view.

Decided against rather than ran out of time: an exit animation on removal, it
needs ghost rows.

## Decisions (some of them)

**Windowing.** Only the families in view are rendered. Drawing hundreds of
typefaces at once would not be performant, so rows are keyed and driven by
scroll position. A spacer holds the full height so the scrollbar is honest, and
scrolling stays native.

**Springs, not transitions.** The reorder, the drawer, the tab pill and the gap
closing all run on one solver from my own motion library. Springs retarget
mid-flight, transitions restart.

**The drag writes to the DOM, not to React.** Pointer events only record
position, one rAF loop does the rest, and React learns the new order on drop.

**The sheet is not modal.** Below 1080 the specimen rises over the list, but
the list stays live so picking another family swaps it in place.

## Performance

| | |
| --- | --- |
| Rows in the DOM | ~28, any family count |
| Scroll to render | only when the range changes |
| Specimen slider | no dropped frames, 0.4ms of layout per change |
| `will-change` | added for the drag and dropped the moment it settles, so no layers are held |
| Layout reads | `clientHeight` and bounding rects are cached on resize or drag start, so nothing is measured per scroll or per frame |

Two things I measured and removed: `content-visibility` made no difference when
dragging the specimen size slider, and a backdrop blur on the dragged row would
have put another typeface behind the one you're reading.

## Accessibility

Keyboard throughout: one tab stop for the list, arrows to move, `/` for search,
and favourites reorder from the keyboard with a live region announcing each
move. Reduced motion is respected and every spring snaps. Hit targets are 32px.

The virtual list is where the caveats are. Find-in-page only finds rendered
rows, and the position a screen reader announces has to be set by hand, since
the DOM only ever holds about 28 of the 900.

## Tooling

* **Claude Code** — used throughout. It's part of a modern workflow, no reason
  to hide it. The direction, the design, the interactions, the architecture and
  the trade-offs above are mine.
* **UI** — custom. Didn't feel the need for a UI library, it would only have
  covered the tabs and the slider.
* **Motion** — CSS for the small things, and a spring solver extracted from my
  own motion library, which predates this.
* **State** — Zustand. The one I have most experience with.
* **Styles** — a small design system first: a fixed spacing scale, type and
  colour named by role. Built on Tailwind 4, tokens in `theme.css`.
* **Build** — Vite, deployed on Netlify.
* **IDE** — Cursor.
