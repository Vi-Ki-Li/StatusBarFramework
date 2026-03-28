# Visual Anti-pattern Dictionary

Use this dictionary in `visual-audit` and deep validation modes.
Default assumption: UI is not qualified until no critical anti-pattern is found.

## A. Layout and structure defects

Container collapse:

- Signal: parent container height collapses unexpectedly while children are visible.

Overlap or clipping:

- Signal: content escapes container and blocks unrelated controls.
- Signal: dropdown or dialog is hidden behind lower layers.

Scroll breakage:

- Signal: overflow content cannot scroll.
- Signal: meaningless horizontal scrollbar appears.

Spacing anomalies:

- Signal: controls are glued together without margin/padding.

## B. Visual and styling defects

Contrast failure:

- Signal: text is hard to read due to low foreground/background contrast.

Jarring palette:

- Signal: color blocks are abrupt and inconsistent with nearby UI context.

Alignment fracture:

- Signal: icon/text baseline mismatch, form rows not aligned.

Truncation and wrapping failure:

- Signal: long text breaks layout or overlaps adjacent components.

## C. State and text rendering defects

Naked empty/error states:

- Signal: `null`, `undefined`, `[object Object]`, or unexplained blank area.

Placeholder leakage:

- Signal: loading placeholders remain after data is ready.

## D. Interaction affordance defects

Tiny hitbox:

- Signal: visible button area is larger than clickable hotspot.

Focus loss/trap issues:

- Signal: keyboard focus escapes modal unexpectedly.

False affordance:

- Signal: looks clickable but has no action, or disabled item still behaves clickable.

## E. Dynamic and temporal defects

Layout shifts (CLS-like):

- Signal: content jumps when images/messages/scrollbars appear.

Sticky hover:

- Signal: touch interaction leaves controls in fake hover-highlight state.

FOUC or harsh transitions:

- Signal: unstyled flash appears before styles load, or modal appears/disappears abruptly.

## F. Environment and responsive edge defects

Zoom breakage:

- Signal: at 150%/200% zoom, controls overlap or become unreachable.

Safe-area ignorance:

- Signal: key controls are too close to screen edge and may be covered by notches/system bars.

Scrollbar shift:

- Signal: opening modal causes page to shift left/right due to scrollbar lock changes.

## G. Form and micro-interaction defects

Destructive-action proximity:

- Signal: save and delete actions are too close or visually too similar.

Keyboard obscuration:

- Signal: virtual keyboard covers active input and page does not auto-scroll to reveal it.

Visual focus drift:

- Signal: content mass is strongly biased to one corner with large meaningless blank zones.

## H. Consistency and craft defects

Border-radius clashes:

- Signal: mixed sharp/rounded/pill corners in same cluster without clear hierarchy.

Shadow lighting chaos:

- Signal: cards use conflicting shadow directions/depth systems.

Typography rhythm break:

- Signal: heading/body/caption scales are inconsistent and reduce scanability.

Icon style mismatch:

- Signal: mixed icon stroke/fill/size styles create visual noise.

## Severity guide

- `P0`: blocks core flow or hides critical actions
- `P1`: strongly harms readability/usability
- `P2`: cosmetic or consistency issue

## Output format (required)

- `P0`: location + anti-pattern type + screenshot evidence
- `P1/P2`: location + anti-pattern type + screenshot evidence
- `Pass`: explicitly list checked areas where no anti-pattern found

## Anti-hallucination rule

- Do not output blanket claims like "UI looks good overall" without anti-pattern-by-anti-pattern evidence.
- If evidence is insufficient, output `needs-more-evidence` instead of `pass`.
