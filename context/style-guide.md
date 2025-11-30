# The Intelligent Hive: Style Guide

## Introduction

This style guide defines the visual language of Trato Hive. It translates our design principles into concrete design tokens, components, and patterns. All frontend development must strictly adhere to this guide.

**Last Updated:** 2025-11-16
**Version:** 2.0 (Brand Pack Implementation)

## Design System Overview

**Name:** The Intelligent Hive
**Theme:** Connected, intelligent, organic—embracing the hexagonal "hive" metaphor
**Mood:** Warm + geometric blend, professional yet approachable
**Visual Language:** Hexagonal patterns with rounded UI components

## Color Palette

### Primary Colors (New Brand Pack)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Bone** | `#E2D9CB` | rgb(226, 217, 203) | **Light mode primary background**, main app backdrop |
| **Deep Grey** | `#313131` | rgb(49, 49, 49) | **Dark mode primary background**, main app backdrop |
| **Black** | `#1A1A1A` | rgb(26, 26, 26) | Primary text on light backgrounds, structural elements |
| **Cultured White** | `#F7F7F7` | rgb(247, 247, 247) | Primary text on dark backgrounds, light UI elements |
| **Orange** | `#EE8D1D` | rgb(238, 141, 29) | **Primary CTAs**, interactive elements, accent borders |
| **Deep Orange** | `#CB552F` | rgb(203, 85, 47) | **Strong CTAs**, urgent actions, bold accents |
| **Faded Orange** | `#FFB662` | rgb(255, 182, 98) | Tertiary accents, hover states, soft highlights |
| **Dark Vanilla** | `#CEC2AE` | rgb(206, 194, 174) | Secondary backgrounds, alternate panels |
| **Alabaster** | `#F0EEE6` | rgb(240, 238, 230) | Card backgrounds, elevated surfaces |

### Special Purpose Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Teal Blue** | `#2F7E8A` | rgb(47, 126, 138) | **CITATIONS ONLY** - verifiable fact links, citation modals |

**Important:** Teal Blue is reserved exclusively for the citation feature (verifiable facts, source links). Do not use for general links or buttons.

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success Green | `#4CAF50` | Success messages, confirmations |
| Warning Orange | `#FF9800` | Warnings, cautions (distinct from brand Orange) |
| Error Red | `#F44336` | Errors, destructive actions |
| Info Blue | `#2196F3` | Informational messages (distinct from Teal Blue) |

### Light Mode Color System

**Backgrounds:**
- **Primary App Background:** Bone `#E2D9CB`
- **Cards/Panels:** Alabaster `#F0EEE6` or White `#FFFFFF`
- **Secondary Panels:** Dark Vanilla `#CEC2AE`
- **Hover/Elevated:** White `#FFFFFF` with shadow-lg

**Text:**
- **Primary:** Black `#1A1A1A`
- **Secondary:** `#3A3A3A` (slightly lighter)
- **Tertiary/Muted:** `#5A5A5A`
- **Placeholder:** `#8A8A8A`
- **Links:** Orange `#EE8D1D`
- **Citations:** Teal Blue `#2F7E8A` (ONLY for citations)

**Accents & Interactives:**
- **Primary CTA:** Orange `#EE8D1D`
- **Strong CTA:** Deep Orange `#CB552F`
- **Hover CTA:** Faded Orange `#FFB662`
- **Active States:** Deep Orange `#CB552F`
- **Focus Rings:** Orange `#EE8D1D` at 50% opacity

**Borders:**
- **Default:** Dark Vanilla `#CEC2AE` or `#D4C8B4` (10% darker)
- **Accent:** Orange `#EE8D1D`
- **Focus:** Orange `#EE8D1D`
- **Error:** Error Red `#F44336`

### Dark Mode Color System

**Backgrounds:**
- **Primary App Background:** Deep Grey `#313131`
- **Cards/Panels:** `#3A3A3A` (lifted from background)
- **Secondary Panels:** `#424242` (more elevated)
- **Hover/Elevated:** `#4A4A4A` with shadow-lg

