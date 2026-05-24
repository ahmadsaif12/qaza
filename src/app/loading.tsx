import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        {/* You could optionally use the app icon here */}
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Qaza</h2>
          <p className="text-sm text-muted-foreground">Preparing your prayers...</p>
        </div>
      </div>
    </div>
  );
}
