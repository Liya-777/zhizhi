---
name: ZhiZhi — Traceable Research Q&A for Student Journalists
description: Import interview transcripts, public reports, and background materials; retrieve relevant passages and stream answers with citations. Help users verify the original context. A restrained neutral visual system uses Gunmetal emphasis and semantic status colors.
colors:
  gunmetal:
    value: oklch(0.35 0 0)
    role: primary
  gunmetal-deep:
    value: oklch(0.25 0 0)
    role: primary-hover
  gunmetal-ghost:
    value: oklch(0.93 0 0)
    role: primary-subtle
  pure-white:
    value: oklch(1.0 0 0)
    role: surface
  warm-paper:
    value: oklch(0.97 0 0)
    role: background
  cool-paper:
    value: oklch(0.93 0 0)
    role: background-secondary
  muted-fill:
    value: oklch(0.95 0 0)
    role: surface-muted
  hairline:
    value: oklch(0.86 0 0)
    role: separator
  hairline-opaque:
    value: oklch(0.78 0 0)
    role: separator-opaque
  ink-full:
    value: oklch(0 0 0)
    role: text-primary
  ink-secondary:
    value: oklch(0.36 0 0)
    role: text-secondary
  ink-tertiary:
    value: oklch(0.48 0 0)
    role: text-tertiary
  ink-quaternary:
    value: oklch(0.60 0 0)
    role: text-placeholder
  signal-green:
    value: oklch(0.55 0.18 145)
    role: semantic-success
  signal-orange:
    value: oklch(0.62 0.18 65)
    role: semantic-warning
  signal-red:
    value: oklch(0.52 0.22 21)
    role: semantic-error
typography:
  caption2:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.01em"
  caption1:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.3
  footnote:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  subhead:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
  callout:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.4
  title3:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.3
  title2:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.3
  title1:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.02em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "13px"
  xl: "18px"
  2xl: "22px"
  full: "9999px"
spacing:
  0: "0"
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.gunmetal}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.gunmetal-deep}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.gunmetal}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.gunmetal}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.muted-fill}"
    textColor: "{colors.ink-full}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.pure-white}"
    rounded: "{rounded.lg}"
---

# Design System: ZhiZhi

This reference describes the visual direction and original light-theme tokens. The current application also includes a dark theme implemented through CSS variables in `frontend/src/styles/globals.css`. Specifications below describe design intent; they are not a completed accessibility audit or a guarantee that every component matches each target.

## 1. Overview

**Creative direction: “The Machined Surface.”**

The interface draws on the qualities of precision-made aluminum: a subdued brushed finish, carefully defined edges, and a cool, restrained surface. Source material and answers remain the focus.

Gunmetal replaces a conventional bright blue accent. Brushed gradients and subtle surface highlights give primary actions a recognizable treatment. Blue is reserved for links and limited functional details.

The layout avoids dense administrative tables, decorative sidebars, oversized loading effects, and generic assistant imagery. The goal is a reading tool with the clarity and pacing of a well-typeset technical publication.

Key characteristics:

- Neutral grays establish the main hierarchy, from dark text to light surfaces.
- Brushed gradients and small highlights provide the primary visual emphasis.
- System typography supports Chinese and English; Chinese text uses zero added letter spacing.
- Translucent regular and thick materials separate navigation from content.
- Green, orange, and red indicate semantic status.
- Motion acknowledges actions and reveals content using restrained physical cues.

## 2. Colors

The light palette uses neutral OKLCH values with zero chroma. Semantic colors identify success, warnings, and errors. The token definitions at the top of this file record the original light-theme values.

### Primary colors

| Token | Value | Intended use |
| --- | --- | --- |
| Gunmetal (`metal`) | `oklch(0.35 0 0)` | Primary actions, selection indicators, focus, and send controls |
| Gunmetal Deep (`metal-hover`) | `oklch(0.25 0 0)` | Stronger hover and pressed emphasis |
| Gunmetal Ghost (`metal-ghost`) | `oklch(0.93 0 0)` | Selected backgrounds, subtle hover feedback, and labels |

The signature action gradient is:

```css
linear-gradient(
  160deg,
  oklch(0.48 0 0) 0%,
  oklch(0.35 0 0) 40%,
  oklch(0.20 0 0) 100%
)
```

Its lighter upper edge and darker lower edge suggest the reflection of ambient light on brushed metal.

### Neutral colors

| Token | Value | Intended use |
| --- | --- | --- |
| Ink Full (`ink`) | `oklch(0 0 0)` | Headings and primary text |
| Ink Secondary (`ink-secondary`) | `oklch(0.36 0 0)` | Secondary headings, descriptions, and metadata |
| Ink Tertiary (`ink-tertiary`) | `oklch(0.48 0 0)` | Labels, timestamps, and supporting text |
| Ink Quaternary (`ink-quaternary`) | `oklch(0.60 0 0)` | Original placeholder and disabled-text token |
| Pure White (`surface`) | `oklch(1.0 0 0)` | Cards, dialogs, and focused inputs |
| Warm Paper (`bg`) | `oklch(0.97 0 0)` | Page background |
| Cool Paper (`bg-secondary`) | `oklch(0.93 0 0)` | Grouped sections and secondary backgrounds |
| Muted Fill (`surface-muted`) | `oklch(0.95 0 0)` | Unfocused inputs and quiet surfaces |
| Hairline (`separator`) | `oklch(0.86 0 0)` | Fine dividers |
| Hairline Opaque (`separator-opaque`) | `oklch(0.78 0 0)` | More visible borders and control outlines |

