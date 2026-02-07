// @ts-nocheck - Tiptap extension type portability issue
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
// Note: Link and Underline are removed - Novel adds them internally
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import UniqueID from "@tiptap/extension-unique-id";
import { CitationBlock } from "./extensions/CitationBlock";
import { DealHeaderBlock } from "./extensions/DealHeaderBlock";
import { CompanyHeaderBlock } from "./extensions/CompanyHeaderBlock";
import { ActivityTimelineBlock } from "./extensions/ActivityTimelineBlock";
import { DealDatabaseBlock } from "./extensions/DealDatabaseBlock";
import { AISuggestionBlock } from "./extensions/AISuggestionBlock";
import { DatabaseViewBlock } from "./extensions/DatabaseViewBlock";
import { PipelineHealthBlock } from "./extensions/PipelineHealthBlock";
import { InboxBlock } from "./extensions/InboxBlock";
import { QueryBlock } from "./extensions/QueryBlock";
import { VDRBlock } from "./extensions/VDRBlock";
import { SearchBlock } from "./extensions/SearchBlock";
import { InlineCitationMark } from "./extensions/InlineCitationMark";
import { AIAnswerBlock } from "./extensions/AIAnswerBlock";
import { DealHistoryBlock } from "./extensions/DealHistoryBlock";
import { RelatedCompaniesBlock } from "./extensions/RelatedCompaniesBlock";
import { DocumentViewerBlock } from "./extensions/DocumentViewerBlock";
import { ExtractedFactsBlock } from "./extensions/ExtractedFactsBlock";
import { CompanyEmbedBlock } from "./extensions/CompanyEmbedBlock";
import { CustomAgentBlock } from "./extensions/CustomAgentBlock";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import AutoJoiner from "tiptap-extension-auto-joiner";
import Focus from "@tiptap/extension-focus";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node";

// Re-export for dynamic configuration
export { PageMention } from "./extensions/PageMention";
export { createWikiLinkSuggestion } from "./WikiLinkSuggestion";
export { InlineCitationMark, type InlineCitationAttrs } from "./extensions/InlineCitationMark";

// @ts-ignore
const uniqueId = UniqueID.configure({
    types: ['paragraph', 'heading', 'taskItem', 'blockquote', 'image'],
});

const placeholder = Placeholder.configure({
    placeholder: ({ node }: { node: any }) => {
        if (node.type.name === "heading") {
            return `Heading ${node.attrs.level}`;
        }
        if (node.type.name === "bulletList" || node.type.name === "orderedList") {
            return "List item…";
        }
        if (node.type.name === "blockquote") {
            return "Empty quote…";
        }
        return "Type '/' for commands or ask AI…";
    },
    includeChildren: true,
});

// Note: Link configuration is handled internally by Novel

const tiptapImage = Image.extend({
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

const characterCount = CharacterCount.configure({
    limit: 50000,
});

// Image upload handler - converts to base64 for now
// TODO: Replace with S3 upload in production
const uploadImage = async (
    file: File,
    onProgress?: (event: { progress: number }) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadstart = () => onProgress?.({ progress: 0 });
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                onProgress?.({ progress: (e.loaded / e.total) * 100 });
            }
        };
        reader.onloadend = () => onProgress?.({ progress: 100 });

        reader.onload = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
            } else {
                reject(new Error("Failed to read file"));
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));

        reader.readAsDataURL(file);
    });
};

const imageUploadNode = ImageUploadNode.configure({
    accept: "image/*",
    maxSize: 10 * 1024 * 1024, // 10MB
    upload: uploadImage,
    onError: (error) => console.error("Image upload error:", error),
});

export const defaultExtensions: any[] = [
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
                class: "pl-4",
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
        // Configure HorizontalRule directly in StarterKit instead of separately
        horizontalRule: {
            HTMLAttributes: {
                class: "mt-4 mb-6 border-t border-gold/20",
            },
        },
        dropcursor: {
            color: "#DBEAFE",
            width: 4,
        },
        gapcursor: false,
    }),
    uniqueId,
    placeholder,
    // Note: Link is handled internally by Novel - removed to avoid duplicates
    tiptapImage,
    imageUploadNode,
    characterCount,
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
    // Note: Underline is handled internally by Novel - removed to avoid duplicates
    TextStyle,
    Color,
    Highlight.configure({
        multicolor: true,
    }),
    CitationBlock,
    DealHeaderBlock,
    CompanyHeaderBlock,
    ActivityTimelineBlock,
    DealDatabaseBlock,
    AISuggestionBlock,
    DatabaseViewBlock,
    PipelineHealthBlock,
    InboxBlock,
    QueryBlock,
    VDRBlock,
    SearchBlock,
    InlineCitationMark,
    AIAnswerBlock,
    DealHistoryBlock,
    RelatedCompaniesBlock,
    DocumentViewerBlock,
    ExtractedFactsBlock,
    CompanyEmbedBlock,
    CustomAgentBlock,
    GlobalDragHandle.configure({
        dragHandleWidth: 24,
        scrollTreshold: 100,
    }),
    AutoJoiner.configure({
        elementsToJoin: ["bulletList", "orderedList"], // Join lists when adjacent
    }),
    Focus.configure({
        className: "is-focused",
        mode: "all", // Highlight longest node (or shallowest)
    }),
];
