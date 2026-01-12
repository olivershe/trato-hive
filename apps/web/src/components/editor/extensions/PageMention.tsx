/**
 * PageMention Extension
 *
 * Inline wiki-link node for linking pages within a deal.
 * Triggered by typing [[ and shows autocomplete of available pages.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { Link2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export interface PageMentionAttributes {
  pageId: string;
  pageTitle: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageMention: {
      setPageMention: (attrs: PageMentionAttributes) => ReturnType;
    };
  }
}

// Configuration type for the extension
export interface PageMentionOptions {
  suggestion: Omit<SuggestionOptions, "editor">;
}

const PageMentionPluginKey = new PluginKey("pageMention");

export const PageMention = Node.create<PageMentionOptions>({
  name: "pageMention",
  group: "inline",
  inline: true,
  atom: true,

  addOptions() {
    return {
      suggestion: {
        char: "[[",
        pluginKey: PageMentionPluginKey,
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: "pageMention",
                attrs: props,
              },
            ])
            .run();
        },
        allow: ({ state, range }: { state: any; range: any }) => {
          const $from = state.doc.resolve(range.from);
          const type = state.schema.nodes["pageMention"];
          if (!type) return false;
          return !!$from.parent.type.contentMatch.matchType(type);
        },
      } as Omit<SuggestionOptions, "editor">,
    };
  },

  addAttributes() {
    return {
      pageId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-page-id"),
        renderHTML: (attributes) => ({
          "data-page-id": attributes.pageId,
        }),
      },
      pageTitle: {
        default: "Untitled",
        parseHTML: (element) => element.getAttribute("data-page-title"),
        renderHTML: (attributes) => ({
          "data-page-title": attributes.pageTitle,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        { "data-type": this.name },
        HTMLAttributes,
        { class: "page-mention" }
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageMentionView);
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

/**
 * Page mention view component - renders inline wiki link
 */
function PageMentionView(props: ReactNodeViewProps) {
  const { pageId, pageTitle } = props.node.attrs as PageMentionAttributes;
  const params = useParams();
  const dealId = params?.id as string;

  if (!dealId || !pageId) {
    return (
      <NodeViewWrapper as="span" className="inline">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-sm">
          <Link2 className="w-3 h-3" />
          {pageTitle || "Invalid Link"}
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="inline">
      <Link
        href={`/deals/${dealId}/pages/${pageId}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gold/10 text-charcoal hover:bg-gold/20 hover:text-orange transition-colors text-sm font-medium no-underline"
        onClick={(e) => e.stopPropagation()}
      >
        <Link2 className="w-3 h-3 text-gold" />
        {pageTitle || "Untitled"}
      </Link>
    </NodeViewWrapper>
  );
}
