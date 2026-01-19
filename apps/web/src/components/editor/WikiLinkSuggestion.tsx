/**
 * WikiLinkSuggestion
 *
 * Autocomplete dropdown for wiki links ([[ trigger).
 * Shows pages from the current deal filtered by search query.
 */
import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { FileText, Database } from "lucide-react";
import type { SuggestionProps } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { api } from "@/trpc/react";

export interface PageSuggestionItem {
  pageId: string;
  pageTitle: string;
  icon: string | null;
  isDatabase: boolean;
}

interface WikiLinkListProps {
  items: PageSuggestionItem[];
  command: (item: PageSuggestionItem) => void;
  query: string;
}

/**
 * The dropdown list component
 */
const WikiLinkList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  WikiLinkListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback(
    (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item);
      }
    },
    [props]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (selectedIndex + props.items.length - 1) % props.items.length
        );
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="z-50 h-auto max-h-[280px] w-64 overflow-y-auto rounded-xl border border-gold/20 bg-alabaster/95 p-2 shadow-xl backdrop-blur-md transition-[opacity,transform] dark:bg-charcoal/95 dark:border-white/10 overscroll-contain">
      {/* Header */}
      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50">
        Link to page
      </div>

      {props.items.length > 0 ? (
        props.items.map((item, index) => (
          <button
            key={item.pageId}
            onClick={() => selectItem(index)}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/40 ${
              index === selectedIndex
                ? "bg-white text-orange shadow-sm dark:bg-white/10 dark:text-gold"
                : "text-charcoal hover:bg-gold/5 dark:text-cultured-white dark:hover:bg-white/5"
            }`}
          >
            <span className="text-base flex-shrink-0">
              {item.icon || (item.isDatabase ? "🗃️" : "📄")}
            </span>
            <span className="truncate font-medium">
              {item.pageTitle || "Untitled"}
            </span>
            {item.isDatabase && (
              <Database className="w-3 h-3 text-gold/60 flex-shrink-0 ml-auto" />
            )}
          </button>
        ))
      ) : props.query.length > 0 ? (
        <div className="px-2 py-4 text-sm text-charcoal/60 dark:text-cultured-white/60 text-center">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No pages match "{props.query}"</p>
        </div>
      ) : (
        <div className="px-2 py-4 text-sm text-charcoal/60 dark:text-cultured-white/60 text-center">
          <p>Type to search pages</p>
        </div>
      )}
    </div>
  );
});

WikiLinkList.displayName = "WikiLinkList";

/**
 * Render items configuration for the Suggestion plugin
 */
export function createWikiLinkSuggestion(dealId: string | undefined) {
  return {
    // Items are fetched in the render function using the query
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    items: (_props: { query: string }): PageSuggestionItem[] => {
      // Items are provided dynamically via props update
      return [];
    },
    render: () => {
      let component: ReactRenderer<
        { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
        WikiLinkListProps
      > | null = null;
      let popup: TippyInstance[] | null = null;

      return {
        onStart: (props: SuggestionProps<PageSuggestionItem>) => {
          component = new ReactRenderer(WikiLinkListWithData, {
            props: { ...props, dealId },
            editor: props.editor,
          });

          if (!props.clientRect) return;

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },
        onUpdate: (props: SuggestionProps<PageSuggestionItem>) => {
          component?.updateProps({ ...props, dealId });

          if (!props.clientRect) return;

          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        },
        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === "Escape") {
            popup?.[0]?.hide();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          popup?.[0]?.destroy();
          component?.destroy();
        },
      };
    },
  };
}

/**
 * WikiLinkList wrapper that fetches data
 */
interface WikiLinkListWithDataProps extends SuggestionProps<PageSuggestionItem> {
  dealId: string | undefined;
}

const WikiLinkListWithData = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  WikiLinkListWithDataProps
>((props, ref) => {
  const { dealId, query, command } = props;

  // Fetch page tree for the deal
  const { data: pageTree } = api.page.getTree.useQuery(
    { dealId: dealId! },
    { enabled: !!dealId }
  );

  // Flatten tree and filter by query
  const flattenTree = (
    nodes: typeof pageTree,
    result: PageSuggestionItem[] = []
  ): PageSuggestionItem[] => {
    if (!nodes) return result;
    for (const node of nodes) {
      result.push({
        pageId: node.id,
        pageTitle: node.title || "Untitled",
        icon: node.icon,
        isDatabase: node.isDatabase,
      });
      if (node.children?.length) {
        flattenTree(node.children, result);
      }
    }
    return result;
  };

  const allPages = flattenTree(pageTree);
  const filteredPages = query
    ? allPages.filter((p) =>
        (p.pageTitle || "").toLowerCase().includes(query.toLowerCase())
      )
    : allPages;

  const handleCommand = (item: PageSuggestionItem) => {
    command({
      pageId: item.pageId,
      pageTitle: item.pageTitle,
    } as any);
  };

  return (
    <WikiLinkList
      ref={ref}
      items={filteredPages.slice(0, 10)}
      command={handleCommand}
      query={query}
    />
  );
});

WikiLinkListWithData.displayName = "WikiLinkListWithData";
