// app/components/Footer.tsx
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-[#222222] text-[#f5f5f5] font-(family-name:--font-roboto)">
      <div className="mx-auto max-w-7xl px-8 py-12">
        {/* แถวหลัก 3 คอลัมน์ */}
        <div className="grid gap-12 md:grid-cols-3 lg:gap-20">
          {/* ===== คอลัมน์ซ้าย ===== */}
          <div className="flex flex-col">
            {/* โลโก้ + ชื่อสำนักวิชา */}
            <div className="mb-8">
              <div className="relative h-20 w-full max-w-sm">
                <Image
                  src="/ENGi Lettermark-TH-White.png"
                  alt="SUT Engineering"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>
            
            {/* ที่อยู่ */}
            <div className="space-y-0.5 text-sm text-zinc-300 mb-8">
              <p>อาคารวิชาการ 1</p>
              <p>มหาวิทยาลัยเทคโนโลยีสุรนารี</p>
              <p>111 ถ.มหาวิทยาลัย ต.สุรนารี</p>
              <p>อ.เมือง จ.นครราชสีมา 30000</p>
            </div>
            
            {/* เบอร์ + เมล */}
            <div className="space-y-1 text-sm text-zinc-300 mb-10">
              <a href="tel:+6644224224" className="hover:text-white block">
                +66 4422 4224
              </a>
              <a 
                href="mailto:jeadmin@g.sut.ac.th" 
                className="underline underline-offset-2 hover:text-white block"
              >
                ieadmin@g.sut.ac.th
              </a>
            </div>
            
            {/* เส้นส้ม */}
            <div className="h-0.5 w-full max-w-md bg-[#E85D1F]" />
          </div>

          {/* ===== คอลัมน์กลาง ===== */}
          <div className="ml-20 flex flex-col">
            <h3 className="text-lg font-normal text-white mb-3">
              ข้อมูลเกี่ยวกับ
            </h3>
            <div className="h-0.5 w-full bg-[#E85D1F] mb-6" />
            <ul className="space-y-4 text-sm text-zinc-300">
              <li className="hover:text-white cursor-pointer">แนะนำ AlumniConnect</li>
              <li className="hover:text-white cursor-pointer">ข่าวสารและกิจกรรม</li>
              <li className="hover:text-white cursor-pointer">โครงการระดมทุนและการบริจาค</li>
              <li className="hover:text-white cursor-pointer">การติดตามงบประมาณและรายงานการใช้จ่าย</li>
              <li className="hover:text-white cursor-pointer">ของที่ระลึกศิษย์เก่า</li>
            </ul>
          </div>

          {/* ===== คอลัมน์ขวา ===== */}
          <div className="ml-25 flex flex-col">
            <h3 className="text-lg font-normal text-white mb-3">
              ข้อมูลสำหรับ
            </h3>
            <div className="h-0.5 w-70 bg-[#E85D1F] mb-6" />
            <ul className="space-y-4 text-sm text-zinc-300">
              <li className="hover:text-white cursor-pointer">ศิษย์เก่าและสมาชิก AlumniConnect</li>
              <li className="hover:text-white cursor-pointer">นักศึกษาปัจจุบันที่ต้องการเข้าร่วมเครือข่าย</li>
              <li className="hover:text-white cursor-pointer">ผู้บริจาคและผู้สนับสนุนโครงการ</li>
              <li className="hover:text-white cursor-pointer">หน่วยงานภาคี / ผู้ร่วมมือทางธุรกิจ</li>
              <li className="hover:text-white cursor-pointer">คณาจารย์และเจ้าหน้าที่</li>
            </ul>
          </div>
        </div>

        {/* แถวล่าง: Copyright ซ้าย + Social Icons ขวา */}
        <div className="mt-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Copyright */}
          <p className="text-sm text-zinc-300">
            © 2025 AlumniConnect – Institute of Engineering, Suranaree University of Technology
          </p>
          
          {/* Social Icons */}
          <div className="flex md-auto mr-0">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/EngineeringSUT/?locale=th_TH"
              aria-label="Facebook"
              className="flex h-11 w-11 items-center justify-center rounded-full  text-white transition hover:bg-zinc-300"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://www.instagram.com/engineering.sut/#"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-zinc-300"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
              </svg>
            </a>
            {/* YouTube */}
            <a
              href="https://www.youtube.com/watch?v=dhI9mhN3TxM"
              aria-label="YouTube"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-zinc-300"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}