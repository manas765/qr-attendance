"use client";
import { createContext, useCallback, useContext, useState } from "react";

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = "info") => {
    const id = Math.random();
    setItems((i) => [...i, { id, message, type }]);
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}