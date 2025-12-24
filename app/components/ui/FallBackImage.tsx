"use client"; // ✅ ต้องมีบรรทัดนี้

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { ImageIcon } from "lucide-react";

const PLACEHOLDER_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 400'%3E%3Crect fill='%23f1f5f9' width='800' height='400'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='30' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function FallbackImage({ src, alt, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState<string | any>(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc || PLACEHOLDER_SRC}
      alt={alt}
      onError={() => setImgSrc(PLACEHOLDER_SRC)}
    />
  );
}