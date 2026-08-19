---
name: Entrouge Intelligence Framework
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdada'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e8'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#424750'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#727781'
  outline-variant: '#c2c6d1'
  surface-tint: '#2a609c'
  primary: '#215995'
  on-primary: '#ffffff'
  primary-container: '#3f72af'
  on-primary-container: '#f2f5ff'
  inverse-primary: '#a3c9ff'
  secondary: '#585f6a'
  on-secondary: '#ffffff'
  secondary-container: '#d9e0ed'
  on-secondary-container: '#5c636e'
  tertiary: '#40597c'
  on-tertiary: '#ffffff'
  tertiary-container: '#587196'
  on-tertiary-container: '#f2f5ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e3ff'
  primary-fixed-dim: '#a3c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#004882'
  secondary-fixed: '#dce3f0'
  secondary-fixed-dim: '#c0c7d3'
  on-secondary-fixed: '#151c25'
  on-secondary-fixed-variant: '#404752'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#afc8f1'
  on-tertiary-fixed: '#001c3a'
  on-tertiary-fixed-variant: '#2f486a'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
  canvas: '#F9F7F7'
  surface-pale: '#DBE2EF'
  interaction-blue: '#3F72AF'
  deep-navy: '#112D4E'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-sm: 16px
  margin-md: 24px
  panel-width: 380px
  nav-height: 64px
---

## Brand & Style

This design system is engineered for high-density GIS (Geographic Information System) environments and urban intelligence. It pivots from its previous dark-mode origins to a **Clean, Professional, and Technical** light-mode aesthetic that prioritizes clarity and operational efficiency.

The visual narrative is driven by **Corporate Minimalism**. It leverages high information density balanced by a "Primary Canvas" of generous whitespace. The UI serves as a precise, glass-like frame for the central hero—a sophisticated, dark GIS map visualization. This creates a powerful figure-ground relationship where the UI remains unobtrusive while the data-heavy map provides the high-contrast focal point. The emotional response is one of authority, precision, and architectural stability.

## Colors

The palette is strategically inverted to create a "light-rig" environment for technical analysis.

*   **Primary Interaction (#3F72AF):** A focused blue used exclusively for active states, primary buttons, and accented data points. It signals interactivity against the neutral canvas.
*   **Secondary Surfaces (#DBE2EF):** A pale blue used for structural containers, panels, and subtle borders. It provides soft differentiation without the harshness of pure grey.
*   **Deep Navy (#112D4E):** The contrast anchor. Used for primary typography, navigation backgrounds, and the base color of the dark map visualization. It ensures maximum readability and brand presence.
*   **Primary Canvas (#F9F7F7):** An off-white base that reduces eye strain compared to pure hex white while maintaining a crisp, professional atmosphere.

## Typography

This design system utilizes **Inter** for all primary interface elements. Inter’s geometric clarity supports the system's technical nature while ensuring legibility across high-density data tables and sidebars.

To maintain the GIS and developer-friendly aesthetic, **JetBrains Mono** is retained for technical metadata, coordinates, and system labels. Headings and body text are primarily rendered in **Deep Navy (#112D4E)** to ensure AA+ accessibility on the light canvas. Secondary accents and links utilize **Interaction Blue (#3F72AF)** to clearly distinguish clickable intent from static information.

## Layout & Spacing

The layout follows a **Fixed-Panel Over Map** model. The hero content (the map) occupies the full viewport, with UI elements appearing as structured overlays.

*   **Fluidity:** While the map is fluid, the interface panels conform to a fixed-width logic (380px) to ensure data density remains predictable.
*   **Rhythm:** A strict 4px baseline grid is used. Generous internal padding (16px–24px) prevents the high information density from feeling claustrophobic.
*   **Breakpoints:** 
    *   **Desktop:** Global navigation is docked to the top or left in Deep Navy. Data panels are docked to the right on a Pale Blue surface.
    *   **Mobile:** Panels reflow into expandable bottom sheets. The map remains visible in the top portion of the screen, utilizing a minimum safe area margin of 16px.

## Elevation & Depth

This design system moves away from shadows, using **Tonal Layers** and **Subtle Outlines** to convey hierarchy.

*   **Surface Hierarchy:** The Primary Canvas (#F9F7F7) sits at the lowest level. Secondary Surfaces (#DBE2EF) are used for "docked" content.
*   **Borders:** Rather than depth-based shadows, elements are separated by 1px solid borders using the Secondary Blue (#DBE2EF). This creates a "blueprinted" technical look.
*   **Shadows:** Shadows are highly restrained, reserved only for "floating" temporary elements like dropdowns or context menus. These shadows are low-blur and tinted with a Deep Navy hue at very low opacity (5-10%) to maintain the clean aesthetic.
*   **The Map:** The map is the deepest layer, visually recessed through its dark Deep Navy base, making the light UI panels appear to float above it without the need for heavy drop shadows.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding provides a modern, approachable feel while maintaining the professional, industrial precision of a technical framework. 

Larger containers (Cards, Main Panels) use `rounded-lg` (0.5rem) to provide clear structural containment. All form inputs and buttons strictly follow the `rounded` (0.25rem) base to maintain consistency across interactive elements.

## Components

*   **Navigation & Headers:** Utilizes **Deep Navy (#112D4E)** backgrounds with white typography for the highest contrast and brand authority.
*   **Buttons:** 
    *   *Primary:* Solid **Interaction Blue (#3F72AF)** with white text. 
    *   *Secondary:* Ghost style with #DBE2EF borders and Interaction Blue text.
*   **Cards & Panels:** Built on **Pale Blue (#DBE2EF)** or White backgrounds with a mandatory **#DBE2EF 1px border**. Headers within cards use Deep Navy text.
*   **Input Fields:** White backgrounds with #DBE2EF borders. On focus, the border shifts to Interaction Blue (#3F72AF) with a 1px solid stroke.
*   **Data Chips:** Use Pale Blue (#DBE2EF) backgrounds with JetBrains Mono text in Deep Navy for a technical, "read-only" status look.
*   **Active States:** Always indicated by Interaction Blue (#3F72AF), either as a background fill or a heavy bottom-border underline (3px).