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
        <div className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-2xl border border-white/30 bg-white/60 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.5)_inset] backdrop-blur-2xl backdrop-saturate-150 transition-[opacity,transform] dark:bg-charcoal/60 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.1)_inset] scrollbar-thin scrollbar-thumb-gold/20 scrollbar-track-transparent overscroll-contain">
            {props.items.length > 0 ? (
                props.items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => selectItem(index)}
                        className={`flex w-full items-center space-x-3 rounded-lg px-2 py-2 text-left text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/40 ${index === selectedIndex
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
