import { Button } from "@/components/ui/button";
import { type LucideIcon, Plus } from "lucide-react";
import { Link } from "wouter";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionHref,
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center" data-testid="empty-state">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Button asChild data-testid="button-empty-action">
            <Link href={actionHref}>
              <Plus className="h-4 w-4 mr-2" />
              {actionLabel}
            </Link>
          </Button>
        ) : (
          <Button onClick={onAction} data-testid="button-empty-action">
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
