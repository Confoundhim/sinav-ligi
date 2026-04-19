import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  badge?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  badge,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-muted-foreground mb-3 text-xs tracking-[0.32em] uppercase">
            {eyebrow}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="section-title">{title}</h2>
          {badge ? (
            <Badge className="bg-accent/14 text-accent hover:bg-accent/20 border-accent/20 border">
              {badge}
            </Badge>
          ) : null}
        </div>
        {description && (
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-7 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
