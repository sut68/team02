'use client';

import type { Metadata } from "next";
import localFont from "next/font/local"; // ✅ นำเข้า localFont
import "./globals.css";
import Footer from "./components/layout/Footer";
import Navbar from "./components/layout/Navbar";
import { usePathname } from "next/navigation";


const sutFont = localFont({
  src: [
    {
      path: "../public/SUT_font/Noto_Sans_Thai/static/NotoSansThai/NotoSansThai-Light.ttf", 
      weight: '300', 
      style: 'normal',
    },
    {
      path: "../public/SUT_font/Noto_Sans_Thai/static/NotoSansThai/NotoSansThai-Regular.ttf", 
      weight: '400', 
      style: 'normal',
    },
    {

      path: "../public/SUT_font/Noto_Sans_Thai/static/NotoSansThai/NotoSansThai-Bold.ttf", 
      weight: '700', 
      style: 'normal',
    },
  ],
  display: "swap",
  variable: "--font-sut", 
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={sutFont.variable}>
      <body
        className={`${sutFont.className} antialiased`} 
        suppressHydrationWarning={true}
      >
       
        <div className="flex min-h-screen flex-col">
          <Navbar />
          
          <main className="flex-1 md:pt-[100px] lg:pt-[96px]">
            {children}
          </main>
          
          <ConditionalFooter />
        </div>
      </body>
    </html>
  );
}

function ConditionalFooter() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  
  if (isAdminPage) return null;
  return <Footer />;
}