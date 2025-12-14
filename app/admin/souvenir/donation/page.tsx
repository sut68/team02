"use client";
import React, { useState, useEffect } from "react";
import { CATEGORY_LABEL } from "@/constants/category";

export const CATEGORY = {
  ACTIVITY: "ACTIVITY",
  DONATION: "DONATION",
} as const;
import Image from "next/image";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, Layers, CheckCircle, Package } from "lucide-react";

interface SouvenirItem {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  currentStock: number;
  unit?: string;
}

interface DonationProject {
  id: number;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  status: string;
  posterUrl: string | null;
}

interface Donation {
  id: number;
  userId: number;
  amount: number;
  donatedAt: string;
  purpose: string | null;
  status: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
  };
  souvenirItem?: {
    id: number;
    name: string;
    imageUrl: string | null;
    sku: string;
  } | null;
  shipments?: Array<{
    id: number;
    status: string;
    trackingNo: string | null;
    shippedAt: string | null;
  }>;
}
// Shipment status options and label helper
const STATUS_OPTIONS = [
  { value: "PENDING", label: "รอดำเนินการ" },
  { value: "IN_TRANSIT", label: "กำลังจัดส่ง" },
  { value: "DELIVERED", label: "จัดส่งแล้ว" },
  { value: "FAILED", label: "มีปัญหา" },
] as const;

const statusLabel = (s?: string) =>
  STATUS_OPTIONS.find(x => x.value === s)?.label ?? "รอดำเนินการ";

