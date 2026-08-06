"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

type SheetContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  side?: "left" | "right" | "bottom";
};

const sideClasses: Record<NonNullable<SheetContentProps["side"]>, string> = {
  right:
    "inset-y-0 right-0 h-full w-full max-w-md border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  left: "inset-y-0 left-0 h-full w-full max-w-md border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  bottom:
    "inset-x-0 bottom-0 w-full border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom rounded-t-2xl",
};

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm", className)}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => {
  const reduceMotion = useReducedMotion();

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content ref={ref} asChild {...props}>
        <motion.div
          className={cn(
            "fixed z-50 flex flex-col gap-4 bg-card p-6 shadow-elevated",
            sideClasses[side],
            className,
          )}
          initial={reduceMotion ? false : { opacity: 0, x: side === "right" ? 24 : side === "left" ? -24 : 0, y: side === "bottom" ? 24 : 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: side === "right" ? 24 : side === "left" ? -24 : 0, y: side === "bottom" ? 24 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
          <SheetClose
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </SheetClose>
        </motion.div>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = DialogPrimitive.Content.displayName;

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props} />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("font-display text-xl text-foreground", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
