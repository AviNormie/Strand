"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion, primeStroke } from "./gsap";

const LOGO_STROKE_LENGTH = 420;

function NavButton({
  href,
  children,
  variant = "fill",
}: {
  href: string;
  children: ReactNode;
  variant?: "fill" | "dark";
}) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const outlineRef = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const outline = outlineRef.current;
      const link = linkRef.current;
      if (!outline || !link) return;
      primeStroke(outline);
      if (prefersReducedMotion()) {
        gsap.set(outline, { strokeDashoffset: 0, opacity: 0.35 });
        return;
      }
      gsap.to(outline, {
        strokeDashoffset: 0,
        duration: 1.1,
        delay: 1.4,
        ease: "power2.inOut",
      });
      const draw = () =>
        gsap.to(outline, {
          strokeDashoffset: 0,
          duration: 0.7,
          ease: "power2.inOut",
          overwrite: true,
        });
      const erase = () => {
        const length = outline.getTotalLength();
        gsap.to(outline, {
          strokeDashoffset: length,
          duration: 0.45,
          ease: "power2.in",
          overwrite: true,
        });
      };
      link.addEventListener("mouseenter", draw);
      link.addEventListener("mouseleave", erase);
      link.addEventListener("focus", draw);
      link.addEventListener("blur", erase);
      return () => {
        link.removeEventListener("mouseenter", draw);
        link.removeEventListener("mouseleave", erase);
        link.removeEventListener("focus", draw);
        link.removeEventListener("blur", erase);
      };
    },
    { scope: linkRef },
  );

  return (
    <a
      ref={linkRef}
      href={href}
      className={`relative inline-flex ${
        variant === "dark"
          ? "sticker-btn !gap-1.5 !border-ink !bg-ink !px-3 !py-1.5 !text-xs !text-paper sm:!px-4 sm:!text-sm"
          : "sticker-btn-fill !gap-1.5 !px-3 !py-1.5 !text-xs sm:!px-4 sm:!text-sm"
      }`}
    >
      <svg
        className="pointer-events-none absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)]"
        viewBox="0 0 200 56"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          ref={outlineRef}
          d="M18 18 C 36 6, 70 4, 100 8 C 140 14, 172 6, 184 18 C 196 30, 188 42, 160 46 C 120 52, 70 50, 36 44 C 16 40, 8 28, 18 18 Z"
          fill="none"
          stroke={variant === "dark" ? "#FFD85A" : "#111111"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </a>
  );
}

export function SiteNav() {
  const headerRef = useRef<HTMLElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const [logoReady, setLogoReady] = useState(false);

  useGSAP(
    () => {
      registerGsap();
      const reduced = prefersReducedMotion();
      const text = textRef.current;
      const logo = logoRef.current;
      gsap.set(logo, { opacity: 0 });
      if (reduced) {
        gsap.set(text, { opacity: 0 });
        gsap.set(logo, { opacity: 1 });
        setLogoReady(true);
        return;
      }
      if (text) {
        text.style.strokeDasharray = `${LOGO_STROKE_LENGTH}`;
        text.style.strokeDashoffset = `${LOGO_STROKE_LENGTH}`;
        text.style.fill = "transparent";
        gsap
          .timeline({ onComplete: () => setLogoReady(true) })
          .to(text, {
            strokeDashoffset: 0,
            duration: 1.35,
            ease: "power2.inOut",
          })
          .to(text, {
            fill: "#111111",
            duration: 0.35,
            ease: "power1.out",
          })
          .to(text, { opacity: 0, duration: 0.35 }, "+=0.15")
          .to(logo, { opacity: 1, duration: 0.45 }, "-=0.15");
      }
      const shell = headerRef.current?.querySelector("[data-nav-shell]");
      if (shell) {
        gsap.from(shell, {
          y: -24,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
        });
      }
    },
    { scope: headerRef },
  );

  return (
    <header
      ref={headerRef}
      className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4"
    >
      <div
        data-nav-shell
        className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full border-2 border-ink/10 bg-paper/90 px-3 py-2 shadow-[3px_3px_0_0_rgba(17,17,17,0.08)] backdrop-blur-md sm:gap-4 sm:px-5 sm:py-2.5"
      >
        <a
          href="#top"
          className="relative flex h-11 w-28 shrink-0 items-center sm:h-12 sm:w-36 md:h-14 md:w-40"
          aria-label="Strand home"
        >
          <svg
            viewBox="0 0 200 48"
            className={`absolute inset-0 h-full w-full ${logoReady ? "pointer-events-none" : ""}`}
            aria-hidden={logoReady}
          >
            <text
              ref={textRef}
              x="8"
              y="34"
              style={{
                fontFamily: "var(--font-caveat), cursive",
                fontSize: 36,
                fontWeight: 700,
                stroke: "#111111",
                strokeWidth: 1.4,
                strokeLinecap: "round",
                strokeLinejoin: "round",
              }}
            >
              strand
            </text>
          </svg>
          <span className="relative block h-full w-full overflow-hidden">
            <img
              ref={logoRef}
              src="/assets/strandlogo.svg"
              alt="Strand"
              className="absolute left-1/2 top-1/2 h-[340%] w-auto max-w-none -translate-x-1/2 -translate-y-[48%] select-none object-contain"
              draggable={false}
            />
          </span>
        </a>
        <div
          className="flex flex-wrap items-center justify-end gap-2 sm:gap-3"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          <a
            href="#intro"
            className="hidden text-sm text-ink/75 transition-colors hover:text-ink sm:inline"
          >
            Story
          </a>
          <a
            href="#ai"
            className="hidden text-sm text-ink/75 transition-colors hover:text-ink md:inline"
          >
            How AI sees
          </a>
          <NavButton href="#how-it-works" variant="fill">
            <span>How it works</span>
            <span className="sticker-arrow !h-5 !w-5 !text-[10px]" aria-hidden="true">
              →
            </span>
          </NavButton>
          <NavButton href="/analyze" variant="dark">
            <span>Start free scan</span>
            <span
              className="sticker-arrow !h-5 !w-5 !bg-paper !text-[10px] !text-ink"
              aria-hidden="true"
            >
              →
            </span>
          </NavButton>
        </div>
      </div>
    </header>
  );
}