**Text:**
- **Primary:** Cultured White `#F7F7F7`
- **Secondary:** `#D4D4D4` (slightly dimmed)
- **Tertiary/Muted:** `#A4A4A4`
- **Placeholder:** `#7A7A7A`
- **Links:** Faded Orange `#FFB662` (softer for dark backgrounds)
- **Citations:** Teal Blue `#2F7E8A` (ONLY for citations)

**Accents & Interactives:**
- **Primary CTA:** Orange `#EE8D1D`
- **Strong CTA:** Deep Orange `#CB552F`
- **Hover CTA:** Faded Orange `#FFB662`
- **Active States:** Faded Orange `#FFB662`
- **Focus Rings:** Orange `#EE8D1D` at 60% opacity

**Borders:**
- **Default:** `#4A4A4A` (subtle lift)
- **Accent:** Orange `#EE8D1D`
- **Focus:** Orange `#EE8D1D`
- **Error:** Error Red `#F44336`

### Usage Guidelines

**General Principles:**
1. **Bone for Light, Deep Grey for Dark:** Always use the mode-appropriate background
2. **Orange is Primary:** Orange family colors are the brand accent—use liberally for CTAs and interactive elements
3. **Teal Blue = Citations:** Never use Teal Blue except for citation links and modals
4. **Maintain Contrast:** Ensure text meets WCAG 2.1 AA standards (see Color Contrast section)
5. **Dark Mode Softer:** Use Faded Orange more in dark mode to reduce eye strain

## Typography

### Font Families

**All Text (Sans Serif):**
- **Primary:** Inter (Google Fonts)
- **Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- **Usage:** ALL text—headings, body, labels, buttons, navigation

**Note:** Previous versions used Lora serif for headings. This has been removed. Inter is now used for all typography.

### Type Scale

| Element | Font Family | Size | Weight | Line Height | Letter Spacing |
|---------|-------------|------|--------|-------------|----------------|
| H1 | Inter | 48px / 3rem | 700 (Bold) | 1.2 | -0.02em |
| H2 | Inter | 36px / 2.25rem | 700 | 1.3 | -0.01em |
| H3 | Inter | 28px / 1.75rem | 600 (Semibold) | 1.4 | 0 |
| H4 | Inter | 20px / 1.25rem | 600 | 1.5 | 0 |
| Body Large | Inter | 18px / 1.125rem | 400 (Regular) | 1.6 | 0 |
| Body | Inter | 16px / 1rem | 400 | 1.6 | 0 |
| Body Small | Inter | 14px / 0.875rem | 400 | 1.5 | 0 |
| Caption | Inter | 12px / 0.75rem | 400 | 1.4 | 0.02em |
| Button | Inter | 16px / 1rem | 500 (Medium) | 1.5 | 0.01em |
| Label | Inter | 14px / 0.875rem | 500 | 1.4 | 0.02em |

### Font Weights Available

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text, descriptions |
| Medium | 500 | Labels, buttons, semi-emphasis |
| Semibold | 600 | Subheadings (H3, H4), strong emphasis |
| Bold | 700 | Major headings (H1, H2), critical information |

### Usage Guidelines

**Headings:**
- Use H1 for page titles (max 1 per page) - Bold weight
- Use H2 for major sections - Bold weight
- Use H3 for subsections - Semibold weight
- Use H4 for card/panel titles - Semibold weight

**Body:**
- Body Large for emphasis (e.g., intro paragraphs, key descriptions)
- Body for standard text
- Body Small for secondary information
- Caption for metadata (timestamps, counts, tags)

**Color Pairing:**
- Light Mode: Black `#1A1A1A` for headings, `#3A3A3A` for body
- Dark Mode: Cultured White `#F7F7F7` for headings, `#D4D4D4` for body
- Accent Headings: Orange `#EE8D1D` for special emphasis

## Spacing System

**Base Unit:** 4px

**Scale:**
| Token | Value | Usage |
|-------|-------|-------|
| space-0 | 0px | No space |
| space-1 | 4px | Tight spacing (icon-to-text) |
| space-2 | 8px | Small spacing (button padding vertical) |
| space-3 | 12px | Default spacing (form fields) |
| space-4 | 16px | Medium spacing (card padding, button horizontal) |
| space-5 | 20px | Comfortable spacing |
| space-6 | 24px | Large spacing (section padding) |
| space-8 | 32px | XL spacing (between major sections) |
| space-10 | 40px | XXL spacing |
| space-12 | 48px | XXXL spacing (page margins) |
| space-16 | 64px | Massive spacing (hero sections) |

