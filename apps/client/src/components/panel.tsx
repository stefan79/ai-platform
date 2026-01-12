import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

export type PanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  events?: readonly string[];
  footer?: ReactNode;
  layout?: 'column' | 'row';
  ariaLabel?: string;
  className?: string;
  mockId?: string;
  showHeader?: boolean;
  showDebug?: boolean;
};

export function Panel({
  title,
  subtitle,
  children,
  events = [],
  footer,
  layout = 'column',
  ariaLabel,
  className,
  mockId,
  showHeader = true,
  showDebug = false,
}: PanelProps) {
  return (
    <Card
      aria-label={ariaLabel ?? title}
      className={cn('panel', className)}
      data-mock-id={showDebug ? (mockId ?? title) : undefined}
    >
      {showHeader && (
        <CardHeader
          className={cn(
            layout === 'row'
              ? 'flex-row items-center justify-between gap-4 space-y-0'
              : 'flex-col gap-2 space-y-0',
          )}
        >
          <div>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
            <CardTitle>{title}</CardTitle>
            {showDebug && mockId && (
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                ID: {mockId}
              </p>
            )}
          </div>
          {showDebug && events.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {events.map((event) => (
                <Badge key={event} variant="outline">
                  {event}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={cn('space-y-3', !showHeader && 'pt-4')}>{children}</CardContent>
      {footer && <CardFooter className="text-sm text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
}
