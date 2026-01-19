# Add Tiptap UI Component

Add official Tiptap UI components to the editor using the Tiptap CLI.

## When to Use Official Components

**USE official components for:**
- Standard editor features (tables, image upload, emoji picker)
- Text formatting UI (color pickers, alignment buttons)
- Generic primitives (toolbar, popover, dropdown menu)
- Features that don't need M&A CRM data integration

**BUILD custom blocks for:**
- Anything requiring tRPC API calls (CompanyEmbedBlock, QueryBlock, etc.)
- Domain-specific M&A features (deal cards, pipeline views, citations)
- Blocks that display organization-specific data
- AI-powered features using our DiligenceAgent

## Available Components

### UI Components
```
ai-ask-button, ai-menu, blockquote-button, code-block-button,
color-highlight-button, color-highlight-popover, color-text-button,
color-text-popover, copy-anchor-link-button, copy-to-clipboard-button,
delete-node-button, drag-context-menu, duplicate-button,
emoji-dropdown-menu, emoji-menu, emoji-trigger-button, heading-button,
heading-dropdown-menu, image-align-button, image-upload-button,
link-popover, list-button, list-dropdown-menu, mark-button,
mention-dropdown-menu, mention-trigger-button, move-node-button,
reset-all-formatting-button, slash-command-trigger-button,
slash-dropdown-menu, text-align-button, text-button,
turn-into-dropdown, undo-redo-button
```

### Node Components
```
blockquote-node, code-block-node, heading-node, horizontal-rule-node,
image-node, image-node-pro, image-upload-node, list-node,
paragraph-node, table-node, table-of-contents-node
```

### Primitives
```
avatar, badge, button, card, combobox, dropdown-menu, input, label,
menu, popover, separator, spacer, textarea-autosize, toolbar, tooltip
```

## Commands

```bash
# First-time setup (if not initialized)
npx @tiptap/cli@latest init

# Add a specific component
npx @tiptap/cli@latest add <component-name>

# Examples
npx @tiptap/cli@latest add table-node
npx @tiptap/cli@latest add image-upload-button
npx @tiptap/cli@latest add emoji-dropdown-menu
npx @tiptap/cli@latest add toolbar
```

## Integration Steps

After adding a component:

1. **Check the generated files** in your components directory
2. **Apply design system styling:**
   - Replace colors with Trato Hive palette (orange: `#E07B39`, charcoal: `#262827`)
   - Use `dark:` variants for dark mode
   - Match existing component patterns in `apps/web/src/components/editor/`
3. **Register with editor** if it's an extension (add to `extensions.ts`)
4. **Add to slash command** if it should be insertable via `/` menu
5. **Test** the component works with existing custom blocks

## Design System Reference

- Primary Orange: `#E07B39` (accents, buttons)
- Charcoal: `#262827` (text, backgrounds)
- Teal Blue: `#2F7E8A` (CITATIONS ONLY - never use elsewhere)
- See `/context/design-tokens.md` for full palette

## CLI Info Commands

```bash
# Check current setup
npx @tiptap/cli@latest info

# Check auth status (for pro components)
npx @tiptap/cli@latest status
```