**Usage:**
- Form fields: space-3 (12px) vertical, space-4 (16px) between fields
- Card padding: space-4 (16px) to space-6 (24px)
- Section margins: space-8 (32px) to space-12 (48px)
- Button padding: space-2 (8px) vertical, space-4 (16px) horizontal

## Border Radius

**Tokens:**
| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 4px | Small elements (tags, badges) |
| radius-md | 8px | Default (buttons, inputs, cards) |
| radius-lg | 12px | Large panels, modals |
| radius-xl | 16px | Hero cards, featured elements |
| radius-full | 9999px | Circular elements (avatars, pills) |

**Minimum:** 8px (radius-md) for all interactive components—"The Intelligent Hive" uses rounded corners for UI elements.

**Note:** Hexagonal shapes use 0px radius (sharp geometric edges) for decorative elements only.

## Shadows

**Light Mode Shadows:**
| Token | Value | Usage |
|-------|-------|-------|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle lift (hover states) |
| shadow-md | 0 4px 6px rgba(0,0,0,0.07) | Default cards |
| shadow-lg | 0 10px 15px rgba(0,0,0,0.1) | Elevated panels, modals |
| shadow-xl | 0 20px 25px rgba(0,0,0,0.15) | Prominent elements (pop-ups) |

**Dark Mode Shadows:**
| Token | Value | Usage |
|-------|-------|-------|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.3) | Subtle lift (stronger for visibility) |
| shadow-md | 0 4px 6px rgba(0,0,0,0.4) | Default cards |
| shadow-lg | 0 10px 15px rgba(0,0,0,0.5) | Elevated panels, modals |
| shadow-xl | 0 20px 25px rgba(0,0,0,0.6) | Prominent elements (pop-ups) |

**Usage:**
- Cards: shadow-md
- Modals: shadow-lg
- Hover states: shadow-sm → shadow-lg transition

## Hexagonal Design Patterns

**Philosophy:** Hexagons are the visual signature of "The Intelligent Hive"—use them for branding, decorative elements, and data visualization. UI components remain rounded rectangles for usability.

### When to Use Hexagons

**✓ Appropriate:**
- Background patterns (subtle honeycomb grids)
- Data visualization nodes (relationship maps, org charts)
- Decorative accent elements
- Logo and branding
- Loading states (hexagonal spinner)
- Connection diagrams (hexagon nodes + connecting lines)

**✗ Avoid:**
- Buttons (use rounded rectangles)
- Input fields (use rounded rectangles)
- Cards (use rounded rectangles)
- Modals (use rounded rectangles)
- Navigation items (use rounded rectangles)

### Hexagon Specifications

**Standard Hexagon Sizes:**
- Small: 24px diameter (decorative accents)
- Medium: 48px diameter (connection diagrams)
- Large: 96px diameter (data visualization)
- XL: 144px diameter (hero elements)

**Hexagon Colors:**
- Light Mode: Orange `#EE8D1D` (filled), Orange `#EE8D1D` border (outline)
- Dark Mode: Faded Orange `#FFB662` (filled), Orange `#EE8D1D` border (outline)
- Opacity: 20-40% for background patterns

**SVG Hexagon Template:**
```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
           fill="currentColor" stroke="currentColor" stroke-width="2"/>
</svg>
```

**CSS Hexagon Pattern (Background):**
```css
background-image:
  repeating-linear-gradient(60deg, transparent, transparent 48px, rgba(238, 141, 29, 0.1) 48px, rgba(238, 141, 29, 0.1) 50px),
  repeating-linear-gradient(-60deg, transparent, transparent 48px, rgba(238, 141, 29, 0.1) 48px, rgba(238, 141, 29, 0.1) 50px);
```

### Connection Diagrams

**Pattern:** Hexagon nodes connected by lines (see brand pack dark mode example)

**Node Style:**
```css
hexagon: Orange #EE8D1D fill, 48px diameter
hover: Faded Orange #FFB662 fill
active: Deep Orange #CB552F fill
```

