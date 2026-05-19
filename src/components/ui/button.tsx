import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border text-sm font-medium transition-all duration-150 outline-none disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-[0_10px_28px_rgba(238,243,255,0.12)] hover:-translate-y-0.5",
        outline:
          "border-border bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:border-border-strong hover:bg-white/8",
        ghost:
          "border-transparent bg-transparent text-foreground hover:-translate-y-0.5 hover:bg-white/6",
        destructive:
          "border-destructive/35 bg-destructive/12 text-destructive-foreground hover:-translate-y-0.5 hover:bg-destructive/18"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6",
        icon: "size-10 rounded-full"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      type={type}
      {...props}
    />
  );
}

export { Button, buttonVariants };
