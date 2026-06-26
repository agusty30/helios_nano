import { cn } from "@/lib/utils";

export function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-bright", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-xl p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-4 w-24" />
        <SkeletonPulse className="h-4 w-12" />
      </div>
      <SkeletonPulse className="h-8 w-32" />
      <SkeletonPulse className="h-3 w-full" />
      <SkeletonPulse className="h-3 w-3/4" />
    </div>
  );
}

export function SkeletonKpi() {
  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-8 w-8 rounded-lg" />
        <SkeletonPulse className="h-3 w-20" />
      </div>
      <SkeletonPulse className="h-7 w-28" />
      <SkeletonPulse className="h-2 w-16" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-3 border-b border-border/50 flex gap-4 items-center">
          <SkeletonPulse className="h-3 w-24" />
          <SkeletonPulse className="h-3 w-32" />
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <SkeletonCard className="h-28" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonKpi key={i} />
        ))}
      </div>
      <SkeletonTable />
    </div>
  );
}
