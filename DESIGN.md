---
name: Promptify
description: A compact Spanish prompt library in a dark, crisp-edged pixel console.
colors:
  background: "#141322"
  foreground: "#eeeaf8"
  muted: "#b6b0cc"
  accent: "#9ce8bc"
  accent-hover: "#c0f5d4"
  accent-soft: "#263d38"
  border: "#514968"
  rail: "#252036"
  surface: "#201d32"
  surface-raised: "#2b263f"
  field: "#191627"
  selection: "#f3ce78"
  selection-soft: "#3e342c"
  danger: "#ffabae"
  danger-soft: "#3d242d"
  action-ink: "#183229"
  field-stroke: "#7f709b"
  panel-stroke: "#716184"
  secondary-stroke: "#7b6e97"
  secondary-hover: "#3b3352"
  danger-stroke: "#ad656e"
  danger-ink: "#3a1720"
  danger-hover: "#ffd1d1"
  disabled-surface: "#2d283a"
  navigation-link: "#d3cae4"
  discovery-surface: "#393048"
  discovery-label: "#f3d9a1"
  list-heading: "#30283f"
  category-surface: "#332c43"
  category-stroke: "#5b506e"
  category-ink: "#dbd0ee"
  success-stroke: "#527b65"
  selection-stroke: "#8e7147"
  modal-stroke: "#a68ebd"
  modal-backdrop: "#090813bb"
  modal-shadow: "#07061180"
typography:
  display:
    fontFamily: "Pixelify Sans, sans-serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.25
  title:
    fontFamily: "Pixelify Sans, sans-serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Pixelify Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.25
  compact:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  square: "0px"
spacing:
  gap-compact: "8px"
  gap-controls: "12px"
  inset-compact: "16px"
  inset-panel: "24px"
  section: "36px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.action-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "8px 14px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "8px 14px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.danger-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
  input-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.square}"
    padding: "10px 12px"
  prompt-list:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.square}"
    padding: "0px"
---

# Design System: Promptify

## Overview

**Creative North Star: "The Midnight Cartridge Console"**

Promptify is a working library, not a game screen or promotional landing page. Its dark plum-and-indigo console atmosphere is built from flat color fields, square frames, Pixelify Sans display lettering, and compact, custom pixel-drawn SVG marks. Familiar web navigation, forms, and reading behavior stay familiar; the retro character comes from the surface language rather than replacing standard controls.

IBM Plex Sans keeps prompt titles, descriptions, metadata, and long-form prompt text clear at working sizes. Mint marks constructive actions, butter yellow identifies selection and keyboard focus, and coral is reserved for destructive actions and errors. The interface uses no raster illustration, CRT treatment, or glow effects.

**Key Characteristics:**
- Midnight plum surfaces with mint actions and butter-yellow selection.
- Hard square edges, crisp rules, and stepped SVG details.
- Pixelify Sans for display and action labels; IBM Plex Sans for reading and data.
- Compact, task-first density with responsive native web controls.

## Colors

The palette pairs near-black violet surfaces and lavender text with a restrained mint, butter, and coral signal set; colors remain flat and legible rather than luminous.

### Primary
- **Terminal Mint** (`{colors.accent}`): Main creation and positive-action color; success feedback and the brand mark share this signal.
- **Soft Mint** (`{colors.accent-hover}`): Hover feedback and the bright edge on primary actions.
- **Deep Moss** (`{colors.accent-soft}`): Quiet backing for the search action.

### Secondary
- **Cartridge Butter** (`{colors.selection}`): Selected Category, keyboard focus, and text selection; it is the system's second high-salience signal.
- **Muted Butter Ground** (`{colors.selection-soft}`): Background for result counts and the current page marker.
- **Coral Alert** (`{colors.danger}`): Destructive actions and error feedback.
- **Deep Wine** (`{colors.danger-soft}`): Error-state backing.

### Tertiary
- **Discovery Plum** (`{colors.discovery-surface}`): The library's prominent navigation surface.
- **Discovery Sand** (`{colors.discovery-label}`): Warm text accent for the discovery link.
- **Action Ink** (`{colors.action-ink}`): Dark text against the mint primary action.

