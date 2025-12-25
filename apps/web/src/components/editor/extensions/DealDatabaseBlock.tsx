import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { ViewProvider, useView } from "../../views/ViewContext";
import { ViewSwitcher } from "../../views/ViewSwitcher";
import { KanbanView } from "../../views/KanbanView";
import { TableView } from "../../views/TableView";
import { TimelineView } from "../../views/TimelineView";
import { CalendarView } from "../../views/CalendarView";
import { AnalyticsView } from "../../views/AnalyticsView";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        dealDatabaseBlock: {
            setDealDatabaseBlock: () => ReturnType;
        };
    }
}

export const DealDatabaseBlock = Node.create({
    name: "dealDatabaseBlock",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            viewType: { default: "kanban" },
            // Storage for persisting filters or view state if easier than Context
            filters: { default: {} },
        };
    },

    parseHTML() {
        return [
            {
                tag: "deal-database-block",
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ["deal-database-block", mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(DealDatabaseComponent);
    },

    addCommands() {
        return {
            setDealDatabaseBlock:
                () =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: "dealDatabaseBlock",
                        });
                    },
        };
    },
});

function DealDatabaseComponent() {
    return (
        <NodeViewWrapper className="my-10 !w-full max-w-full">
            <ViewProvider>
                <DatabaseRenderer />
            </ViewProvider>
        </NodeViewWrapper>
    );
}

function DatabaseRenderer() {
    const { currentView } = useView();

    return (
        <div className="flex flex-col">
            <ViewSwitcher />

            <div className="min-h-[400px]">
                {currentView === 'kanban' && <KanbanView />}
                {currentView === 'table' && <TableView />}
                {currentView === 'timeline' && <TimelineView />}
                {currentView === 'calendar' && <CalendarView />}
                {currentView === 'analytics' && <AnalyticsView />}
            </div>
        </div>
    );
}
