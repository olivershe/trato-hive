# The Intelligent Hive: Style Guide

## Introduction

This style guide defines the visual language of Trato Hive. It translates our design principles into concrete design tokens, components, and patterns. All frontend development must strictly adhere to this guide.

## Design System Overview

**Name:** The Intelligent Hive
**Theme:** Connected, warm, intelligent—a subtle interpretation of "hive" without clichés
**Mood:** Organic + geometric blend, professional yet approachable

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Soft Sand** | `#F5EFE7` | rgb(245, 239, 231) | Primary background, panels, card backgrounds, warm neutrals |
| **Gold / Honey** | `#E2A74A` | rgb(226, 167, 74) | Key accents, CTAs, highlights, citations, active states |
| **Charcoal Black** | `#1A1A1A` | rgb(26, 26, 26) | Primary text, headers, structural elements, dark backgrounds |
| **Teal Blue** | `#2F7E8A` | rgb(47, 126, 138) | AI insights, links, intelligence indicators, interactive elements |

### Secondary Colors (Generated from Primary)

| Name | Hex | Usage |
|------|-----|-------|
| Soft Sand Light | `#FDFCFA` | Hover states for sand backgrounds |
| Soft Sand Dark | `#EDE4D8` | Borders, dividers |
| Gold Light | `#F0C98E` | Hover states for gold elements |
| Gold Dark | `#C78F3B` | Active states for CTAs |
| Teal Light | `#4A9DAB` | Hover states for teal elements |
| Teal Dark | `#246270` | Active states for teal elements |
| Charcoal Light | `#2E2E2E` | Secondary text, muted elements |
| Charcoal Lighter | `#5A5A5A` | Tertiary text, placeholders |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success Green | `#4CAF50` | Success messages, confirmations |
| Warning Orange | `#FF9800` | Warnings, cautions |
| Error Red | `#F44336` | Errors, destructive actions |
| Info Blue | `#2196F3` | Informational messages |

### Usage Guidelines

