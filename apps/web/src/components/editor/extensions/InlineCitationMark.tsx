/**
 * InlineCitationMark - Tiptap Mark Extension
 *
 * A Tiptap Mark (not Node) that wraps text with citation metadata.
 * Renders as a superscript [1] marker that can be clicked to reveal
 * the source document in the CitationSidebar.
 *
 * Part of Phase 1: Citation Core - making citations the killer feature.
 */
import { Mark, mergeAttributes } from "@tiptap/core";

export interface InlineCitationAttrs {
  citationIndex: number;
  factId: string;
  documentId: string;
  chunkId: string;
  sourceText: string;
  pageNumber?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineCitation: {
      setCitation: (attrs: InlineCitationAttrs) => ReturnType;
      unsetCitation: () => ReturnType;
    };
  }
}

export const InlineCitationMark = Mark.create({
  name: "inlineCitation",

  addAttributes() {
    return {
      citationIndex: { default: 1 },
      factId: { default: null },
      documentId: { default: null },
      chunkId: { default: null },
      sourceText: { default: "" },
      pageNumber: { default: null },
      boundingBox: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "cite[data-citation]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "cite",
      mergeAttributes(HTMLAttributes, {
        "data-citation": "true",
        "data-citation-index": HTMLAttributes.citationIndex,
        "data-fact-id": HTMLAttributes.factId,
        "data-document-id": HTMLAttributes.documentId,
        "data-chunk-id": HTMLAttributes.chunkId,
        "data-source-text": HTMLAttributes.sourceText,
        "data-page-number": HTMLAttributes.pageNumber,
        class: "inline-citation",
      }),
      0, // content hole
    ];
  },

  addCommands() {
    return {
      setCitation:
        (attrs: InlineCitationAttrs) =>
        ({ commands }) => {
          return commands.setMark(this.name, attrs);
        },
      unsetCitation:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
