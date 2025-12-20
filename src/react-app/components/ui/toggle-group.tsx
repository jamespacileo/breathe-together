import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "../../lib/utils";

const ToggleGroupContext = React.createContext<{
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
}>({
  size: "default",
  variant: "default",
});

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
    variant?: "default" | "outline";
    size?: "default" | "sm" | "lg";
  }
>(({ className, variant = "default", size = "default", children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-lg bg-white/5 p-1 gap-1",
      className
    )}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
    variant?: "default" | "outline";
    size?: "default" | "sm" | "lg";
  }
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-transparent text-white/60 hover:bg-white/10 hover:text-white data-[state=on]:bg-white/20 data-[state=on]:text-white":
            (variant || context.variant) === "default",
          "border border-white/20 bg-transparent text-white/60 hover:bg-white/10 hover:text-white data-[state=on]:bg-white/20 data-[state=on]:text-white":
            (variant || context.variant) === "outline",
        },
        {
          "h-9 px-3": (size || context.size) === "default",
          "h-8 px-2 text-xs": (size || context.size) === "sm",
          "h-10 px-4": (size || context.size) === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
