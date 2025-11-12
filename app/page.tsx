import { PrimaryButton, CancelButton } from "./components/ui/Button";

export default function Home(){
  return (
    <div className="flex gap-5 p-5  ">
      <PrimaryButton >ยืนยัน</PrimaryButton>
      <CancelButton>ยกเลิก</CancelButton>
      
    </div>
  );
}
