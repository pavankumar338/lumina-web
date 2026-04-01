"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90 shadow-lg shadow-destructive/20",
        outline: "border border-border bg-transparent hover:bg-muted text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-90 shadow-sm",
        ghost: "hover:bg-muted bg-transparent text-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        premium: "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 rounded-lg",
        lg: "h-14 px-8 rounded-2xl text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        {...(props as any)}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
