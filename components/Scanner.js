"use client";
import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function Scanner({ onScan, onError }) {
  const cb = useRef(onScan);
  cb.current = onScan;

  useEffect(() => {
    const qr = new Html5Qrcode("qr-reader");
    const started = qr
      .start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => cb.current(text), () => {})
      .catch(() => onError?.("Camera unavailable. Allow camera access in your browser."));
    return () => {
      started.then(() => qr.stop()).then(() => qr.clear()).catch(() => {});
    };
  }, []);

  return <div id="qr-reader" className="reader" />;
}