import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import {
    CheckSquare,
    Code,
    Heading1,
    Heading2,
    Heading3,
    ImageIcon,
    List,
    ListOrdered,
    MessageSquarePlus,
    Text,
    TextQuote,
    Sparkles,
    Database,
    Calendar,
    KanbanSquare,
    BookOpen
} from "lucide-react";
import { CommandListRenderer } from "./CommandListRenderer";

// Definitions for the slash command without 'novel' dependency if it's broken
// Or re-exporting if it exists.
// Ideally usage: Command.configure(...)

// Mocking 'Command' extension creation using Tiptap's Suggestion if novel is broken
// But let's try to stick to what was there, just fixing types.

const Command = Extension.create({
    name: "slash-command",
    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

const renderItems = () => {
    let component: ReactRenderer | null = null;
    let popup: any | null = null;

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(CommandListRenderer, {
                props,
                editor: props.editor,
            });

            // @ts-ignore
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
        onUpdate: (props: any) => {
            component?.updateProps(props);

            if (!props.clientRect) {
                return;
            }

            popup?.[0].setProps({
                getReferenceClientRect: props.clientRect,
            });
        },
        onKeyDown: (props: any) => {
            if (props.event.key === "Escape") {
                popup?.[0].hide();

                return true;
            }

            // @ts-ignore
            return component?.ref?.onKeyDown(props);
        },
        onExit: () => {
            popup?.[0].destroy();
            component?.destroy();
        },
    };
};

export const suggestionItems = [
    // Intelligent Blocks (Top Priority)
    {
        title: "Ask AI",
        description: "Use AI to generate or edit content",
        searchTerms: ["ai", "gpt", "generate"],
        icon: <Sparkles size={18} className="text-gold" />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).run();
            window.alert("AI Sidebar would open here");
        },
    },
    {
        title: "AI Suggestion",
        description: "Insert an AI-suggested field update",
        searchTerms: ["ai", "suggestion", "recommend", "suggest"],
        icon: <Sparkles size={18} className="text-orange" />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).setAISuggestionBlock({
                entityType: "Deal",
                entityId: "",
                field: "value",
                currentValue: null,
                suggestedValue: null,
                confidence: 0.85,
                factIds: [],
                status: "pending",
            }).run();
        },
    },
    {
        title: "New Deal",
        description: "Embed a Deal Header card",
        searchTerms: ["deal", "header", "crm"],
        icon: <Database size={18} className="text-gold" />,
        command: ({ editor, range }: any) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode("dealHeader", { dealName: "New Deal" })
                .run();
        },
    },
    {
        title: "Add Citation",
        description: "Reference a verified fact",
        searchTerms: ["citation", "cite", "reference", "source"],
        icon: <BookOpen size={18} className="text-teal-blue" />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).setNode("citationBlock").run();
        },
    },
    // Basic Blocks
    {
        title: "Text",
        description: "Just start typing with plain text",
        searchTerms: ["p", "paragraph"],
        icon: <Text size={18} />,
        command: ({ editor, range }: any) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleNode("paragraph", "paragraph")
                .run();
        },
    },
    {
        title: "Heading 1",
        description: "Big section heading",
        searchTerms: ["title", "big", "large"],
        icon: <Heading1 size={18} />,
        command: ({ editor, range }: any) => {
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
        description: "Medium section heading",
        searchTerms: ["subtitle", "medium"],
        icon: <Heading2 size={18} />,
        command: ({ editor, range }: any) => {
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
        description: "Small section heading",
        searchTerms: ["subtitle", "small"],
        icon: <Heading3 size={18} />,
        command: ({ editor, range }: any) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode("heading", { level: 3 })
                .run();
        },
    },
    // Lists
    {
        title: "Bullet List",
        description: "Create a simple bullet list",
        searchTerms: ["unordered", "point"],
        icon: <List size={18} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: "Numbered List",
        description: "Create a list with numbering",
        searchTerms: ["ordered"],
        icon: <ListOrdered size={18} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: "To-do List",
        description: "Track tasks with a to-do list",
        searchTerms: ["todo", "task", "list", "check", "checkbox"],
        icon: <CheckSquare size={18} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
    },
    // Media & Advanced
    {
        title: "Quote",
        description: "Capture a quote",
        searchTerms: ["blockquote"],
        icon: <TextQuote size={18} />,
        command: ({ editor, range }: any) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleNode("paragraph", "paragraph")
                .toggleBlockquote()
                .run();
        },
    },
    {
        title: "Code",
        description: "Capture a code snippet",
        searchTerms: ["codeblock"],
        icon: <Code size={18} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
    },
    {
        title: "Image",
        description: "Upload an image from your computer",
        searchTerms: ["photo", "picture", "media"],
        icon: <ImageIcon size={18} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).run();
            // Mock upload
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
                if (input.files?.length) {
                    const file = input.files[0];
                    const url = URL.createObjectURL(file);
                    editor.chain().focus().setImage({ src: url }).run();
                }
            };
            input.click();
        },
    },
    {
        title: "Kanban Board",
        description: "Insert a Kanban view",
        searchTerms: ["kanban", "board", "project"],
        icon: <KanbanSquare size={18} />,
        command: ({ editor, range }: any) => {
            editor.chain().focus().deleteRange(range).setParagraph().insertContent("[Kanban Board Placeholder]").run();
        }
    },
];

export const slashCommand = Command.configure({
    suggestion: {
        items: ({ query }: any) => {
            return suggestionItems.filter((item) =>
                item.title.toLowerCase().startsWith(query.toLowerCase())
            ).slice(0, 10);
        },
        render: renderItems,
    },
});
