// {/* กำหนดความกว้าง 200px */}
// <Input className="w-[200px]" placeholder="กว้าง 200px" />

// {/* กำหนดความกว้างตามเนื้อหาข้างใน (w-auto) */}
// <Input className="w-auto" placeholder="สั้นเท่าตัวอักษร" />

// {/* กำหนดความกว้างครึ่งหน้าจอ (w-1/2) */}
// <Input className="w-1/2" placeholder="กว้าง 50%" />


import * as React from "react"
import { cn } from "@/app/lib/utils"

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: "sm" | "md" | "lg"
  radius?: "none" | "md" | "full"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "md", radius = "full", ...props }, ref) => {
    const sizeCls =
      size === "sm" ? "h-7 text-sm px-3" :
      size === "md" ? "h-9 text-sm px-4 py-2" :
      "h-11 text-base px-4 py-2"

    const radiusCls =
      radius === "none" ? "rounded-none" :
      radius === "md" ? "rounded-md" :
      "rounded-full"

    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input",
          "w-full min-w-0 border bg-transparent shadow-xs transition-[color,box-shadow] outline-none",
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:border-primary focus-visible:ring-1",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          sizeCls,
          radiusCls,
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }