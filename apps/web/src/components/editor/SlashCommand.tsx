import {
    Command,
    createSuggestionItems,
} from "novel/extensions";
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

export const suggestionItems = createSuggestionItems([
    // Intelligent Blocks (Top Priority)
    {
        title: "Ask AI",
        description: "Use AI to generate or edit content",
        searchTerms: ["ai", "gpt", "generate"],
        icon: <Sparkles size={18} className="text-gold" />,
        command: ({ editor, range }) => {
            // Stub for AI command sidebar or bubble
            editor.chain().focus().deleteRange(range).run();
            // In real implementation, this would trigger the AI sidebar
            window.alert("AI Sidebar would open here");
        },
    },
    {
        title: "New Deal",
        description: "Embed a Deal Header card",
        searchTerms: ["deal", "header", "crm"],
        icon: <Database size={18} className="text-gold" />,
        command: ({ editor, range }) => {
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
        icon: <BookOpen size={18} className="text-teal-blue" />, // Teal for verifiability
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("citationBlock").run();
        },
    },
    // Basic Blocks
    {
        title: "Text",
        description: "Just start typing with plain text",
        searchTerms: ["p", "paragraph"],
        icon: <Text size={18} />,
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
        title: "Heading 1",
        description: "Big section heading",
        searchTerms: ["title", "big", "large"],
        icon: <Heading1 size={18} />,
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
        description: "Medium section heading",
        searchTerms: ["subtitle", "medium"],
        icon: <Heading2 size={18} />,
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
        description: "Small section heading",
        searchTerms: ["subtitle", "small"],
        icon: <Heading3 size={18} />,
        command: ({ editor, range }) => {
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
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: "Numbered List",
        description: "Create a list with numbering",
        searchTerms: ["ordered"],
        icon: <ListOrdered size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: "To-do List",
        description: "Track tasks with a to-do list",
        searchTerms: ["todo", "task", "list", "check", "checkbox"],
        icon: <CheckSquare size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
    },
    // Media & Advanced
    {
        title: "Quote",
        description: "Capture a quote",
        searchTerms: ["blockquote"],
        icon: <TextQuote size={18} />,
        command: ({ editor, range }) => {
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
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
    },
    {
        title: "Image",
        description: "Upload an image from your computer",
        searchTerms: ["photo", "picture", "media"],
        icon: <ImageIcon size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            // upload function logic would go here
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
                if (input.files?.length) {
                    const file = input.files[0];
                    const pos = editor.view.state.selection.from;
                    // Mock upload
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
        command: ({ editor, range }) => {
            // Placeholder implementation using TextMessage/CodeBlock for now or custom node if exists
            // Since we don't have a write-mode Kanban node yet, we can use a placeholder
            editor.chain().focus().deleteRange(range).setParagraph().insertContent("[Kanban Board Placeholder]").run();
        }
    },
]);

export const slashCommand = Command.configure({
    suggestion: {
        items: () => suggestionItems,
        render: renderItems,
    },
});