The page may use a very low-opacity CSS grid texture. Hairline dividers target a 0.5 CSS-pixel stroke, corresponding to one physical pixel on a 2× display.

Text contrast must be checked against the rendered background. The original token names and values do not establish accessibility compliance on their own. The current theme uses shared semantic variables, including darker placeholder text in light mode and lighter text in dark mode.

### Semantic colors

| Token | Value | Meaning |
| --- | --- | --- |
| Signal Green | `oklch(0.55 0.18 145)` | Success, confirmation, and online status |
| Signal Orange | `oklch(0.62 0.18 65)` | Warnings and local Mock status |
| Signal Red | `oklch(0.52 0.22 21)` | Errors, deletion, and stopping |

### Material overlays

| Material | Light-theme definition | Use |
| --- | --- | --- |
| Regular | `oklch(0.97 0 0 / 0.72)` with `backdrop-filter: blur(20px)` | Headers and toolbars |
| Thick | `oklch(0.97 0 0 / 0.85)` with `backdrop-filter: blur(40px)` | Sidebar and popovers |

### Theme behavior

The active theme is applied through `data-theme` on the root element. Shared CSS variables define backgrounds, surfaces, borders, and text. Dark mode uses deep gray surfaces and light neutral text. The saved theme is applied before React loads to reduce a light-background flash.

### Color rules

- Keep decorative color restrained. Use semantic color to convey a status or action meaning.
- Use the Gunmetal gradient consistently for primary-action emphasis.
- Aim for at least 4.5:1 contrast for ordinary text and 3:1 for large text. Check placeholders and secondary text in both themes.
- Preserve the hierarchy between the page, quiet surfaces, active surfaces, and raised content.

## 3. Typography

- **Display:** SF Pro Display for large titles, with PingFang SC fallback.
- **Body:** SF Pro Text, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, and system sans-serif fallbacks.
- **Monospaced:** SF Mono, Menlo, and monospace for code and citation details.

The font stack should support Chinese and English without competing with the content. Use normal system kerning for English and `letter-spacing: 0` for Chinese.

### Type hierarchy

| Role | Weight | Size | Line height | Use |
| --- | --- | --- | --- | --- |
| Large Title | 700 | 34px / 2.125rem | 1.1 | Top-level title; use sparingly |
| Title 1 | 700 | 28px / 1.75rem | 1.2 | Main headings and dialogs |
| Title 2 | 400 | 22px / 1.375rem | 1.3 | Panel and section titles |
| Title 3 | 400 | 20px / 1.25rem | 1.3 | Subsections |
| Headline | 600 | 17px / 1.0625rem | 1.4 | List and card titles |
| Body | 400 | 17px / 1.0625rem | 1.5 | Long answers and source reading |
| Callout | 400 | 16px / 1rem | 1.5 | Conversation text |
| Subhead | 400 | 15px / 0.9375rem | 1.4 | Summaries and list descriptions |
| Footnote | 400 | 13px / 0.8125rem | 1.4 | Citations, metadata, and inline code |
| Caption 1 | 400 | 12px / 0.75rem | 1.3 | Labels, timestamps, and counters |
| Caption 2 | 400 | 11px / 0.6875rem | 1.3 | Small supporting details |

Large Title uses `0.02em` letter spacing, Title 1 uses `0.01em`, and Caption 2 uses `0.01em` where appropriate for the language.

### Typography rules

- Assign one size to each semantic role rather than using several nearly identical sizes.
- Limit long answer prose and document previews to approximately `65ch` for comfortable line lengths.
- Use consistent paragraph spacing and retain readable source context.

## 4. Elevation

Depth is established by surface contrast, translucent materials, fine borders, and restrained shadows. Resting surfaces should appear quiet rather than floating dramatically above the page.

| Role | Shadow | Use |
| --- | --- | --- |
| Card rest | `0 1px 3px oklch(0 0 0 / 0.04)` | Very subtle separation |
| Card hover | `0 2px 8px oklch(0 0 0 / 0.06)` | Slight additional depth during interaction |
| Dialog | `0 20px 60px oklch(0 0 0 / 0.08), 0 8px 20px oklch(0 0 0 / 0.06)` | Overlaid content |
| Input focus | `0 2px 16px oklch(0 0 0 / 0.06)` | Focus feedback alongside a border change |

### Elevation rules

- Keep resting surfaces visually flat and communicate interactivity deliberately.
- Use shadows to suggest separation and ambient occlusion, rather than decorative bloom.
- Avoid large or brightly colored shadows. The earlier visual target limited resting shadow blur to approximately 8px.

