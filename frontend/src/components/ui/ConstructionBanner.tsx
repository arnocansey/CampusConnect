"use client";

import { useState, useEffect } from "react";
import { X, Construction } from "lucide-react";

export function ConstructionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("campusconnect-construction-dismissed");
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("campusconnect-construction-dismissed", "true");
  };

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm sticky top-[57px] z-40">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Construction className="w-4 h-4 shrink-0" />
        <span className="truncate">
          <span className="font-semibold">Heads up!</span> This site is still under construction. Some features may not work as expected.
        </span>
      </div>
      <button
        onClick={dismiss}
        className="p-1 hover:bg-white/20 rounded-full transition shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
