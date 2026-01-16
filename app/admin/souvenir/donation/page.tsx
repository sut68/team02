"use client";
import React, { useState, useEffect } from "react";
import { CATEGORY_LABEL } from "@/constants/category";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, Layers, CheckCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";

// --- Interfaces ---
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
  startDate: string;
  souvenirItem?: {
    id: number;
    name: string;
    imageUrl: string | null;
    sku: string;
  } | null;
}

interface Donation {
  id: number;
  userId: number;
  donatedAt: string;
  user: {
    fullName: string;
    phone?: string;
    address?: string;
    subdistrict?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
  souvenirItem?: {
    id: number;
    name: string;
    imageUrl: string | null;
    sku: string;
  } | null;
  shipments: Array<{
    id: number;
    status: string;
    trackingNo: string | null;
    shippedAt: string | null;
  }>;
}

// Shipment status options
const STATUS_OPTIONS = [
  { value: "PENDING", label: "รอดำเนินการ" },
  { value: "DELIVERED", label: "จัดส่งแล้ว" },
] as const;


export default function SouvenirDonationPage() {
  // Data States
  const [souvenirItems, setSouvenirItems] = useState<SouvenirItem[]>([]);
  const [donationProjects, setDonationProjects] = useState<DonationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DonationProject | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'remaining' | 'registered' | 'claimed'>('registered');
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ Edit State Management per Shipment
  const [editModes, setEditModes] = useState<Map<number, {
    enabled: boolean;
    trackingNo: string;
    status: string;
    saving: boolean;
  }>>(new Map());
  
  // Carousel refs
  const projectScrollRef = React.useRef<HTMLDivElement>(null);
  const souvenirScrollRef = React.useRef<HTMLDivElement>(null);
  const souvenirTrackRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const loopWidthRef = React.useRef(0);
  const cardWidthRef = React.useRef(0);
  const speedRef = React.useRef(50);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Souvenir Items
        const itemsRes = await fetch('/api/admin/souvenir/items');
        const itemsData = itemsRes.ok ? await itemsRes.json() : [];
        if (Array.isArray(itemsData)) {
          setSouvenirItems(itemsData.filter((item: SouvenirItem) => item.category === 'DONATION'));
        }
        // Fetch Projects
        const projectsRes = await fetch('/api/donation-project?status=OPEN');
        const projectsData = projectsRes.ok ? await projectsRes.json() : {};
        // Filter out CENTRAL type projects
        const projectsList: DonationProject[] = (projectsData.projects || []).filter((p: any) => p.projectType !== 'CENTRAL');
        setDonationProjects(projectsList);
        if (projectsList.length > 0) setSelectedProject(projectsList[0]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch donations when project is selected
  useEffect(() => {
    const fetchDonations = async () => {
      if (!selectedProject) return;
      try {
        const res = await fetch(`/api/donation-project/${selectedProject.id}/donations`);
        if (res.ok) {
          const data = await res.json();
          setDonations(data);
        }
      } catch (error) {
        console.error('Error fetching donations:', error);
      }
    };
    fetchDonations();
  }, [selectedProject]);

  // Carousel logic
  const stepBy = (px: number) => {
    const loopW = loopWidthRef.current || 0;
    if (loopW <= 0) return;
    offsetRef.current += px;
    while (offsetRef.current >= loopW) offsetRef.current -= loopW;
    while (offsetRef.current < 0) offsetRef.current += loopW;
    if (souvenirTrackRef.current) {
      souvenirTrackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
    }
  };
  const loopItems = React.useMemo(() => [...souvenirItems, ...souvenirItems, ...souvenirItems, ...souvenirItems], [souvenirItems]);
  React.useEffect(() => {
    if (souvenirItems.length === 0) return;
    const measure = () => {
      const track = souvenirTrackRef.current;
      if (!track) return;
      track.offsetHeight;
      const firstCard = track.querySelector('[data-souvenir-card]');
      const gap = parseFloat(getComputedStyle(track).gap || '0');
      if (firstCard) cardWidthRef.current = (firstCard as HTMLElement).offsetWidth + gap;
      loopWidthRef.current = track.scrollWidth / 4;
    };
    measure();
    const timer = setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(timer); window.removeEventListener('resize', measure); };
  }, [souvenirItems.length]);
  React.useEffect(() => {
    if (souvenirItems.length === 0 || isPaused) return;
    let lastTime = performance.now();
    let rafId: number;
    const animate = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      const loopW = loopWidthRef.current;
      if (loopW > 0 && souvenirTrackRef.current) {
        const distance = (speedRef.current * delta) / 1000;
        offsetRef.current += distance;
        while (offsetRef.current >= loopW) offsetRef.current -= loopW;
        while (offsetRef.current < 0) offsetRef.current += loopW;
        souvenirTrackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, souvenirItems.length]);

  // Calculate delivered count
  const deliveredCount = React.useMemo(() => {
    return donations.filter(d => d.shipments[0]?.status === 'DELIVERED').length;
  }, [donations]);

  // Filtered donations by status
  const filteredDonations = React.useMemo(() => {
    if (!selectedProject) return [];
    return donations.filter(d => {
      const delivered = d.shipments[0]?.status === 'DELIVERED';
      if (selectedStatus === 'remaining') return !delivered;  // Not delivered
      if (selectedStatus === 'claimed') return delivered;      // Delivered
      if (selectedStatus === 'registered') return true;        // All donations
      return true;
    });
  }, [donations, selectedProject, selectedStatus]);

  // Filtered donations by search term
  const searchedDonations = React.useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return filteredDonations;
    return filteredDonations.filter(d => {
      const fullName = d.user.fullName?.toLowerCase() || '';
      const phone = d.user.phone?.toLowerCase() || '';
      const address = `${d.user.address || ''} ${d.user.subdistrict || ''} ${d.user.district || ''} ${d.user.province || ''}`.toLowerCase();
      return fullName.includes(term) || phone.includes(term) || address.includes(term);
    });
  }, [filteredDonations, searchTerm]);