### Neutral
- **Midnight Ink** (`{colors.background}`): Main app canvas.
- **Aubergine Rail** (`{colors.rail}`): Persistent desktop navigation and supporting page header.
- **Ink Panel** (`{colors.surface}`): Result list, forms, prompt content, and dialog surface.
- **Raised Plum** (`{colors.surface-raised}`): Secondary controls and raised content.
- **Near-black Field** (`{colors.field}`): Inputs and search field interior.
- **Lavender Chalk** (`{colors.foreground}`): Primary text and icons.
- **Lavender Ash** (`{colors.muted}`): Supporting copy, metadata, and quiet labels.
- **Violet Rule** (`{colors.border}`): Separators and subtle structure.
- **Field Violet** (`{colors.field-stroke}`): Input and search borders.
- **Panel Violet** (`{colors.panel-stroke}`): Repeated two-pixel panel frames.
- **Category Ink** (`{colors.category-ink}`): Text on compact Category badges.
- **Category Plum** (`{colors.category-surface}`): Category badge backing.
- **Danger Edge** (`{colors.danger-stroke}`): Outlined destructive controls and error borders.
- **Modal Shade** (`{colors.modal-backdrop}`): Native confirmation dialog backdrop.

**The Three Signals Rule.** Mint means constructive action, butter means selected or focused, and coral means destructive or error. Do not trade these roles merely to add variety.

## Typography

**Display Font:** Pixelify Sans (with sans-serif fallback)  
**Body Font:** IBM Plex Sans (with sans-serif fallback)  
**Label/Mono Font:** Pixelify Sans for action labels; no separate monospace role is used.

**Character:** Pixelify Sans gives headings and action labels an unmistakable console rhythm, while IBM Plex Sans preserves the clarity needed for a library people scan and copy from. Keep the pixel face out of long content and dense descriptive text.

### Hierarchy
- **Display** (500, 32px / 1.25): Pixelify Sans for page and supporting-page headings; it reduces to 30px on narrow layouts.
- **Headline** (400–500, 20–24px): Pixelify Sans for section and management headings; the library section title is 21px.
- **Navigation** (500, 18px): Pixelify Sans for sidebar discovery and administration links; category group headings in the sidebar use 16px.
- **Title** (600, 14px / 1.5): IBM Plex Sans for individual Prompt titles in result rows.
- **Body** (400, 14px / 1.6): IBM Plex Sans for the interface; prompt content keeps the same 14px face with a more open 1.9 line-height.
- **Supporting copy** (400, 13px / 1.65): IBM Plex Sans for summaries; descriptions are clamped to two lines in results.
- **Label** (500, 16px / 1.25): Pixelify Sans for buttons; compact form labels use IBM Plex Sans at 13px.
- **Metadata** (400, 11–12px): IBM Plex Sans for authors, dates, role indicators, and secondary details.

**The Readable Pixel Rule.** Use Pixelify Sans to mark hierarchy and action, not to typeset the content people came to read.

## Layout

The desktop shell pairs a fixed-width navigation rail with a flexible workspace. The rail is 224px wide, narrowing to 208px below 1180px; the workspace is capped at 1500px. Detail and creation content center in an 824px column, while administration uses up to 1040px. The standard desktop top bar is 60px high.

At 760px and below, the rail gives way to a 64px top bar with the brand and mobile administration link; Category filtering becomes a collapsible "Categorías (N)" panel of checkboxes. The result grid progressively removes date then author columns, and at 520px the table heading disappears and each result becomes a compact stacked row. Page insets step down from 32px to 24px, 20px, and 16px at the corresponding layouts. Repeated gaps cluster around 8–12px for controls, 16–24px inside content, and 24–36px between sections.

## Elevation & Depth

Depth is primarily tonal: the canvas, rail, panels, and raised controls use adjacent dark violet values separated by crisp borders. No ambient shadow or glow is used on resting controls. Native Prompt and confirmation dialogs use a broad, dark structural shadow (`0 20px 60px #07061180`) over a dimmed backdrop; reduced-motion preferences remove transition and animation durations.

**The Flat-By-Default Rule.** Use color planes and strokes to establish hierarchy; reserve the dialog shadow for modal separation, not decoration.

## Shapes

The form language is square throughout: buttons, inputs, category markers, badges, cards, and dialogs use zero-radius corners. Two-pixel violet frames outline primary panels and fields, with one-pixel rules for internal divisions. Custom SVG icons use crisp-edge rendering and stepped geometry; the selected Category marker is a small stepped pixel shape. This geometry is native to the world and should remain intact.

## Components