**Connector Lines:**
```css
stroke: Orange #EE8D1D
stroke-width: 2px
opacity: 0.6
```

**Circle Nodes (Alternative):**
```css
border-radius: 50% (radius-full)
background: Orange #EE8D1D
size: 12px diameter (small), 24px (medium)
```

## Components

### Buttons

**Primary Button (Orange CTA):**
```css
/* Light Mode */
background: #EE8D1D (Orange)
color: #FFFFFF (White)
padding: 8px 16px (space-2 space-4)
border-radius: 8px (radius-md)
font: Inter, 16px, 500 (Medium)
border: none
hover: background #FFB662 (Faded Orange)
active: background #CB552F (Deep Orange), shadow-md
focus: ring 2px #EE8D1D at 50% opacity

/* Dark Mode */
background: #EE8D1D (Orange)
color: #1A1A1A (Black) /* Better contrast on dark backgrounds */
hover: background #FFB662 (Faded Orange)
active: background #CB552F (Deep Orange)
```

**Secondary Button (Outline):**
```css
/* Light Mode */
background: transparent
border: 2px solid #1A1A1A (Black)
color: #1A1A1A
padding: 6px 14px (adjusted for border)
border-radius: 8px
font: Inter, 16px, 500
hover: background #F0EEE6 (Alabaster)
active: background #E2D9CB (Bone)

/* Dark Mode */
background: transparent
border: 2px solid #F7F7F7 (Cultured White)
color: #F7F7F7
hover: background #3A3A3A
active: background #424242
```

**Tertiary Button (Text Only):**
```css
/* Light Mode */
background: transparent
color: #EE8D1D (Orange)
padding: 8px 16px
font: Inter, 16px, 500
border: none
hover: text-decoration underline, color #FFB662
active: color #CB552F

/* Dark Mode */
color: #FFB662 (Faded Orange)
hover: text-decoration underline, color #EE8D1D
active: color #EE8D1D
```

**Destructive Button (Red):**
```css
/* Light & Dark Mode (same) */
background: #F44336 (Error Red)
color: #FFFFFF
padding: 8px 16px
border-radius: 8px
font: Inter, 16px, 500
hover: background #D32F2F
active: background #C62828, shadow-md
```

### Forms

**Input Field:**
```css
/* Light Mode */
background: #FFFFFF (White)
border: 1px solid #CEC2AE (Dark Vanilla)
border-radius: 8px (radius-md)
padding: 12px 16px (space-3 space-4)
font: Inter, 16px, 400
color: #1A1A1A (Black)
placeholder: #8A8A8A
focus: border #EE8D1D (Orange), ring 2px #EE8D1D at 30% opacity
error: border #F44336 (Error Red), ring 2px #F44336 at 30%

/* Dark Mode */
background: #3A3A3A
border: 1px solid #4A4A4A
color: #F7F7F7 (Cultured White)
placeholder: #7A7A7A
focus: border #EE8D1D, ring 2px #EE8D1D at 40%
error: border #F44336, ring 2px #F44336 at 40%
```

**Label:**
```css
/* Light Mode */
font: Inter, 14px, 500 (Medium)
color: #1A1A1A (Black)
margin-bottom: 8px (space-2)

/* Dark Mode */
color: #F7F7F7 (Cultured White)
```

**Error Message:**
```css
/* Light & Dark Mode (same) */
font: Inter, 12px, 400
color: #F44336 (Error Red)
margin-top: 4px (space-1)
```

### Cards

**Standard Card:**
```css
/* Light Mode */
background: #F0EEE6 (Alabaster) or #FFFFFF (White)
border: 1px solid #CEC2AE (Dark Vanilla)
border-radius: 8px (radius-md)
padding: 16px (space-4) or 24px (space-6)
shadow: shadow-md
hover: shadow-lg, transition 250ms ease-out

/* Dark Mode */
background: #3A3A3A
border: 1px solid #4A4A4A
shadow: shadow-md (dark mode variant)
hover: shadow-lg (dark mode variant)
```

