import {
    TiptapImage,
    TiptapLink,
    UpdatedCharacterCount,
    Placeholder,
    StarterKit,
    HorizontalRule,
    TaskItem,
    TaskList,
    Typography,
    Underline,
    Color,
    TextStyle,
    Highlight,
    // @ts-ignore
} from "novel/extensions";
import UniqueID from "@tiptap/extension-unique-id";
import { CitationBlock } from "./extensions/CitationBlock";
import { DealHeaderBlock } from "./extensions/DealHeaderBlock";
import { ActivityTimelineBlock } from "./extensions/ActivityTimelineBlock";

// @ts-ignore
const uniqueId = UniqueID.configure({
    types: ['paragraph', 'heading', 'taskItem', 'blockquote', 'image'],
});

const placeholder = Placeholder.configure({
    placeholder: ({ node }: { node: any }) => {
        if (node.type.name === "heading") {
            return `Heading ${node.attrs.level}`;
        }
        return "Press '/' for commands...";
    },
    includeChildren: true,
});

const tiptapLink = TiptapLink.configure({
    HTMLAttributes: {
        class:
            "text-orange underline underline-offset-[3px] hover:text-orange/80 transition-colors cursor-pointer",
    },
});

const tiptapImage = TiptapImage.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
            },
            height: {
                default: null,
            },
        };
    },
}).configure({
    allowBase64: true,
    HTMLAttributes: {
        class: "rounded-lg border border-gold/20 shadow-md",
    },
});

const updatedCharacterCount = UpdatedCharacterCount.configure({
    limit: 50000,
});

export const defaultExtensions = [
    StarterKit.configure({
        bulletList: {
            HTMLAttributes: {
                class: "list-disc list-outside leading-3 -mt-2",
            },
        },
        orderedList: {
            HTMLAttributes: {
                class: "list-decimal list-outside leading-3 -mt-2",
            },
        },
        listItem: {
            HTMLAttributes: {
                class: "leading-normal -mb-2",
            },
        },
        blockquote: {
            HTMLAttributes: {
                class: "border-l-4 border-gold bg-alabaster p-4 italic",
            },
        },
        codeBlock: {
            HTMLAttributes: {
                class:
                    "rounded-md bg-deep-grey text-cultured-white p-4 font-mono text-sm",
            },
        },
        code: {
            HTMLAttributes: {
                class:
                    "rounded-md bg-white px-1.5 py-1 font-mono text-sm text-orange",
                spellcheck: "false",
            },
        },
        horizontalRule: false,
        dropcursor: {
            color: "#DBEAFE",
            width: 4,
        },
        gapcursor: false,
    }),
    uniqueId,
    placeholder,
    tiptapLink,
    tiptapImage,
    updatedCharacterCount,
    HorizontalRule.configure({
        HTMLAttributes: {
            class: "mt-4 mb-6 border-t border-gold/20",
        },
    }),
    TaskList.configure({
        HTMLAttributes: {
            class: "not-prose pl-2",
        },
    }),
    TaskItem.configure({
        HTMLAttributes: {
            class: "flex items-start my-4",
        },
        nested: true,
    }),
    Typography,
    Underline,
    TextStyle,
    Color,
    Highlight.configure({
        multicolor: true,
    }),
    CitationBlock,
    DealHeaderBlock,
    ActivityTimelineBlock,
];
