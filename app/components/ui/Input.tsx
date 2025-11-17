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
  ({ className, type, size = "md", radius = "md", ...props }, ref) => {
    const sizeCls =
      size === "sm" ? "h-7 text-sm px-3" :
      size === "md" ? "px-4 py-3 text-sm" :
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
          "w-full border border-gray-300 bg-transparent placeholder-gray-400 transition-all outline-none",
          "focus:outline-none focus:border-orange-400",
          "disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50",
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
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