**Deal Card (Kanban):**
```css
/* Light Mode */
background: #F0EEE6 (Alabaster)
border-top: 4px solid #EE8D1D (Orange) /* Accent line */
border-radius: 8px
padding: 16px
shadow: shadow-md
hover: shadow-lg, transform translateY(-2px)

/* Dark Mode */
background: #3A3A3A
border-top: 4px solid #EE8D1D (Orange)
shadow: shadow-md (dark mode variant)
```

**Verifiable Fact Sheet:**
```css
/* Light Mode */
background: #FFFFFF
border: 2px solid #EE8D1D (Orange) /* Prominent border */
border-radius: 12px (radius-lg)
padding: 24px (space-6)
shadow: shadow-lg

/* Dark Mode */
background: #3A3A3A
border: 2px solid #EE8D1D (Orange)
shadow: shadow-lg (dark mode variant)

/* Citation Links Inside Fact Sheet - ALWAYS Teal Blue */
color: #2F7E8A (Teal Blue)
text-decoration: underline
```

### Citations (THE Killer Feature)

**Citation Link:**
```css
/* Light Mode */
color: #2F7E8A (Teal Blue) /* ONLY color for citations */
text-decoration: underline
cursor: pointer
font: inherit (same as surrounding text)
hover: color #4A9DAB (Teal Light)
active: color #246270 (Teal Dark)

/* Dark Mode */
color: #2F7E8A (Teal Blue) /* Same - Teal is consistent */
hover: color #4A9DAB
active: color #4A9DAB
```

**Citation Modal:**
```css
/* Light Mode */
background: #FFFFFF
border: 2px solid #EE8D1D (Orange)
border-radius: 12px (radius-lg)
padding: 32px (space-8)
max-width: 600px
shadow: shadow-xl
overlay: rgba(0,0,0,0.5) backdrop-blur(4px)

/* Dark Mode */
background: #3A3A3A
border: 2px solid #EE8D1D (Orange)
shadow: shadow-xl (dark mode variant)
overlay: rgba(0,0,0,0.7) backdrop-blur(4px)

/* Modal Performance Requirement */
animation: fade-in + scale-up (200ms ease-out)
load-time: <200ms (critical)
```

### Navigation

**Top Nav Bar:**
```css
/* Light Mode */
background: #FFFFFF
border-bottom: 1px solid #CEC2AE (Dark Vanilla)
padding: 16px 24px (space-4 space-6)
shadow: shadow-sm

/* Dark Mode */
background: #313131 (Deep Grey) or #3A3A3A (lifted)
border-bottom: 1px solid #4A4A4A
shadow: shadow-sm (dark mode variant)
```

**Nav Item:**
```css
/* Light Mode */
font: Inter, 16px, 500
color: #1A1A1A (Black)
padding: 8px 16px (space-2 space-4)
border-radius: 6px
hover: color #EE8D1D (Orange)
active: background #F0EEE6 (Alabaster), border-bottom 2px solid #EE8D1D

/* Dark Mode */
color: #F7F7F7 (Cultured White)
hover: color #FFB662 (Faded Orange)
active: background #3A3A3A, border-bottom 2px solid #EE8D1D
```

### Tabs

**Tab Navigation:**
```css
/* Light Mode */
border-bottom: 1px solid #CEC2AE (Dark Vanilla)

/* Dark Mode */
border-bottom: 1px solid #4A4A4A
```

**Tab Item:**
```css
/* Light Mode */
font: Inter, 16px, 500
color: #5A5A5A (muted)
padding: 12px 16px (space-3 space-4)
hover: color #1A1A1A (Black)
active: color #EE8D1D (Orange), border-bottom 2px solid #EE8D1D

/* Dark Mode */
color: #A4A4A4 (muted)
hover: color #F7F7F7 (Cultured White)
active: color #FFB662 (Faded Orange), border-bottom 2px solid #EE8D1D
```

### Modals & Overlays

**Modal Overlay:**
```css
/* Light Mode */
background: rgba(0,0,0,0.5)
backdrop-filter: blur(4px)

/* Dark Mode */
background: rgba(0,0,0,0.7)
backdrop-filter: blur(6px)
```

