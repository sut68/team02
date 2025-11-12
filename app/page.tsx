// page.tsx

import * as React from "react"
import { Card, CardHeader, CardContent, CardFooter } from "./components/ui/Card"

export default function Page() {
  return (
    <main className="p-8 min-h-screen bg-gray-50">
      
      {/* Container หลัก พร้อมเว้นระยะห่างระหว่าง Card */}
      <div className="max-w-2xl mx-auto space-y-6"> 
        
        {/* 1. Card ใบแรก (เงาปกติ) */}
        <Card className="w-[300px]">  
          <CardHeader>  </CardHeader>
          <CardContent>
           
          </CardContent>
          <CardFooter>  </CardFooter>
        </Card>
        
        {/* 2. Card ใบที่สอง (เงาสีส้ม) */}
        <Card 
          className={
            // เราเขียนทับ/เพิ่มคลาสเงาที่นี่
            "w-[300px] shadow-lg shadow-orange-300/20 hover:shadow-lg hover:shadow-orange-400/30"
          }
        > 
          <CardHeader>  </CardHeader>
          <CardContent>
            
          </CardContent>
          <CardFooter>  </CardFooter>
        </Card>

        {/* 3. Card  () */}
        <Card className="w-[300px] !bg-gray-200 rounded-none">
    <CardHeader>
    </CardHeader>
    <CardContent>
    </CardContent>
    <CardFooter>
    </CardFooter>
</Card>
          <Card className="w-[300px] bg-white rounded-xl shadow-soft-ring **hover:shadow-lg** **transition-shadow**">
    <CardHeader> </CardHeader>
    <CardContent>
        {/* ... เนื้อหาของคุณ ... */}
    </CardContent>
    <CardFooter> </CardFooter>
</Card>



        
      </div>
    </main>
  )
}