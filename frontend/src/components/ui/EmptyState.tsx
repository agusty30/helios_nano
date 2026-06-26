import { cn } from "@/lib/utils";
import { LucideIcon, PackageOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon = PackageOpen, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="w-12 h-12 rounded-xl bg-surface-bright flex items-center justify-center mb-4">
        <Icon size={22} className="text-muted-dark" />
      </div>
      <h3 className="text-[14px] font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-[12px] text-muted-dark max-w-[280px]">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-[12px] font-medium bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
