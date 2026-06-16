/**
 * @file src/components/ui/button.tsx
 * @description Shadcn/ui Button component for TrendHub
 * @author TrendHub Engineering
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-cyan-500 text-white shadow hover:bg-cyan-600 active:scale-95",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-95",
        outline:
          "border border-slate-700 bg-transparent shadow-sm hover:bg-slate-800 hover:text-white active:scale-95",
        secondary:
          "bg-slate-800 text-slate-100 shadow-sm hover:bg-slate-700 active:scale-95",
        ghost: "hover:bg-slate-800 hover:text-white active:scale-95",
        link: "text-cyan-400 underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 text-white shadow hover:opacity-90 active:scale-95",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-9 w-9",
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
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
