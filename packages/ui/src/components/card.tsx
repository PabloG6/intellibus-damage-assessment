import type { HTMLAttributes } from "react"

import { cn } from "@workspace/ui/lib/utils"

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-3xl border border-border/80 bg-card/95 text-card-foreground shadow-[0_20px_60px_-30px_rgba(15,23,42,0.8)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-title"
      className={cn("text-sm font-semibold tracking-tight text-card-foreground", className)}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-xs leading-5 text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="card-content" className={cn("px-4 pb-4", className)} {...props} />
  )
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle }
