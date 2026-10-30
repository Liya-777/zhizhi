# Product Overview

## Project

ZhiZhi — Traceable Research Q&A for Student Journalists  
Author: Liu Yan

This document describes product direction and design goals. It is not a claim of completed usability research or accessibility certification.

## Users

Student journalists, journalism and communication students, and campus-media editors. Users import interview transcripts, public reports, and background materials, then use natural-language questions to locate people, dates, policies, and points of disagreement before checking the original sources.

**Core journey:** import sources → ask a reporting question → receive cited research leads → inspect the original context → compare accounts or conduct further interviews.

## Product purpose

ZhiZhi accepts interview transcripts, public reports, and background materials in PDF, DOCX, TXT, and Markdown. It converts source passages into embeddings, retrieves relevant passages, and streams answers with citations.

The reporting task continues beyond the answer. Users should inspect who made a statement, when it was made, how a statistic was defined, and what the surrounding passage says.

**Success criterion:** the interface should help users distinguish a retrieved lead from an independently verified fact, and make source inspection, comparison, and additional reporting natural next steps.

## Brand personality

**Clear, transparent, and human.**

- Generous whitespace gives source material and answers room to be read.
- Translucent layers and backdrop blur create depth and help users remain oriented.
- The system font stack supports both Chinese and English, with deliberate spacing, line height, and paragraph rhythm.
- Gunmetal provides the main visual emphasis; neutral grays establish the remaining hierarchy.
- Streamed answers and precise citations communicate capability through useful behavior.

Three guiding words: **transparency, precision, humanity**.

## Visual directions to avoid

- A dark background as the default: light mode is the starting point, with dark mode available as an option.
- Neon styling, decorative halos, or prominent glowing shadows.
- Large areas of saturated color. Accent colors should remain limited and purposeful.
- Gradient text using `background-clip: text`.
- Warm beige backgrounds paired with purple gradients and oversized rounded cards.
- Dense office-software tables, tree navigation, and dated administrative-dashboard styling.
- Generic assistant imagery or green chat bubbles borrowed from unrelated products.
- Exaggerated bouncing or elastic movement.

## Design principles

1. **Let content lead.** Keep document text and answers central. Remove decoration that competes with reading.
2. **Create readable depth.** Use translucent regular and thick materials, subtle borders, and restrained shadows to distinguish navigation, tools, and content.
3. **Use emphasis consistently.** Gunmetal gradients identify primary actions and interaction states. Neutral grays communicate secondary structure.
4. **Treat typography as part of usability.** Use the system font stack with Chinese fallbacks. Target line heights around 1.4–1.7, limit long answer text to approximately 65 characters per line, and keep Chinese letter spacing at zero.
5. **Give motion a purpose.** Small press feedback, smooth scrolling, and contextual transitions should acknowledge actions and reveal results without distracting from the reporting task.

## Accessibility and inclusion targets

- Aim for WCAG AA contrast: at least 4.5:1 for normal text and 3:1 for large text.
- Check text contrast against its actual background in both light and dark themes.
- Respect `prefers-reduced-motion`, replacing large transforms or blur transitions with simpler opacity changes where appropriate.
- Support keyboard navigation with a clear focus order, Enter or Space activation, and Escape dismissal where applicable.
- Provide descriptive accessible labels for icon controls.

These are design targets. The package does not include a formal accessibility audit.