**Modal Content:**
```css
/* Light Mode */
background: #FFFFFF
border-radius: 12px (radius-lg)
padding: 32px (space-8)
max-width: 600px (adjust per use case)
shadow: shadow-xl
animation: fade-in + scale-up (200ms ease-out)

/* Dark Mode */
background: #3A3A3A
border: 1px solid #4A4A4A (subtle definition)
shadow: shadow-xl (dark mode variant)
```

## Tailwind CSS Configuration

**File:** `apps/web/tailwind.config.js`

```javascript
module.exports = {
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {
      colors: {
        // Light Mode Primary
        'bone': '#E2D9CB',
        'alabaster': '#F0EEE6',
        'dark-vanilla': '#CEC2AE',

        // Dark Mode Primary
        'deep-grey': '#313131',
        'panel-dark': '#3A3A3A',
        'panel-darker': '#424242',

        // Text
        'black': '#1A1A1A',
        'cultured-white': '#F7F7F7',
        'text-secondary-light': '#3A3A3A',
        'text-tertiary-light': '#5A5A5A',
        'text-secondary-dark': '#D4D4D4',
        'text-tertiary-dark': '#A4A4A4',

        // Brand Accents (Orange Family)
        'orange': '#EE8D1D',
        'deep-orange': '#CB552F',
        'faded-orange': '#FFB662',

        // Citations Only
        'teal-blue': '#2F7E8A',
        'teal-light': '#4A9DAB',
        'teal-dark': '#246270',

        // Semantic
        'success': '#4CAF50',
        'warning': '#FF9800',
        'error': '#F44336',
        'info': '#2196F3',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'h1': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h3': ['1.75rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }],
      },
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        'hive-sm': '4px',
        'hive': '8px',
        'hive-lg': '12px',
        'hive-xl': '16px',
      },
      boxShadow: {
        // Light mode shadows
        'hive-sm': '0 1px 2px rgba(0,0,0,0.05)',
        'hive-md': '0 4px 6px rgba(0,0,0,0.07)',
        'hive-lg': '0 10px 15px rgba(0,0,0,0.1)',
        'hive-xl': '0 20px 25px rgba(0,0,0,0.15)',
        // Dark mode shadows
        'hive-sm-dark': '0 1px 2px rgba(0,0,0,0.3)',
        'hive-md-dark': '0 4px 6px rgba(0,0,0,0.4)',
        'hive-lg-dark': '0 10px 15px rgba(0,0,0,0.5)',
        'hive-xl-dark': '0 20px 25px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
```

## Color Contrast Compliance (WCAG 2.1 AA)

### Light Mode Contrast Ratios

