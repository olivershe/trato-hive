import {
    useState,
    useEffect,
    useCallback,
    useImperativeHandle,
    forwardRef,
    ReactNode,
} from "react";
import { Editor, Range } from "@tiptap/core";

export interface SuggestionItem {
    title: string;
    description: string;
    icon: ReactNode;
    searchTerms?: string[];
    command: (props: { editor: Editor; range: Range }) => void;
}

export interface CommandListProps {
    items: SuggestionItem[];
    command: (item: SuggestionItem) => void;
    editor: Editor;
    range: Range;
}

export const CommandListRenderer = forwardRef((props: CommandListProps, ref) => {
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
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
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
        <div className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-gold/20 bg-alabaster dark:bg-surface-dark px-1 py-2 shadow-md transition-all">
            {props.items.length > 0 ? (
                props.items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => selectItem(index)}
                        className={`flex w-full items-center space-x-2 rounded-md px-2 py-1.5 text-left text-sm text-charcoal dark:text-cultured-white transition-colors duration-200 ${index === selectedIndex
                                ? "bg-orange/10 text-orange dark:bg-orange/20"
                                : "hover:bg-bone/50 dark:hover:bg-deep-grey/50"
                            }`}
                    >
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md border border-gold/10 bg-white dark:bg-deep-grey">
                            {item.icon}
                        </div>
                        <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-xs text-charcoal/60 dark:text-cultured-white/60 truncate max-w-[180px]">
                                {item.description}
                            </p>
                        </div>
                    </button>
                ))
            ) : (
                <div className="px-2 py-1.5 text-sm text-charcoal/60 dark:text-cultured-white/60 font-sans italic">
                    No results found
                </div>
            )}
        </div>
    );
});

CommandListRenderer.displayName = "CommandListRenderer";