  return (
    <main className="min-h-screen bg-white pt-10">
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">กำลังโหลด...</div>
        </div>
      ) : (
        <>
          {/* Section 1: Carousel ของที่ระลึก */}
          <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                จัดการของที่ระลึกสำหรับโครงการบริจาค
              </h1>
            </div>
            <div className="max-w-7xl mx-auto px-4">
              <div className="relative">
                <button onClick={() => { setIsPaused(true); stepBy(-cardWidthRef.current); }}
                  onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all">
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div ref={souvenirScrollRef} className="overflow-hidden py-4" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
                  <div ref={souvenirTrackRef} className="flex gap-6 will-change-transform" style={{ transform: 'translateX(0)', transition: 'none' }}>
                    {loopItems.map((item, index) => (
                      <div data-souvenir-card key={`${item.id}-${index}`} className="shrink-0 w-[90vw] md:w-[calc(33.333vw-32px)] lg:w-[calc(28vw-24px)]">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                          <div className="relative h-72 md:h-80 bg-white flex items-center justify-center">
                            {item.imageUrl ? (
                              <Image src={item.imageUrl} alt={item.name} width={600} height={600} className="max-h-[75%] w-auto object-contain" />
                            ) : (
                              <div className="text-center text-gray-400">
                                <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <span className="text-xs">ไม่มีรูปภาพ</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="pt-6 pb-8 text-center">
                          <h3 className="text-xl md:text-2xl font-bold text-orange-500 mb-2 line-clamp-1">{item.name}</h3>
                          <div className="text-gray-500 text-sm mb-2">จำนวนคงเหลือ: <span className="font-semibold">{item.currentStock}</span> {item.unit || "ชิ้น"}</div>
                          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm bg-orange-100 text-orange-700 font-medium">ใช้งาน</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setIsPaused(true); stepBy(cardWidthRef.current); }}
                  onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all">
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Section 2: เลือกโครงการบริจาค (Clickable Cards) */}
            <section className="mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">โครงการบริจาค</h2>
              <div className="relative">
                <button onClick={() => projectScrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all">
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div ref={projectScrollRef} className="overflow-x-auto px-2 py-4 scrollbar-hide flex gap-6" style={{ scrollBehavior: 'smooth' }}>
                  {donationProjects.length > 0 ? donationProjects.map((p, index) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProject(p);
                        setCurrentProjectIndex(index);
                      }}
                      className={`shrink-0 w-[90vw] md:w-[calc(33.333vw-32px)] lg:w-[calc(28vw-24px)] bg-white rounded-xl transition-all duration-300 cursor-pointer ${selectedProject?.id === p.id ? "shadow-xl" : "shadow-md hover:shadow-lg"}`}
                    >
                      <div className="p-10 text-center min-h-[250px] flex flex-col items-center justify-center">
                        <h3 className={`text-lg font-medium mb-3 text-orange-500`}>{p.title}</h3>
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <Calendar className="w-5 h-5" />
                          <span className="text-base">{new Date(p.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="w-full text-center text-gray-500">ไม่มีโครงการบริจาคที่เปิดรับ</div>
                  )}
                </div>
                <button onClick={() => projectScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:scale-110 transition-all">
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </section>

            {/* Section 3 & 4: Only show when project is selected */}
            {selectedProject && (
              <>
                {/* Section 3: สถิติของโครงการที่เลือก */}
                <section>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{selectedProject.title}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: ทั้งหมด */}
                    <Card
                      className={`cursor-pointer border-2 transition ${selectedStatus === 'registered' ? 'border-orange-300' : 'border-orange-100'}`}
                      onClick={() => setSelectedStatus('registered')}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-4">
                          <Layers className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-normal text-gray-700">ทั้งหมด</h3>
                        <p className="text-2xl font-medium text-gray-800 mt-2">{donations.length}</p>
                      </CardContent>
                    </Card>

                    {/* Card 2: คงเหลือ */}
                    <Card
                      className={`cursor-pointer border-2 transition ${selectedStatus === 'remaining' ? 'border-orange-300' : 'border-orange-100'}`}
                      onClick={() => setSelectedStatus('remaining')}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-4">
                          <RefreshCw className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-normal text-gray-700">คงเหลือ</h3>
                        <p className="text-2xl font-medium text-gray-800 mt-2">
                          {donations.filter(d => d.shipments[0]?.status !== 'DELIVERED').length}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Card 3: จัดส่งแล้ว */}
                    <Card
                      className={`cursor-pointer border-2 transition ${selectedStatus === 'claimed' ? 'border-orange-300' : 'border-orange-100'}`}
                      onClick={() => setSelectedStatus('claimed')}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-4">
                          <CheckCircle className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-normal text-gray-700">จัดส่งแล้ว</h3>
                        <p className="text-2xl font-medium text-gray-800 mt-2">{deliveredCount}</p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Section 4: Search & Table */}
                <section className="mt-12">
                  {/* Search Bar */}
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          placeholder="ค้นหาด้วยชื่อ อีเมล เบอร์โทร หรือที่อยู่"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12"
                          size="md"
                          radius="md"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-200">
                            <th className="px-3 py-3 text-left text-xs md:text-sm font-medium text-gray-600 min-w-10">ลำดับ</th>
                            <th className="px-3 py-3 text-left text-xs md:text-sm font-medium text-gray-600 min-w-[100px]">ชื่อ-สกุล</th>
                            <th className="px-3 py-3 text-left text-xs md:text-sm font-medium text-gray-600 min-w-[140px]">ที่อยู่</th>
                            <th className="px-3 py-3 text-left text-xs md:text-sm font-medium text-gray-600 min-w-[90px]">เบอร์โทร</th>
                            <th className="px-3 py-3 text-left text-xs md:text-sm font-medium text-gray-600 min-w-[100px]">วันที่บริจาค</th>
                            <th className="px-3 py-3 text-left text-xs md:text-sm font-medium text-gray-600 min-w-[110px]">ของที่ระลึก</th>
                            <th className="px-3 py-3 text-left text-xs md:text-sm font-medium text-gray-600 min-w-[100px]">สถานะ</th>
                            <th className="px-3 py-3 text-left text-xs md:text-sm font-medium text-gray-600 min-w-[130px]">เลขแทรก</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchedDonations.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                                {searchTerm ? 'ไม่พบผลการค้นหา' : 'ไม่มีรายการขอรับของที่ระลึกในโครงการนี้'}
                              </td>
                            </tr>
                          ) : (
                            searchedDonations.map((donation, index) => {
                              const donatedDate = new Date(donation.donatedAt);
                              const thaiDate = donatedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                              const hasShipment = donation.shipments.length > 0;
                              const shipment = hasShipment ? donation.shipments[0] : null;
                              const shipmentId = shipment?.id || 0;
                              const status = shipment?.status || 'PENDING';
                              const trackingNo = shipment?.trackingNo;
                              const souvenirName = donation.souvenirItem?.name || selectedProject.souvenirItem?.name || 'ของที่ระลึกบริจาค';
                              const fullAddress = [
                                donation.user.address,
                                donation.user.subdistrict,
                                donation.user.district,
                                donation.user.province,
                                donation.user.postalCode
                              ].filter(Boolean).join(' ') || '-';
                              
                              // ✅ ดึง edit state จาก editModes Map
                              const editState = editModes.get(shipmentId) || {
                                enabled: false,
                                trackingNo: trackingNo || '',
                                status: status,
                                saving: false
                              };

                              const updateEditState = (newState: Partial<typeof editState>) => {
                                setEditModes(prev => new Map(prev).set(shipmentId, { ...editState, ...newState }));
                              };

                              const handleStatusChange = async () => {
                                // ตรวจสอบ: ถ้าเปลี่ยนเป็น DELIVERED ต้องมี tracking number
                                if (editState.status === 'DELIVERED' && !editState.trackingNo.trim()) {
                                  alert('ต้องใส่เลขแทรกก่อนที่จะเปลี่ยนสถานะเป็นจัดส่งแล้ว');
                                  return;
                                }

                                // ตรวจสอบ: ห้ามเปลี่ยนจาก DELIVERED กลับไปเป็น PENDING
                                if (status === 'DELIVERED' && editState.status !== 'DELIVERED') {
                                  alert('ไม่สามารถเปลี่ยนสถานะจากจัดส่งแล้วกลับไปได้');
                                  updateEditState({ status });
                                  return;
                                }

                                updateEditState({ saving: true });
                                try {
                                  const res = await fetch(`/api/admin/shipments/${shipmentId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      status: editState.status,
                                      trackingNo: editState.trackingNo || null
                                    })
                                  });

                                  if (!res.ok) {
                                    const err = await res.json();
                                    alert(`เกิดข้อผิดพลาด: ${err.error}`);
                                    updateEditState({ status, trackingNo: trackingNo || '', saving: false });
                                    return;
                                  }

                                  updateEditState({ enabled: false, saving: false });
                                  // Refresh data
                                  if (selectedProject) {
                                    const projectRes = await fetch(`/api/donation-project/${selectedProject.id}/donations`);
                                    if (projectRes.ok) {
                                      const data = await projectRes.json();
                                      setDonations(data.donations || []);
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error updating shipment:', error);
                                  alert('เกิดข้อผิดพลาด');
                                  updateEditState({ status, trackingNo: trackingNo || '', saving: false });
                                }
                              };

                              return (
                                <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-3 py-2 text-xs md:text-sm text-gray-800">{index + 1}</td>
                                  <td className="px-3 py-2 text-xs md:text-sm text-gray-800 font-medium truncate">{donation.user.fullName}</td>
                                  <td className="px-3 py-2 text-xs md:text-sm text-gray-600 truncate" title={fullAddress}>{fullAddress}</td>
                                  <td className="px-3 py-2 text-xs md:text-sm text-gray-600">{donation.user.phone || '-'}</td>
                                  <td className="px-3 py-2 text-xs md:text-sm text-gray-600">{thaiDate}</td>
                                  <td className="px-3 py-2 text-xs md:text-sm text-orange-600 truncate">{souvenirName}</td>
                                  <td className="px-3 py-2">
                                    {editState.enabled ? (
                                      <div className="inline-flex items-center gap-1 px-2 py-1 border border-orange-200 rounded-full text-xs font-medium focus-within:ring-2 focus-within:ring-orange-500 outline-none bg-white">
                                        <select
                                          value={editState.status}
                                          onChange={(e) => updateEditState({ status: e.target.value })}
                                          className="bg-transparent cursor-pointer outline-none flex-1 appearance-none"
                                          disabled={editState.saving || status === 'DELIVERED'}
                                        >
                                          <option value="PENDING">รอดำเนินการ</option>
                                          <option value="DELIVERED" disabled={!editState.trackingNo.trim()}>จัดส่งแล้ว</option>
                                        </select>
                                        <svg className="w-3 h-3 shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5" />
                                        </svg>
                                      </div>
                                    ) : (
                                      <span 
                                        onClick={() => updateEditState({ enabled: true, status, trackingNo: trackingNo || '' })}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:shadow-md"
                                        style={{
                                          backgroundColor: status === 'DELIVERED' ? '#fed7aa' : '#f3f4f6',
                                          color: status === 'DELIVERED' ? '#92400e' : '#374151'
                                        }}
                                      >
                                        <span>
                                          {status === 'PENDING' ? 'รอดำเนินการ' : 'จัดส่งแล้ว'}
                                        </span>
                                        {status === 'PENDING' && (
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5" />
                                          </svg>
                                        )}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {editState.enabled ? (
                                      <div className="space-y-1 min-w-[120px]">
                                        <input
                                          type="text"
                                          value={editState.trackingNo}
                                          onChange={(e) => updateEditState({ trackingNo: e.target.value })}
                                          placeholder="เลขแทรก"
                                          className="w-full px-2 py-1 border border-orange-200 rounded text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                                          disabled={editState.saving}
                                        />
                                        <div className="flex gap-1">
                                          <button
                                            onClick={handleStatusChange}
                                            disabled={editState.saving}
                                            className="flex-1 px-2 py-1 bg-orange-500 text-white text-xs rounded font-medium hover:bg-orange-600 disabled:bg-gray-400"
                                          >
                                            {editState.saving ? '...' : 'บันทึก'}
                                          </button>
                                          <button
                                            onClick={() => updateEditState({ enabled: false, status, trackingNo: trackingNo || '' })}
                                            disabled={editState.saving}
                                            className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded font-medium hover:bg-gray-400 disabled:bg-gray-200"
                                          >
                                            ยกเลิก
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-xs font-medium text-gray-700 break-all">
                                        {trackingNo || '-'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}