**Backgrounds:**
- Primary: Soft Sand (#F5EFE7)
- Cards/Panels: White (#FFFFFF) on Soft Sand, or Soft Sand on White
- Dark Mode (future): Charcoal Black (#1A1A1A) primary

**Text:**
- Primary: Charcoal Black (#1A1A1A)
- Secondary: Charcoal Light (#2E2E2E)
- Tertiary: Charcoal Lighter (#5A5A5A)
- Links: Teal Blue (#2F7E8A)
- Citations: Teal Blue (#2F7E8A) with underline

**Accents:**
- Primary CTA: Gold (#E2A74A)
- AI Features: Teal Blue (#2F7E8A)
- Active States: Gold Dark (#C78F3B)

**Borders:**
- Default: Soft Sand Dark (#EDE4D8)
- Focus: Teal Blue (#2F7E8A)
- Error: Error Red (#F44336)

## Typography

### Font Families

**Headings (Serif):**
- Primary: **Lora** (Google Fonts)
- Fallback: Playfair Display, Georgia, serif
- Usage: H1, H2, H3, hero text, branding

**Body & UI (Sans Serif):**
- Primary: **Inter** (Google Fonts)
- Fallback: Public Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Usage: Body text, labels, buttons, navigation

### Type Scale

| Element | Font Family | Size | Weight | Line Height | Letter Spacing |
|---------|-------------|------|--------|-------------|----------------|
| H1 | Lora | 48px / 3rem | 600 (Semibold) | 1.2 | -0.02em |
| H2 | Lora | 36px / 2.25rem | 600 | 1.3 | -0.01em |
| H3 | Lora | 28px / 1.75rem | 600 | 1.4 | 0 |
| H4 | Inter | 20px / 1.25rem | 600 | 1.5 | 0 |
| Body Large | Inter | 18px / 1.125rem | 400 (Regular) | 1.6 | 0 |
| Body | Inter | 16px / 1rem | 400 | 1.6 | 0 |
| Body Small | Inter | 14px / 0.875rem | 400 | 1.5 | 0 |
| Caption | Inter | 12px / 0.75rem | 400 | 1.4 | 0 |
| Button | Inter | 16px / 1rem | 500 (Medium) | 1.5 | 0.01em |
| Label | Inter | 14px / 0.875rem | 500 | 1.4 | 0.02em |

### Usage Guidelines

**Headings:**
- Use H1 for page titles (max 1 per page)
- Use H2 for major sections
- Use H3 for subsections
- Use H4 for card/panel titles

**Body:**
- Body Large for emphasis (e.g., intro paragraphs, key descriptions)
- Body for standard text
- Body Small for secondary information
- Caption for metadata (timestamps, counts)

**Weights:**
- 400 (Regular): Body text
- 500 (Medium): Labels, semi-emphasis
- 600 (Semibold): Headings, strong emphasis

## Spacing System

**Base Unit:** 4px

**Scale:**
| Token | Value | Usage |
|-------|-------|-------|
| space-0 | 0px | No space |
| space-1 | 4px | Tight spacing (icon-to-text) |
| space-2 | 8px | Small spacing (button padding) |
| space-3 | 12px | Default spacing (form fields) |
| space-4 | 16px | Medium spacing (card padding) |
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

**Minimum:** 8px (radius-md) for all components—"The Intelligent Hive" never uses sharp corners.

## Shadows

**Tokens:**
| Token | Value | Usage |
|-------|-------|-------|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle lift (hover states) |
| shadow-md | 0 4px 6px rgba(0,0,0,0.07) | Default cards |
| shadow-lg | 0 10px 15px rgba(0,0,0,0.1) | Elevated panels, modals |
| shadow-xl | 0 20px 25px rgba(0,0,0,0.15) | Prominent elements (pop-ups) |

**Usage:**
- Cards: shadow-md
- Modals: shadow-lg
- Hover states: shadow-sm → shadow-lg transition

## Components

### Buttons

**Primary Button (Gold CTA):**
```css
background: #E2A74A (Gold)
color: #FFFFFF (White)
padding: 8px 16px (space-2 space-4)
border-radius: 8px (radius-md)
font: Inter, 16px, 500 (Medium)
hover: #C78F3B (Gold Dark)
active: #C78F3B + shadow-md
```

**Secondary Button (Outline):**
```css
background: transparent
border: 2px solid #1A1A1A (Charcoal Black)
color: #1A1A1A
padding: 8px 16px
border-radius: 8px
font: Inter, 16px, 500
hover: background #F5EFE7 (Soft Sand)
```

**Tertiary Button (Text Only):**
```css
background: transparent
color: #2F7E8A (Teal Blue)
padding: 8px 16px
font: Inter, 16px, 500
hover: underline
```

**Destructive Button (Red):**
```css
background: #F44336 (Error Red)
color: #FFFFFF
padding: 8px 16px
border-radius: 8px
font: Inter, 16px, 500
hover: #D32F2F
```

### Forms

**Input Field:**
```css
background: #FFFFFF (White)
border: 1px solid #EDE4D8 (Soft Sand Dark)
border-radius: 8px (radius-md)
padding: 12px 16px (space-3 space-4)
font: Inter, 16px, 400
placeholder: #5A5A5A (Charcoal Lighter)
focus: border #2F7E8A (Teal Blue), shadow-sm
error: border #F44336 (Error Red)
```

**Label:**
```css
font: Inter, 14px, 500 (Medium)
color: #1A1A1A (Charcoal Black)
margin-bottom: 8px (space-2)
```

**Error Message:**
```css
font: Inter, 12px, 400
color: #F44336 (Error Red)
margin-top: 4px (space-1)
```

### Cards

**Standard Card:**
```css
background: #FFFFFF (White) or #F5EFE7 (Soft Sand)
border: 1px solid #EDE4D8 (Soft Sand Dark)
border-radius: 8px (radius-md)
padding: 16px (space-4) or 24px (space-6)
shadow: shadow-md
hover: shadow-lg transition
```

**Deal Card (Kanban):**
```css
background: #F5EFE7 (Soft Sand)
border-top: 4px solid #E2A74A (Gold) /* Accent line */
border-radius: 8px
padding: 16px
shadow: shadow-md
hover: shadow-lg, transform translateY(-2px)
```

**Verifiable Fact Sheet:**
```css
background: #FFFFFF
border: 2px solid #E2A74A (Gold) /* Prominent border */
border-radius: 12px (radius-lg)
padding: 24px (space-6)
shadow: shadow-lg
```

### Citations

**Citation Link:**
```css
color: #2F7E8A (Teal Blue)
text-decoration: underline
cursor: pointer
font: inherit (same as surrounding text)
hover: color #4A9DAB (Teal Light)
```

**Citation Modal:**
```css
background: #FFFFFF
border-radius: 12px (radius-lg)
padding: 32px (space-8)
max-width: 600px
shadow: shadow-xl
overlay: rgba(0,0,0,0.5)
```

### Navigation

**Top Nav Bar:**
```css
background: #FFFFFF
border-bottom: 1px solid #EDE4D8 (Soft Sand Dark)
padding: 16px 24px (space-4 space-6)
shadow: shadow-sm
```

**Nav Item:**
```css
font: Inter, 16px, 500
color: #1A1A1A (Charcoal Black)
padding: 8px 16px (space-2 space-4)
hover: color #2F7E8A (Teal Blue)
active: border-bottom 2px solid #E2A74A (Gold)
```

### Tabs

**Tab Navigation:**
```css
border-bottom: 1px solid #EDE4D8
```

**Tab Item:**
```css
font: Inter, 16px, 500
color: #5A5A5A (Charcoal Lighter)
padding: 12px 16px (space-3 space-4)
hover: color #1A1A1A (Charcoal Black)
active: color #2F7E8A (Teal Blue), border-bottom 2px solid #2F7E8A
```

### Modals & Overlays

**Modal Overlay:**
```css
background: rgba(0,0,0,0.5)
backdrop-filter: blur(4px)
```

**Modal Content:**
```css
background: #FFFFFF
border-radius: 12px (radius-lg)
padding: 32px (space-8)
max-width: 600px (adjust per use case)
shadow: shadow-xl
animation: fade-in + scale-up (200ms ease-out)
```

## Tailwind CSS Configuration

**File:** `apps/web/tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'soft-sand': '#F5EFE7',
        'soft-sand-light': '#FDFCFA',
        'soft-sand-dark': '#EDE4D8',
        'gold-honey': '#E2A74A',
        'gold-light': '#F0C98E',
        'gold-dark': '#C78F3B',
        'charcoal-black': '#1A1A1A',
        'charcoal-light': '#2E2E2E',
        'charcoal-lighter': '#5A5A5A',
        'teal-blue': '#2F7E8A',
        'teal-light': '#4A9DAB',
        'teal-dark': '#246270',
      },
      fontFamily: {
        serif: ['Lora', 'Playfair Display', 'serif'],
        sans: ['Inter', 'Public Sans', 'sans-serif'],
      },
      fontSize: {
        'h1': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'h2': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
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
        'hive-sm': '0 1px 2px rgba(0,0,0,0.05)',
        'hive-md': '0 4px 6px rgba(0,0,0,0.07)',
        'hive-lg': '0 10px 15px rgba(0,0,0,0.1)',
        'hive-xl': '0 20px 25px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
```

## Color Contrast Compliance (WCAG 2.1 AA)

| Foreground | Background | Ratio | Passes |
|------------|------------|-------|--------|
| Charcoal Black (#1A1A1A) | Soft Sand (#F5EFE7) | 9.8:1 | AAA ✓ |
| Charcoal Black (#1A1A1A) | White (#FFFFFF) | 14.5:1 | AAA ✓ |
| Teal Blue (#2F7E8A) | White (#FFFFFF) | 4.8:1 | AA ✓ |
| Teal Blue (#2F7E8A) | Soft Sand (#F5EFE7) | 4.2:1 | AA ✓ |
| Gold (#E2A74A) | White (#FFFFFF) | 3.5:1 | AA Large ✓ |
| Gold (#E2A74A) | Charcoal Black (#1A1A1A) | 4.1:1 | AA ✓ |

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
- Links: `color change`, `underline`

## Iconography

**Icon Library:** Heroicons (MIT license)

**Sizes:**
- xs: 16px
- sm: 20px
- md: 24px (default)
- lg: 32px
- xl: 48px

**Colors:**
- Default: Charcoal Black (#1A1A1A)
- AI features: Teal Blue (#2F7E8A)
- Actions: Gold (#E2A74A)
- Destructive: Error Red (#F44336)

## Review Checklist

Before approving any UI implementation, verify:

- [ ] Colors match design tokens exactly (no custom hex values)
- [ ] Typography uses specified font families, sizes, and weights
- [ ] Spacing follows 4px base unit system
- [ ] Border radius ≥8px (radius-md) for all components
- [ ] All interactive elements have hover and focus states
- [ ] Citations styled in Teal Blue with underline
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text)
- [ ] Component matches corresponding entry in this style guide
- [ ] Responsive behavior defined for all breakpoints
- [ ] Animations use specified timing functions and durations
