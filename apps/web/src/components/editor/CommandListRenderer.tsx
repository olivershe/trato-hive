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
        <div className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-xl border border-gold/20 bg-alabaster/90 p-2 shadow-xl backdrop-blur-md transition-all dark:bg-charcoal/90 dark:border-white/10 scrollbar-thin scrollbar-thumb-gold/20 scrollbar-track-transparent">
            {props.items.length > 0 ? (
                props.items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => selectItem(index)}
                        className={`flex w-full items-center space-x-3 rounded-lg px-2 py-2 text-left text-sm transition-all duration-200 ${index === selectedIndex
                                ? "bg-white text-orange shadow-sm dark:bg-white/10 dark:text-gold"
                                : "text-charcoal hover:bg-gold/5 dark:text-cultured-white dark:hover:bg-white/5"
                            }`}
                    >
                        <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg border ${index === selectedIndex ? "border-orange/20 bg-orange/10 dark:border-gold/30 dark:bg-gold/20" : "border-transparent bg-transparent"
                            }`}>
                            {item.icon}
                        </div>
                        <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-xs opacity-70 truncate max-w-[180px]">
                                {item.description}
                            </p>
                        </div>
                    </button>
                ))
            ) : (
                <div className="px-2 py-2 text-sm text-charcoal/60 dark:text-cultured-white/60 font-sans italic text-center">
                    No results found
                </div>
            )}
        </div>
    );
});

CommandListRenderer.displayName = "CommandListRenderer";
