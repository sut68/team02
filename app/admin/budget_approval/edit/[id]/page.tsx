"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/app/components/ui/Input';
import { InputIcon } from '@/app/components/ui/InputIcon';
import { Textarea } from '@/app/components/ui/InputTextArea';
import { CancelButton, PrimaryButton } from '@/app/components/ui/Button';
import SuccessModal from '@/app/components/ui/SuccessModal';
import { Image as ImageIcon } from 'lucide-react';

export default function EditPage() {
  const router = useRouter();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  
  const [project, setProject] = useState<any>({});
  const [manager, setManager] = useState<any>({});
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/project-proposal?id=${id}`)
      .then(res => res.json())
      .then(data => {
        const p = data.proposal;
        setProject({
            ...p,
            projectStartDate: p.projectStartDate?.split('T')[0],
            projectEndDate: p.projectEndDate?.split('T')[0]
        });
        setManager(p.manager || {});
        setPreview(p.coverFilePath);
      });
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "budget/upload");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setProject({ ...project, coverFilePath: data.url });
        setPreview(data.url);
      }
    }
  };

  const handleSubmit = async () => {
    const res = await fetch("/api/project-proposal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...project, manager })
    });
    if (res.ok) setShowModal(true);
    else alert("แก้ไขไม่สำเร็จ");
  };

  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <SuccessModal show={showModal} onClose={() => router.push('/admin/budget_approval')} message="แก้ไขสำเร็จ" />
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">แก้ไขโครงการ</h1>

        {step === 1 ? (
            <div className="space-y-5">
                <Input value={project.projectName || ''} onChange={e => setProject({...project, projectName: e.target.value})} placeholder="ชื่อโครงการ" />
                <Input value={project.responsibilityUnit || ''} onChange={e => setProject({...project, responsibilityUnit: e.target.value})} placeholder="หน่วยงาน" />
                <div className="grid grid-cols-2 gap-4">
                    <Input value={project.objective || ''} onChange={e => setProject({...project, objective: e.target.value})} placeholder="วัตถุประสงค์" />
                    <Input type="number" value={project.requestedAmount || ''} onChange={e => setProject({...project, requestedAmount: e.target.value})} placeholder="งบประมาณ" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <InputIcon type="date" value={project.projectStartDate || ''} onChange={e => setProject({...project, projectStartDate: e.target.value})} />
                    <InputIcon type="date" value={project.projectEndDate || ''} onChange={e => setProject({...project, projectEndDate: e.target.value})} />
                </div>
                <Textarea value={project.description || ''} onChange={e => setProject({...project, description: e.target.value})} placeholder="รายละเอียด" />
                
                <div className="border h-48 flex justify-center items-center rounded-xl cursor-pointer" onClick={() => document.getElementById('edit-file')?.click()}>
                    {preview ? <img src={preview} className="h-full object-contain" /> : <ImageIcon />}
                    <input id="edit-file" type="file" className="hidden" onChange={handleUpload} />
                </div>

                <div className="flex justify-end gap-4">
                    <CancelButton onClick={() => router.back()}>ยกเลิก</CancelButton>
                    <PrimaryButton onClick={() => setStep(2)}>ถัดไป</PrimaryButton>
                </div>
            </div>
        ) : (
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <Input value={manager.firstName || ''} onChange={e => setManager({...manager, firstName: e.target.value})} placeholder="ชื่อ" />
                    <Input value={manager.lastName || ''} onChange={e => setManager({...manager, lastName: e.target.value})} placeholder="นามสกุล" />
                </div>
                <Input value={manager.email || ''} onChange={e => setManager({...manager, email: e.target.value})} placeholder="อีเมล" />
                <div className="flex justify-end gap-4">
                    <CancelButton onClick={() => setStep(1)}>ย้อนกลับ</CancelButton>
                    <PrimaryButton onClick={handleSubmit}>บันทึก</PrimaryButton>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}