export default function SouvenirDonationPage() {
  const [souvenirItems, setSouvenirItems] = useState<SouvenirItem[]>([]);
  const [donationProjects, setDonationProjects] = useState<DonationProject[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'delivered'>('all');
  const [updatingShipmentId, setUpdatingShipmentId] = useState<number | null>(null);
  
  // Update shipment status function with confirmation
  const updateShipmentStatus = async (shipmentId: number, status: string, donationId: number) => {
    const statusObj = STATUS_OPTIONS.find(opt => opt.value === status);
    const statusLabelText = statusObj ? statusObj.label : status;
    const confirmed = window.confirm(`คุณต้องการเปลี่ยนสถานะการจัดส่งเป็น "${statusLabelText}" ใช่หรือไม่?`);
    if (!confirmed) return;
    try {
      setUpdatingShipmentId(shipmentId);
      const res = await fetch(`/api/admin/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("update shipment failed", res.status, text);
        return;
      }
      setDonations(prev =>
        prev.map(d => {
          if (d.id !== donationId) return d;
          const shipments = (d.shipments ?? []).map(s =>
            s.id === shipmentId ? { ...s, status } : s
          );
          return { ...d, shipments };
        })
      );
    } finally {
      setUpdatingShipmentId(null);
    }
  };
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const loopWidthRef = React.useRef(0);
  const cardWidthRef = React.useRef(0);
  const speedRef = React.useRef(50);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch souvenir items
        const itemsRes = await fetch('/api/admin/souvenir/items');
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (Array.isArray(itemsData)) {
            setSouvenirItems(itemsData.filter((item: SouvenirItem) => item.category === CATEGORY.DONATION));
          }
        }

        // Fetch donations
        const donationsRes = await fetch('/api/admin/donations');
        if (donationsRes.ok) {
          const donationsData = await donationsRes.json();
          if (Array.isArray(donationsData)) {
            setDonations(donationsData);
          }
        }

        // Fetch donation projects
        const projectsRes = await fetch('/api/donation-project?status=OPEN');
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          if (projectsData.projects && Array.isArray(projectsData.projects)) {
            setDonationProjects(projectsData.projects);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stepBy = (px: number) => {
    const loopW = loopWidthRef.current || 0;
    if (loopW <= 0) return;
    offsetRef.current += px;
    while (offsetRef.current >= loopW) offsetRef.current -= loopW;
    while (offsetRef.current < 0) offsetRef.current += loopW;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
    }
  };

  const handleNextDonation = () => {
    stepBy(cardWidthRef.current || 0);
  };

  const handlePrevDonation = () => {
    stepBy(-(cardWidthRef.current || 0));
  };

  const loopItems = React.useMemo(() => {
    const items = [...souvenirItems, ...souvenirItems, ...souvenirItems, ...souvenirItems];
    return items;
  }, [souvenirItems]);

  // Measure widths for seamless loop
  React.useEffect(() => {
    if (souvenirItems.length === 0) return;
    
    const measure = () => {
      const track = trackRef.current;
      const container = scrollContainerRef.current;
      if (!track || !container) return;
      
      // Force reflow
      track.offsetHeight;
      
      const fullWidth = track.scrollWidth;
      loopWidthRef.current = fullWidth / 4;
      const cols = window.innerWidth >= 768 ? 3 : 1;
      cardWidthRef.current = container.clientWidth / cols;
      
      console.log('Donation carousel measured:', { 
        fullWidth, 
        loopWidth: loopWidthRef.current, 
        cardWidth: cardWidthRef.current,
        itemsCount: souvenirItems.length 
      });
    };
    
    measure();
    const timer = setTimeout(measure, 100);
    
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [souvenirItems.length]);

  // Auto-scroll animation
  React.useEffect(() => {
    if (souvenirItems.length === 0) return;
    if (isPaused) return;
    
    let lastTime = performance.now();
    let rafId: number;

    const animate = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      
      const loopW = loopWidthRef.current;
      if (loopW > 0 && trackRef.current) {
        const distance = (speedRef.current * delta) / 1000;
        offsetRef.current += distance;
        while (offsetRef.current >= loopW) offsetRef.current -= loopW;
        while (offsetRef.current < 0) offsetRef.current += loopW;
        trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
      }
      
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, souvenirItems.length]);

  // Helper for formatting date (Thai)
  const formatDate = (d?: string | Date | null) => {
    if (!d) return "-";
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-white pt-10">
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">กำลังโหลด...</div>
        </div>
      ) : (
        <>
      {/* Section 1: รายการของที่ระลึกแต่ละโครงการบริจาค */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <h1 className="text-3xl font-medium text-gray-700 mb-8">
            จัดการของที่ระลึกสำหรับโครงการบริจาค
          </h1>
        </div>
        
        {/* Carousel Container */}
        {souvenirItems.length > 0 ? (
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative">
              <button
                onClick={handlePrevDonation}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              <div
                ref={scrollContainerRef}
                className="overflow-hidden py-4"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
              <div
                ref={trackRef}
                className="flex gap-6 will-change-transform"
                style={{ transform: 'translateX(0)', transition: 'none' }}
              >
                {loopItems.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="shrink-0 w-[90vw] md:w-[calc(33.333vw-32px)] lg:w-[calc(28vw-24px)] bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative h-72 md:h-80 bg-white">
                      <Image
                        src={item.imageUrl || '/souvenir/placeholder.png'}
                        alt={item.name}
                        fill
                        className="object-contain p-6"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
                        {item.name}
                      </h3>
                      <p className="text-orange-500 font-semibold mb-3 text-sm">
                        {item.category || 'บริจาค'}
                      </p>
                      <p className="text-gray-600 text-sm leading-relaxed mb-3 truncate">
                        {item.description || 'ของที่ระลึกสำหรับผู้บริจาค'}
                      </p>
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                        <span className="text-gray-500 text-sm">คงเหลือ:</span>
                        <span className="text-lg font-bold text-gray-800">{item.currentStock}</span>
                        <span className="text-gray-500 text-sm">{item.unit || 'ชิ้น'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

              <button
                onClick={handleNextDonation}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">ยังไม่มีของที่ระลึกสำหรับโครงการบริจาค</p>
            </div>
          </div>
        )}
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Section 2: โครงการบริจาค */}
        {/* Section 2: โครงการบริจาค (Carousel Style) */}
        <section className="mb-12">
          <h2 className="text-3xl font-medium text-gray-700 mb-8">โครงการบริจาค</h2>
          <div className="relative">
            {/* Arrow Left */}
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({
                    left: -scrollContainerRef.current.offsetWidth * 0.9,
                    behavior: 'smooth',
                  });
                }
              }}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="Previous donation project"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {/* Donation Project Cards Container - Carousel (manual scroll) */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto px-2 py-4 scrollbar-hide"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex gap-6">
                {donationProjects.length > 0 ? donationProjects.map((p, index) => (
                  <div
                    key={p.id}
                    className={
                      `shrink-0 w-[90vw] md:w-[calc(33.333vw-32px)] lg:w-[calc(28vw-24px)] bg-white rounded-xl transition-all duration-300 cursor-pointer ` +
                      `shadow-md hover:shadow-lg`
                    }
                  >
                    <div className="p-10 text-center min-h-[300px] flex flex-col items-center justify-center">
                      <h3 className="text-lg font-medium mb-3 text-orange-500">
                        {p.title}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Calendar className="w-5 h-5" />
                        <span className="text-base">
                          {formatDate(p.startDate)} – {formatDate(p.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="bg-gray-50 rounded-xl p-8 text-center w-full">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">ยังไม่มีโครงการบริจาคที่เปิดรับ</p>
                  </div>
                )}
              </div>
            </div>

            {/* Arrow Right */}
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({
                    left: scrollContainerRef.current.offsetWidth * 0.9,
                    behavior: 'smooth',
                  });
                }
              }}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="Next donation project"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </section>

        {/* Section 3: การ์ดสถิติการบริจาค */}
        <section className="mb-12">
          <h2 className="text-3xl font-medium text-gray-700 mb-8">
            การบริจาค
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Card 1: ทั้งหมด */}
            <div 
              onClick={() => setSelectedStatus('all')}
              className={`bg-white rounded-xl shadow-md border-2 transition-all duration-300 cursor-pointer min-h-[200px] flex items-center ${
                selectedStatus === 'all' 
                  ? 'border-orange-300 shadow-xl' 
                  : 'border-orange-100 hover:shadow-lg'
              }`}
            >
              <div className="p-10 text-center w-full">
                <div className="flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-orange-500" />
                </div>
                <div className={`text-5xl font-bold mb-2 ${
                  selectedStatus === 'all' ? 'text-orange-500' : 'text-gray-800'
                }`}>
                  {donations.length}
                </div>
                <div className={`font-medium ${
                  selectedStatus === 'all' ? 'text-orange-500' : 'text-gray-600'
                }`}>ทั้งหมด</div>
              </div>
            </div>

            {/* Card 2: รอดำเนินการ */}
            <div 
              onClick={() => setSelectedStatus('pending')}
              className={`bg-white rounded-xl shadow-md border-2 transition-all duration-300 cursor-pointer min-h-[200px] flex items-center ${
                selectedStatus === 'pending' 
                  ? 'border-orange-300 shadow-xl' 
                  : 'border-orange-100 hover:shadow-lg'
              }`}
            >
              <div className="p-10 text-center w-full">
                <div className="flex items-center justify-center mb-4">
                  <RefreshCw className="w-8 h-8 text-orange-500" />
                </div>
                <div className={`text-5xl font-bold mb-2 ${
                  selectedStatus === 'pending' ? 'text-orange-500' : 'text-gray-800'
                }`}>
                  {donations.filter(d => {
                    const shipmentStatus = d.shipments?.[0]?.status || 'PENDING';
                    return shipmentStatus === 'PENDING' || shipmentStatus === 'IN_TRANSIT' || shipmentStatus === 'FAILED';
                  }).length}
                </div>
                <div className={`font-medium ${
                  selectedStatus === 'pending' ? 'text-orange-500' : 'text-gray-600'
                }`}>รอดำเนินการ</div>
              </div>
            </div>

            {/* Card 3: จัดส่งแล้ว */}
            <div 
              onClick={() => setSelectedStatus('delivered')}
              className={`bg-white rounded-xl shadow-md border-2 transition-all duration-300 cursor-pointer min-h-[200px] flex items-center ${
                selectedStatus === 'delivered' 
                  ? 'border-orange-300 shadow-xl' 
                  : 'border-orange-100 hover:shadow-lg'
              }`}
            >
              <div className="p-10 text-center w-full">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-orange-500" />
                </div>
                <div className={`text-5xl font-bold mb-2 ${
                  selectedStatus === 'delivered' ? 'text-orange-500' : 'text-gray-800'
                }`}>
                  {donations.filter(d => {
                    const shipmentStatus = d.shipments?.[0]?.status || 'PENDING';
                    return shipmentStatus === 'DELIVERED';
                  }).length}
                </div>
                <div className={`font-medium ${
                  selectedStatus === 'delivered' ? 'text-orange-500' : 'text-gray-600'
                }`}>จัดส่งแล้ว</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: รายการผู้บริจาค */}
        <section>
          <h2 className="text-3xl font-medium text-gray-700 mb-8">
            รายการผู้บริจาค
          </h2>
          
          {donations.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="w-16 px-4 py-4 text-left text-sm font-medium text-gray-600">ลำดับ</th>
                      <th className="w-40 px-4 py-4 text-left text-sm font-medium text-gray-600">ชื่อ-สกุล</th>
                      <th className="w-48 px-4 py-4 text-left text-sm font-medium text-gray-600">อีเมล</th>
                      <th className="w-32 px-4 py-4 text-left text-sm font-medium text-gray-600">เบอร์โทร</th>
                      <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">ที่อยู่</th>
                      <th className="w-40 px-4 py-4 text-left text-sm font-medium text-gray-600">ของที่ระลึก</th>
                      <th className="w-32 px-4 py-4 text-left text-sm font-medium text-gray-600">เลขแทรก</th>
                      <th className="w-32 px-4 py-4 text-left text-sm font-medium text-gray-600">สถานะจัดส่ง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations
                      .filter(donation => {
                        if (selectedStatus === 'all') return true;
                        const shipmentStatus = donation.shipments?.[0]?.status || 'PENDING';
                        if (selectedStatus === 'delivered') return shipmentStatus === 'DELIVERED';
                        if (selectedStatus === 'pending') return shipmentStatus !== 'DELIVERED';
                        return true;
                      })
                      .map((donation, index) => {
                      const donatedDate = new Date(donation.donatedAt);
                      const thaiDate = donatedDate.toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      
                      const fullAddress = `${donation.user.address} ต.${donation.user.subdistrict} อ.${donation.user.district} จ.${donation.user.province} ${donation.user.postalCode}`;
                      const souvenirName = donation.souvenirItem?.name || '-';
                      const trackingNo = donation.shipments?.[0]?.trackingNo || '-';
                      const shipmentStatus = donation.shipments?.[0]?.status || 'PENDING';
                      
                      let statusText = 'รอดำเนินการ';
                      let statusColor = 'bg-gray-100 text-gray-700';
                      
                      if (shipmentStatus === 'DELIVERED') {
                        statusText = 'จัดส่งแล้ว';
                        statusColor = 'bg-orange-100 text-orange-700';
                      }
                      
                      return (
                        <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm text-gray-800 text-center">{index + 1}</td>
                          <td className="px-4 py-4 text-sm text-gray-800 font-medium truncate" title={donation.user.fullName}>{donation.user.fullName}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 truncate" title={donation.user.email}>{donation.user.email}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{donation.user.phone}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 truncate" title={fullAddress}>
                            {fullAddress}
                          </td>
                          <td className="px-4 py-4 text-sm text-orange-600 truncate" title={souvenirName}>{souvenirName}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 truncate" title={trackingNo}>{trackingNo}</td>
                          <td className="px-4 py-4">
                            {donation.shipments?.[0]?.id ? (
                              <div className="relative inline-block">
                                <select
                                  value={donation.shipments?.[0]?.status ?? "PENDING"}
                                  disabled={updatingShipmentId === donation.shipments[0].id}
                                  onChange={(e) =>
                                    updateShipmentStatus(
                                      donation.shipments![0].id,
                                      e.target.value,
                                      donation.id
                                    )
                                  }
                                  className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium border-0 outline-none cursor-pointer transition-colors
                                    ${donation.shipments?.[0]?.status === 'PENDING'
                                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      : donation.shipments?.[0]?.status === 'DELIVERED'
                                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                      : 'bg-red-100 text-red-700 hover:bg-red-200'}
                                  `}
                                >
                                  <option value="PENDING">รอดำเนินการ</option>
                                  <option value="DELIVERED">จัดส่งแล้ว</option>
                                </select>
                                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">ยังไม่มีรายการบริจาค</p>
            </div>
          )}
        </section>
      </div>
        </>
      )}
    </main>
  );
}