## 5. Components

### Buttons

Buttons should feel precise and responsive. The main action uses the Gunmetal gradient and white text.

- Shape: `border-radius: 10px`; target a minimum 44 × 44-point interaction area.
- Primary (`.btn-primary`): gradient fill, white text, weight 600; hover opacity 0.85; active scale 0.97; disabled opacity 0.3 and `cursor: not-allowed`.
- Secondary (`.btn-secondary`): transparent fill, 1px outline, and strong neutral text; quiet hover background and active scale 0.97.
- Ghost (`.btn-ghost`): no border; use for toolbar actions and icon controls.
- Destructive: use semantic red for the action text and related feedback.
- Loading: replace content with a 16px Lucide `Loader2` where a compact progress indicator is appropriate.
- Transition target: approximately 150ms for press and hover feedback.

### Inputs

Inputs use a quiet surface and rounded corners, becoming more distinct on focus.

- Base (`.input`): muted background, no prominent border, `border-radius: 10px`.
- Focus: a distinct surface and an inset focus outline; transition around 200ms.
- Disabled: reduced opacity and `cursor: not-allowed`.
- Textarea: no manual resize; height adjusts in JavaScript up to 150px.
- Placeholder text: use the current semantic text variable and verify contrast against the input surface.

### Cards

Cards use a restrained brushed-surface treatment:

- Shape (`.card`): `border-radius: 13px`.
- Light background: `linear-gradient(160deg, oklch(1 0 0) 0%, oklch(0.985 0 0) 50%, oklch(0.965 0 0) 100%)`.
- Border: 0.5px Hairline.
- Shadow: subtle at rest, slightly stronger on hover.
- Interactive variant (`.card-interactive`): pointer cursor, hover scale 0.99, active scale 0.97, approximately 200ms transition.
- Answer entrance (`.card.breath-sheen`): a brief diagonal highlight using a pseudo-element; the effect fades after approximately 0.8 seconds.
- Avoid unnecessary nested card containers.

Dark-theme card colors come from the shared surface variables.

### Badges and chips

- Base (`.badge`): inline flex, 2px × 8px padding, 11px text, weight 600, fully rounded corners.
- Primary: subtle neutral background and strong neutral text for counts and mode labels.
- Success, warning, and error: a low-opacity semantic background with matching status text.

### Citation markers

- Base (`.citation-marker`): inline flex, minimum width 20px, height 18px, 11px text, weight 600, radius 4px.
- Rest: subtle neutral background and strong text.
- Hover: increased emphasis.
- Feedback: a brief `citation-pulse` effect identifies a selected citation.
- Source content remains readable and expandable separately from the answer.

### Header and navigation

- Header uses the regular material and a fine lower divider.
- Header title: 14px, weight 600; subtitle: 11px.
- Distinguish the current view using neutral surface and icon emphasis.
- User menu: a raised surface, 12px corner radius, and restrained overlay shadow.
- Translate interface labels through the shared language state.

### Loading placeholders

- Base (`.skeleton`): neutral fill, 6px radius, 1.5-second opacity animation.
- Target opacity range: 0.3–0.6.
- Use skeletons to indicate the structure of loading cards, lists, and answer regions.
- Compact spinners may communicate activity in individual controls.

### Answer prose

- Container (`.answer-prose`): line height 1.5, maximum width `65ch`, and semantic text color.
- Paragraph spacing: bottom margin 0.75rem, omitted after the final paragraph.
- Inline code: muted surface, 2px × 6px padding, 4px radius, 13px monospaced text.
- Lists: 1.25rem left padding and 0.75rem lower margin.
- Headings: weight 600, 1.25rem upper margin, and 0.5rem lower margin.
- Preserve the document and answer language independently of the interface language.

### Scrollbars

Use a quiet 4px scrollbar, neutral thumb, and transparent track. Firefox uses `scrollbar-width: thin`. Scrollbars should remain functional and visually unobtrusive.

## 6. Interaction and accessibility checklist

Design targets:

- Keep primary emphasis consistent across actions and themes.
- Use fine dividers and shared surface variables.
- Prefer short, smooth transitions, typically 150–300ms.
- Respect `prefers-reduced-motion` by simplifying transforms and elaborate effects.
- Verify contrast for body text, secondary labels, placeholders, and focus states.
- Keep long text within comfortable line lengths.
- Provide accessible names for interactive controls.
- Make reading, source expansion, and verification easy to follow with a keyboard.

Avoid:

- Bright blue primary actions that conflict with the Gunmetal visual system.
- Decorative neon effects or gradient text.
- Making dark mode the default solely for visual effect.
- Large saturated panels, overly soft card styling, or dense office-dashboard conventions.
- Generic assistant imagery and exaggerated bouncing movement.
- Heavy selection stripes, unnecessary nested cards, or highly decorative scrollbars.

Use the application source for final implemented values and behavior. This checklist is a design reference rather than a report of formal conformance testing.
