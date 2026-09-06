---
name: Structure & Flow
colors:
  surface: '#f8f9fc'
  surface-dim: '#d9dadd'
  surface-bright: '#f8f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3f6'
  surface-container: '#edeef1'
  surface-container-high: '#e7e8eb'
  surface-container-highest: '#e1e2e5'
  on-surface: '#191c1e'
  on-surface-variant: '#414750'
  inverse-surface: '#2e3133'
  inverse-on-surface: '#eff1f4'
  outline: '#717782'
  outline-variant: '#c1c7d2'
  surface-tint: '#0061a4'
  primary: '#00497d'
  on-primary: '#ffffff'
  primary-container: '#0061a4'
  on-primary-container: '#c0dbff'
  inverse-primary: '#9fcaff'
  secondary: '#5c5e66'
  on-secondary: '#ffffff'
  secondary-container: '#e1e2ec'
  on-secondary-container: '#62646d'
  tertiary: '#3b4758'
  on-tertiary: '#ffffff'
  tertiary-container: '#535f70'
  on-tertiary-container: '#cdd9ed'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#9fcaff'
  on-primary-fixed: '#001d36'
  on-primary-fixed-variant: '#00497d'
  secondary-fixed: '#e1e2ec'
  secondary-fixed-dim: '#c5c6d0'
  on-secondary-fixed: '#191b22'
  on-secondary-fixed-variant: '#44474f'
  tertiary-fixed: '#d7e3f8'
  tertiary-fixed-dim: '#bbc7db'
  on-tertiary-fixed: '#101c2b'
  on-tertiary-fixed-variant: '#3c4858'
  background: '#f8f9fc'
  on-background: '#191c1e'
  surface-variant: '#e1e2e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
  headline-md-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  margin-tablet: 24px
  gutter: 12px
  stack-sm: 4px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is built for a high-utility utility app, focusing on clarity, efficiency, and reliability. It follows a **Modern Corporate** aesthetic heavily influenced by Material Design 3, emphasizing functional beauty through a "Less is More" approach. 

The target audience consists of students and professionals who require immediate results. The UI evokes a sense of **competence and ease**, using generous whitespace to reduce cognitive load during multi-step conversion processes. Tactile feedback is mimicked through soft elevations rather than complex textures, ensuring the interface feels responsive and native to the Android ecosystem.

## Colors

The palette is anchored by **#0061A4 (Primary Blue)**, chosen to instill trust and denote "Action." 

- **Primary:** Used for key action buttons, active states, and primary branding elements.
- **Secondary:** A soft periwinkle-grey used for container backgrounds and subtle selection states.
- **Tertiary:** A muted slate for supporting information and icon accents.
- **Neutral:** A crisp, slightly cool-tinted white for the main canvas to maintain a high-contrast environment for document previews.

Status colors (Success, Error) follow standard M3 tokens but are slightly desaturated to maintain the professional tone.

## Typography

This design system utilizes **Plus Jakarta Sans** for headings to inject a friendly, modern personality into the utility. Its open counters and soft terminals make the app feel approachable. 

For functional text and long-form reading (like file names and settings), **Inter** is used for its exceptional legibility and systematic "developer-centric" precision.

- **Headlines:** Use Bold or SemiBold weights to create a clear hierarchy.
- **Body:** Use Regular weight with standard line heights to ensure readability during document reviews.
- **Labels:** Use Medium weight for buttons and navigation items to differentiate them from static content.

## Layout & Spacing

The layout follows a **8pt soft grid** system. For mobile interfaces, a 4-column fluid grid is used, transitioning to 8 columns for tablets.

- **Margins:** Standard 16px horizontal margins for mobile ensure content doesn't feel cramped against the screen edge.
- **Vertical Rhythm:** Elements are stacked using increments of 8px. Use 16px between related items (like images in a list) and 24px between distinct sections.
- **Touch Targets:** All interactive elements must maintain a minimum 48x48dp area to ensure accessibility on the go.

## Elevation & Depth

This design system uses **Tonal Layers** as the primary method of showing depth, supplemented by very soft, diffused shadows.

- **Level 0 (Surface):** The background color (#FBFCFF).
- **Level 1 (Container):** Subtle separation using the Secondary color (#E1E2EC) with no shadow. Used for list items or inactive cards.
- **Level 2 (Elevated):** White cards with a 4% opacity black shadow (8px blur, 2px offset). Used for primary interactive modules like "File Selected."
- **Level 3 (Interactive):** Floating Action Buttons (FABs) use a 12% opacity shadow to signify they sit highest in the stack.

Avoid heavy borders; use light gray (#E0E0E0) hairlines only when tonal separation is insufficient.

## Shapes

The shape language is **Rounded**, following the M3 "Extra Large" corner radius philosophy for primary containers to maximize the "friendly" feel.

- **Small Components (Checkboxes, Tooltips):** 4px radius.
- **Medium Components (Buttons, Input Fields):** 8px - 12px radius.
- **Large Components (Cards, Bottom Sheets):** 16px - 24px radius.
- **Full Round:** Used exclusively for Floating Action Buttons and toggle tracks.

## Components

### Buttons
- **Primary:** Filled with #0061A4, white text. High roundedness (12px).
- **Secondary:** Outlined with Primary Blue or Tonal with #E1E2EC background.
- **FAB:** Large, circular or rounded-square (M3 style) for the "Convert" action.

### Cards & File Items
- File preview cards should have 16px rounded corners.
- Use a "Glassmorphism" overlay for progress bars on top of image thumbnails during the conversion process.

### Input Fields
- Filled style with a thick bottom stroke or fully outlined with 8px radius. 
- Use the Primary color for the label and stroke when focused to indicate activity.

### Chips
- Use for file format selection (e.g., "to PDF", "to PNG"). 
- Active state: Primary color background with white text.
- Inactive state: Secondary color background with Tertiary text.

### Progress Indicators
- Use a linear progress bar for file uploads and a circular determinate spinner for conversion processing. Use the Primary Blue for the "fill."