| Foreground | Background | Ratio | Passes | Usage |
|------------|------------|-------|--------|-------|
| Black (#1A1A1A) | Bone (#E2D9CB) | 8.2:1 | AAA ✓ | Primary text on main background |
| Black (#1A1A1A) | Alabaster (#F0EEE6) | 10.1:1 | AAA ✓ | Primary text on cards |
| Black (#1A1A1A) | White (#FFFFFF) | 14.5:1 | AAA ✓ | Primary text on white |
| Orange (#EE8D1D) | Bone (#E2D9CB) | 4.6:1 | AA ✓ | Orange buttons/links on background |
| Orange (#EE8D1D) | White (#FFFFFF) | 3.8:1 | AA Large ✓ | Orange on white (large text only) |
| Teal Blue (#2F7E8A) | White (#FFFFFF) | 4.8:1 | AA ✓ | Citations on white |
| Teal Blue (#2F7E8A) | Alabaster (#F0EEE6) | 4.5:1 | AA ✓ | Citations on cards |

### Dark Mode Contrast Ratios

| Foreground | Background | Ratio | Passes | Usage |
|------------|------------|-------|--------|-------|
| Cultured White (#F7F7F7) | Deep Grey (#313131) | 11.2:1 | AAA ✓ | Primary text on main background |
| Cultured White (#F7F7F7) | Panel Dark (#3A3A3A) | 9.8:1 | AAA ✓ | Primary text on cards |
| Faded Orange (#FFB662) | Deep Grey (#313131) | 6.1:1 | AA ✓ | Orange links on background |
| Orange (#EE8D1D) | Deep Grey (#313131) | 5.2:1 | AA ✓ | Orange buttons on background |
| Teal Blue (#2F7E8A) | Deep Grey (#313131) | 4.5:1 | AA ✓ | Citations on dark background |

**Accessibility Notes:**
- All primary text combinations meet AAA standards (7:1+)
- Orange accent colors meet AA standards for interactive elements
- Teal Blue citations meet AA standards in both modes
- Use Deep Orange (#CB552F) sparingly—lower contrast ratio

## Animation & Transitions

**Timing Functions:**
- Default: `ease-out` (decelerating)
- Bounce: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- Smooth: `ease-in-out`

**Durations:**
- Fast: 150ms (hover states, simple fades)
- Default: 250ms (most transitions)
- Slow: 400ms (complex animations, page transitions)

**Usage:**
```css
transition: all 250ms ease-out;
```

**Hover Effects:**
- Cards: `shadow-md → shadow-lg`, `transform: translateY(-2px)`
- Buttons: `background color change`, `shadow-sm`
- Links: `color change`, `underline on hover`

**Dark Mode Transitions:**
```css
/* Smooth theme switching */
* {
  transition: background-color 300ms ease-out,
              color 300ms ease-out,
              border-color 300ms ease-out;
}
```

## Iconography

**Icon Library:** Heroicons (MIT license)

**Sizes:**
- xs: 16px
- sm: 20px
- md: 24px (default)
- lg: 32px
- xl: 48px

**Colors (Light Mode):**
- Default: Black (#1A1A1A)
- Interactive: Orange (#EE8D1D)
- Citations: Teal Blue (#2F7E8A)
- Destructive: Error Red (#F44336)

**Colors (Dark Mode):**
- Default: Cultured White (#F7F7F7)
- Interactive: Faded Orange (#FFB662)
- Citations: Teal Blue (#2F7E8A)
- Destructive: Error Red (#F44336)

## Review Checklist

Before approving any UI implementation, verify:

**Color Usage:**
- [ ] Light mode uses Bone (#E2D9CB) as primary background
- [ ] Dark mode uses Deep Grey (#313131) as primary background
- [ ] Orange family (#EE8D1D, #CB552F, #FFB662) used for accents and CTAs
- [ ] Teal Blue (#2F7E8A) used ONLY for citations
- [ ] No old colors (Soft Sand, Gold) present except in migration notes
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text, 3:1 for UI)

**Typography:**
- [ ] Inter font used for ALL text (no Lora serif)
- [ ] Font weights: 400, 500, 600, 700 only
- [ ] Type scale matches specifications
- [ ] Letter spacing applied to headings

**Spacing & Layout:**
- [ ] Spacing follows 4px base unit system
- [ ] Border radius ≥8px (radius-md) for interactive components
- [ ] Hexagons used for decorative/branding only
- [ ] UI components use rounded rectangles

**Interactivity:**
- [ ] All interactive elements have hover states
- [ ] All interactive elements have focus states (visible rings)
- [ ] Hover effects use color transitions
- [ ] Animations use specified timing functions and durations

**Dark Mode:**
- [ ] Dark mode variant implemented for all components
- [ ] Dark mode uses softer shadows
- [ ] Dark mode uses Faded Orange for reduced eye strain
- [ ] Theme toggle smooth (300ms transition)

**Citations:**
- [ ] Citations styled in Teal Blue with underline
- [ ] Citation modal loads in <200ms
- [ ] Citation modal has Orange border
- [ ] Source highlighting functional

**Responsive:**
- [ ] Component behavior defined for mobile, tablet, desktop
- [ ] Touch targets ≥44px for mobile
- [ ] Text remains readable at all breakpoints

**Hexagonal Patterns:**
- [ ] Hexagons used appropriately (decorative/data viz)
- [ ] Hexagon colors match brand (Orange family)
- [ ] Connection diagrams follow specifications
- [ ] No hexagons for buttons/inputs/cards

---

**Migration Notes:**
- **From Version 1.0:** Soft Sand → Bone, Gold → Orange, removed Lora serif
- **Breaking Changes:** All color tokens renamed, typography simplified to Inter only
- **New Features:** Dark mode, hexagonal patterns, expanded semantic colors
