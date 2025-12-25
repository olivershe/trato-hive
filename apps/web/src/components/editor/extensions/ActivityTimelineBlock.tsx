import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { FileText, MessageSquare, ArrowRightCircle, CheckCircle2 } from "lucide-react";

export interface ActivityItem {
    id: string;
    type: "DOCUMENT" | "STAGE" | "COMMENT" | "TASK";
    description: string;
    date: string;
    user: string;
}

export interface ActivityTimelineAttributes {
    activities: ActivityItem[];
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        activityTimelineBlock: {
            setActivityTimelineBlock: (attrs: ActivityTimelineAttributes) => ReturnType;
        };
    }
}

export const ActivityTimelineBlock = Node.create({
    name: "activityTimelineBlock",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            activities: { default: [] },
        };
    },

    parseHTML() {
        return [
            {
                tag: "activity-timeline-block",
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ["activity-timeline-block", mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ActivityTimeline);
    },

    addCommands() {
        return {
            setActivityTimelineBlock:
                (attrs) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: "activityTimelineBlock",
                            attrs,
                        });
                    },
        };
    },
});

function ActivityTimeline({ node }: { node: any }) {
    const { activities } = node.attrs as ActivityTimelineAttributes;

    const getIcon = (type: string) => {
        switch (type) {
            case "DOCUMENT": return <FileText className="w-4 h-4" />;
            case "STAGE": return <ArrowRightCircle className="w-4 h-4" />;
            case "COMMENT": return <MessageSquare className="w-4 h-4" />;
            case "TASK": return <CheckCircle2 className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "DOCUMENT": return "bg-blue-100 text-blue-600 border-blue-200";
            case "STAGE": return "bg-gold/20 text-gold border-gold/40";
            case "COMMENT": return "bg-charcoal/10 text-charcoal border-charcoal/20";
            case "TASK": return "bg-emerald-100 text-emerald-600 border-emerald-200";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <NodeViewWrapper className="my-8 font-sans">
            <div className="px-4 py-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal/40 dark:text-cultured-white/40 mb-4 border-b border-charcoal/10 pb-2">
                    Investigation Timeline
                </h3>
                <div className="relative border-l-2 border-charcoal/10 dark:border-white/10 ml-3 space-y-6">
                    {activities.map((activity, idx) => (
                        <div key={activity.id || idx} className="relative pl-8">
                            {/* Dot */}
                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${getColor(activity.type)} flex items-center justify-center bg-white dark:bg-deep-grey`}>
                                {/* Inner dot handled by icon or just empty */}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <div className="text-sm font-medium text-charcoal dark:text-cultured-white">
                                    {activity.description}
                                </div>
                                <div className="text-xs text-charcoal/50 dark:text-cultured-white/50 font-mono">
                                    {activity.date}
                                </div>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${getColor(activity.type)} bg-opacity-50`}>
                                    {getIcon(activity.type)}
                                    {activity.type}
                                </span>
                                <span className="text-[10px] text-charcoal/40 dark:text-cultured-white/40">
                                    by {activity.user}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </NodeViewWrapper>
    );
}
