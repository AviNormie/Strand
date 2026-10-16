"use client";

import { useEffect } from "react";
import { registerGsap, ScrollTrigger } from "./gsap";

export function GsapProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerGsap();
    const refresh = () => ScrollTrigger.refresh();
    refresh();
    window.addEventListener("load", refresh);
    const timer = window.setTimeout(refresh, 400);
    return () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(timer);
    };
  }, []);
  return <>{children}</>;
}
