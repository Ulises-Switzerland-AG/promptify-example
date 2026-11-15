---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/globals.css","app/prompts"]
---

# Promptify home

Mode: Operate. Scope: authenticated discovery at `/`, with reading, copying and
creation as supporting flows. Real database content only. Spanish interface.
Search matches title, description and content before pagination; Category and
search compose. Existing authorization and plain-text rendering are binding.

## Direction contract

THESIS: A compact Prompt library with an explicitly console-inspired Pixel Art
identity, never a promotional landing page or a game.

OWN-WORLD: Midnight ink ground, plum navigation, indigo panels, mint actions,
butter-yellow selection and coral danger. Pixelify Sans headings and controls,
Geist reading text, square frames and crisp grid-drawn icons. No glow or CRT.

STORY: Find a Prompt, filter in place, read and copy; Authors edit their work.
Administrators maintain Categories and assign roles through existing server rules.
Library results open URL-backed native dialogs for reading and editing, with
accessible pixel-icon actions and a separate deletion confirmation. Preserve the
list, filters, scroll and focus underneath. Dialogs fill the screen on mobile;
direct links and refreshes remain usable as standalone pages.
Creation has an explicit static modal route so `new` is never treated as a Prompt
identifier. It returns to the originating library context when cancelled.

FIRST VIEWPORT: A narrow plum rail holds Categories, administration and identity.
The workspace starts with a small title, creation action and one search row.
Results begin immediately below in aligned rows: title/description, Category,
Author and date. Mobile uses a native Category select and stacked result rows.
Signature: a small stepped pixel cursor marks the selected Category while
filter-and-return keeps the shell, URL, scroll and reading context.

FORM: User-pinned dark 8/16-bit console Pixel Art, code-led. Supersedes the
rejected green directory direction. The shipped world is user-pinned.
Familiar web
navigation and forms stay standard; the world owns type, palette and density.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
