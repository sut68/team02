import { HTMLAttributes } from "react" 

// simple cn implementation (no external dependency)
function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ")
}

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // คลาสเริ่มต้น: ไม่มี "border" มี "shadow-sm" (เงาสีเทาอ่อน)
        "rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300",
        className // **รับ className เข้ามาและรวมเข้าด้วยกัน**
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// CardHeader, CardContent, และ CardFooter ยังคงเดิม
export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("mb-3 text-lg font-semibold text-gray-900", className)} {...props}>{children}</div>
}

export function CardContent({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("text-gray-600 text-sm", className)} {...props}>
            {children}
        </div>
    )
}

export function CardFooter({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("mt-4 flex items-center justify-end space-x-2", className)}
            {...props}
        >
            {children}
        </div>
    )
}