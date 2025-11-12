import * as React from "react"
import { Input } from "./Input"
import { cn } from "@/app/lib/utils"
import { LucideIcon } from "lucide-react"

interface InputIconProps extends React.ComponentProps<typeof Input> {
  icon?: LucideIcon; 
  iconPosition?: "left" | "right";
}

const InputIcon = React.forwardRef<HTMLInputElement, InputIconProps>(
  ({ icon: Icon, iconPosition = "left", className, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {/* แสดง Icon หากมีการส่งเข้ามา */}
        {Icon && (
          <div
            className={`
              absolute top-1/2 -translate-y-1/2 text-muted-foreground z-10
              ${iconPosition === "left" ? "left-3" : "right-3"}
            `}
          >
            <Icon size={18} /> {/* ขนาดไอคอน 18px */}
          </div>
        )}
        
        {/* Render Input Component เดิมของคุณ */}
        <Input
          ref={ref}
          // เพิ่ม padding ด้านซ้ายหรือขวาของ Input เพื่อหลีกเลี่ยงการทับซ้อนกับ Icon
          className={cn(
            iconPosition === "left" && Icon ? "pl-10" : "", // ถ้า icon อยู่ซ้าย เพิ่ม padding ซ้าย
            iconPosition === "right" && Icon ? "pr-10" : "", // ถ้า icon อยู่ขวา เพิ่ม padding ขวา
            className // Class ที่ user ส่งเข้ามา
          )}
          {...props}
        />
      </div>
    )
  }
)

InputIcon.displayName = "InputIcon"

export { InputIcon }