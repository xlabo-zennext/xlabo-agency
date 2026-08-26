"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// 紹介URL等のQRコードを表示（クライアントで生成）
export function Qr({ text, size = 140 }: { text: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(text, { width: size, margin: 1 })
      .then((d) => { if (live) setSrc(d); })
      .catch(() => { if (live) setSrc(""); });
    return () => { live = false; };
  }, [text, size]);

  if (!src) return <div style={{ width: size, height: size, background: "var(--card2)", borderRadius: 8 }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="紹介QRコード" width={size} height={size} style={{ borderRadius: 8, display: "block" }} />;
}