### Buttons
- **Character:** Compact, square, tactile through a firm border and color response—not through rounded pills or lift.
- **Shape:** Square corners (0px); 2px border; 40px minimum height.
- **Primary:** Terminal Mint background, Action Ink text, Pixelify Sans 16px medium, 8px × 14px padding.
- **Hover / Focus:** Primary shifts to Soft Mint; all keyboard focus uses a 2px dashed butter outline with 4px offset.
- **Secondary / Ghost / Tertiary:** Secondary uses Raised Plum with a violet stroke; destructive-secondary is transparent with a coral border; danger confirmation uses coral fill and dark ink.
- **Disabled:** Muted lavender text on a dark plum backing with a subdued border; keep the not-allowed cursor.

### Chips
- **Style:** Category badges are square, compact labels on a dark plum backing, with a thin violet border and an 8px square category-color marker.
- **State:** The selected navigation Category uses butter text, a plum highlight, and a stepped butter cursor; ordinary Category badges remain descriptive, not button-like.

### Cards / Containers
- **Corner Style:** Square (0px).
- **Background:** Ink Panel against Midnight Ink; Raised Plum is reserved for secondary controls.
- **Shadow Strategy:** Flat at rest; see Elevation & Depth for the modal exception.
- **Border:** Two-pixel violet outer frame and one-pixel row separators.
- **Internal Padding:** 16–24px for panels and prompt content; rows retain denser 16–20px horizontal and vertical spacing.
- **Interaction:** Result rows change to a slightly lighter plum on hover or focus-within without moving or lifting.

### Inputs / Fields
- **Style:** Near-black Field, 2px Field Violet border, square corners, and 10px × 12px padding.
- **Focus:** Butter dashed outline with a 4px offset; the search surface applies the same treatment on focus-within.
- **Error / Disabled:** Errors pair Deep Wine backing with a coral rule and text; disabled controls use the dark disabled surface and subdued text.
- **Mobile:** Category filtering uses a native `<details>` panel of real checkboxes; text entry expands to 16px on narrow screens to remain comfortable.

### Navigation
- **Style:** Aubergine rail with Pixelify Sans discovery and administration links; regular Category names stay in IBM Plex Sans.
- **Default / Hover / Active:** Discovery has its own plum/sand treatment; Category selection uses butter text and the stepped cursor. Hover changes the surface or text, never position.
- **Mobile:** Replace the rail with the standard top bar and native Category selector; do not compress the desktop rail into a miniature navigation strip.

### Pixel Marks and Prompt Content
Brand and interface symbols are custom SVG paths rendered with crisp edges, not raster sprites or an icon-font aesthetic. Prompt content is a square framed, pre-wrapped IBM Plex Sans reading surface; keep whitespace and long lines readable rather than switching content to a decorative pixel face.

### Prompt Modal
Opening a library result keeps the list underneath a native dialog. Its desktop frame
is at most 824px wide with a 2px violet border, 24px body insets and a sticky plum
header. The 28px Pixelify Sans title wraps beside a 44px close control. Copy, edit
and delete use adjacent 44px square pixel-icon controls with accessible names and
native title hints; copy feedback occupies a separate row without separating actions.
At 760px and below, the dialog becomes borderless and full-screen with 16px
horizontal insets and a 26px title. The body scrolls independently; native focus
containment, Escape, backdrop dismissal and focus restoration preserve web behavior.
Creation uses the same modal form treatment, with its own static route. Editing
replaces the modal body, not the library. Deletion opens a separate
confirmation above it. Direct URLs and refreshes retain standalone page views.

## Do's and Don'ts

### Do:
- **Do** keep the square silhouette and crisp one- or two-pixel border language.
- **Do** use mint for constructive actions, butter for selection/focus, and coral for destructive or error states.
- **Do** pair Pixelify Sans hierarchy with IBM Plex Sans reading text and data.
- **Do** preserve standard, accessible navigation, form controls, visible keyboard focus, and clear hover states.
- **Do** retain custom crisp-edge SVG symbols and the stepped Category cursor where those patterns are used.

### Don't:
- **Don't** introduce rounded cards, pill controls, soft ambient shadows, or gradients; these conflict with the shipped square, flat surfaces.
- **Don't** add CRT scanlines, glow, game scores, badges, or other gamification; the product is a working Prompt library.
- **Don't** set long Prompt content or dense descriptive copy in Pixelify Sans.
- **Don't** replace the world's stepped SVG icon language with a generic rounded icon set or raster decoration.
