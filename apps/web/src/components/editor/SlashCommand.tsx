import {
    CheckSquare,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Text,
    FileText,
    Zap,
    Quote,
    LayoutDashboard,
} from "lucide-react";
// @ts-ignore
import { createSuggestionItems, Command } from "novel/extensions";
import { CommandListRenderer, SuggestionItem } from "./CommandListRenderer";
import { ReactRenderer } from "@tiptap/react";
import { Editor, Range } from "@tiptap/core";
import tippy, { Instance } from "tippy.js";

interface CommandProps {
    editor: Editor;
    range: Range;
    props: any;
    clientRect?: () => DOMRect;
}

const renderItems = () => {
    let component: ReactRenderer | null = null;
    let popup: Instance[] | null = null;

    return {
        onStart: (props: CommandProps) => {
            component = new ReactRenderer(CommandListRenderer as any, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
            });
        },

        onUpdate: (props: CommandProps) => {
            component?.updateProps(props);

            if (!props.clientRect) {
                return;
            }

            popup?.[0].setProps({
                getReferenceClientRect: props.clientRect,
            });
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
            if (props.event.key === "Escape") {
                popup?.[0].hide();
                return true;
            }

            return (component?.ref as any)?.onKeyDown(props);
        },

        onExit: () => {
            popup?.[0].destroy();
            component?.destroy();
        },
    };
};

export const suggestionItems = createSuggestionItems([
    {
        title: "Text",
        description: "Just start typing with plain text.",
        searchTerms: ["p", "paragraph"],
        icon: <Text className="w-4" />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleNode("paragraph", "paragraph")
                .run();
        },
    },
    {
        title: "To-do List",
        description: "Track tasks with a checklist.",
        searchTerms: ["todo", "task", "list", "check", "checkbox"],
        icon: <CheckSquare className="w-4" />,
        command: ({ editor, range }) => {
            (editor.chain() as any).focus().deleteRange(range).toggleTaskList().run();
        },
    },
    {
        title: "Heading 1",
        description: "Big section heading.",
        searchTerms: ["title", "big", "large"],
        icon: <Heading1 className="w-4" />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode("heading", { level: 1 })
                .run();
        },
    },
    {
        title: "Heading 2",
        description: "Medium section heading.",
        searchTerms: ["subtitle", "medium"],
        icon: <Heading2 className="w-4" />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode("heading", { level: 2 })
                .run();
        },
    },
    {
        title: "Heading 3",
        description: "Small section heading.",
        searchTerms: ["subtitle", "small"],
        icon: <Heading3 className="w-4" />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode("heading", { level: 3 })
                .run();
        },
    },
    {
        title: "Bullet List",
        description: "Create a simple bulleted list.",
        searchTerms: ["unordered", "point"],
        icon: <List className="w-4" />,
        command: ({ editor, range }) => {
            (editor.chain() as any).focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: "Numbered List",
        description: "Create a list with numbering.",
        searchTerms: ["ordered"],
        icon: <ListOrdered className="w-4" />,
        command: ({ editor, range }) => {
            (editor.chain() as any).focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: "Quote",
        description: "Capture a quotation.",
        searchTerms: ["blockquote"],
        icon: <Quote className="w-4" />,
        command: ({ editor, range }) =>
            (editor.chain() as any)
                .focus()
                .deleteRange(range)
                .toggleNode("paragraph", "paragraph")
                .toggleBlockquote()
                .run(),
    },
    // M&A SPECIFIC BLOCKS
    {
        title: "Deal Snapshot",
        description: "Insert a live deal summary card.",
        searchTerms: ["mna", "deal", "summary", "snapshot"],
        icon: <LayoutDashboard className="w-4 text-orange" />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent({
                    type: "paragraph",
                    content: [{ type: "text", text: "[M&A Deal Snapshot Placeholder]" }]
                })
                .run();
        },
    },
    {
        title: "Citation",
        description: "Link a fact to a source document.",
        searchTerms: ["fact", "cite", "source", "verify"],
        icon: <Zap className="w-4 text-citation" />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent({
                    type: "paragraph",
                    content: [{ type: "text", text: "[Verifiable Fact Citation Placeholder]" }]
                })
                .run();
        },
    },
    {
        title: "Diligence List",
        description: "Insert a structured checklist of diligence items.",
        searchTerms: ["diligence", "vdr", "request"],
        icon: <FileText className="w-4 text-orange" />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent({
                    type: "paragraph",
                    content: [{ type: "text", text: "[Diligence Request List Placeholder]" }]
                })
                .run();
        },
    },
] as SuggestionItem[]);

export const slashCommand = Command.configure({
    suggestion: {
        items: () => suggestionItems,
        render: renderItems as any,
    },
});
