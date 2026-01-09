import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange" />
        <p className="text-charcoal/60 text-sm">Loading...</p>
      </div>
    </div>
  );
}
