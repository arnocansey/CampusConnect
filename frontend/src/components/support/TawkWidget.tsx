"use client";

import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

const TAWK_SRC = "https://embed.tawk.to/6a2cc8af8705f01c3509b8ce/1jqvevrqe";

export function TawkWidget() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Prevent duplicate loading
    if (document.getElementById("tawkto-script")) return;

    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Position widget on the left side (so AI chat stays on right)
    window.Tawk_API.customStyle = {
      visibility: {
        desktop: { fb: "0px", lc: "0px" },
        tablet: { fb: "0px", lc: "0px" },
        mobile: { fb: "0px", lc: "0px" },
      },
    };

    // Load script
    const script = document.createElement("script");
    script.id = "tawkto-script";
    script.async = true;
    script.src = TAWK_SRC;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode?.insertBefore(script, firstScript);

    // Add CSS override to move Tawk widget to bottom-left
    const style = document.createElement("style");
    style.id = "tawkto-positioning";
    style.textContent = `
      #tawkto-min-container,
      .tawk-min-container {
        right: auto !important;
        left: 20px !important;
        bottom: 100px !important;
      }
      @media (max-width: 767px) {
        #tawkto-min-container,
        .tawk-min-container {
          left: 16px !important;
          bottom: 80px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup on unmount
      const el = document.getElementById("tawkto-script");
      if (el) el.remove();
      const s = document.getElementById("tawkto-positioning");
      if (s) s.remove();
    };
  }, [user]);

  // Nothing to render — Tawk.to injects its own DOM
  return null;
}
