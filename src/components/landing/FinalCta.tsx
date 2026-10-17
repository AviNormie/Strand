/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion, primeStroke } from "./gsap";
import { LOGO } from "./assets";
import { Keeper } from "./Keeper";

const STAR_PATH = "M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z";
const WAVE_PATH =
  "M0 210   C 90 175, 170 245, 280 200   C 390 155, 470 250, 580 195   C 690 140, 780 230, 900 160   C 1020 95, 1120 170, 1240 105   C 1320 70, 1385 95, 1440 55";

export function FinalCta() {
  const sectionRef = useRef<HTMLElement>(null);
  const loopRef = useRef<SVGPathElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const reduced = prefersReducedMotion();
      const loop = loopRef.current;
      const sparks = gsap.utils.toArray<SVGElement>("[data-cta-spark]");
      primeStroke(loop);

      if (reduced) {
        gsap.set(loop, { strokeDashoffset: 0 });
        gsap.set(sparks, { opacity: 1, scale: 1 });
        return;
      }

      const draw = () =>
        gsap.to(loop, { strokeDashoffset: 0, duration: 0.85, ease: "power2.inOut" });
      const erase = () => {
        const length = loop?.getTotalLength() ?? 0;
        gsap.to(loop, { strokeDashoffset: length, duration: 0.5, ease: "power2.in" });
      };

      const button = buttonRef.current;
      if (!button) return;

      button.addEventListener("mouseenter", draw);
      button.addEventListener("mouseleave", erase);
      button.addEventListener("focus", draw);
      button.addEventListener("blur", erase);

      gsap.to(loop, {
        strokeDashoffset: 0,
        duration: 1.2,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 65%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.fromTo(
        sparks,
        { opacity: 0, scale: 0.4 },
        {
          opacity: 1,
          scale: 1,
          stagger: 0.08,
          duration: 0.45,
          ease: "back.out(2)",
          scrollTrigger: {
            trigger: "[data-cta-wave]",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );

      gsap.to(sparks, {
        opacity: 0.5,
        scale: 1.2,
        duration: 1.15,
        yoyo: true,
        repeat: -1,
        stagger: 0.16,
        ease: "sine.inOut",
        delay: 0.7,
        scrollTrigger: {
          trigger: "[data-cta-wave]",
          start: "top 85%",
          end: "bottom top",
          toggleActions: "play pause resume pause",
        },
      });

      return () => {
        button.removeEventListener("mouseenter", draw);
        button.removeEventListener("mouseleave", erase);
        button.removeEventListener("focus", draw);
        button.removeEventListener("blur", erase);
      };
    },
    { scope: sectionRef },
  );

  return (
    <section id="cta" ref={sectionRef} className="relative overflow-hidden pt-24">
      <div className="relative z-20 mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-6 md:px-10">
        <div className="mb-8 w-56 sm:w-64 md:mb-10 md:w-80">
          <Keeper pose="yay" className="w-full" />
        </div>
        <h2 className="font-display text-3xl font-bold leading-tight text-ink md:text-5xl">
          Your brand already exists.
          <br />
          Make AI discover it.
        </h2>
        <div className="relative mt-12 inline-flex">
          <svg
            className="pointer-events-none absolute -inset-4 h-[calc(100%+32px)] w-[calc(100%+32px)]"
            viewBox="0 0 280 90"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              ref={loopRef}
              d="M24 28 C 40 8, 90 4, 140 10 C 200 18, 250 8, 262 28 C 274 48, 260 72, 220 78 C 160 88, 80 86, 40 74 C 16 64, 10 44, 24 28 Z"
              fill="none"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="48" cy="16" r="3" fill="#6C8CFF" />
            <circle cx="230" cy="70" r="2.5" fill="#9BC995" />
          </svg>
          <a
            ref={buttonRef}
            href="/analyze"
            className="font-hand relative z-10 rounded-full border-2 border-ink bg-accent-yellow px-10 py-4 text-xl text-ink transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            Find my strand
          </a>
        </div>
      </div>

      <div data-cta-wave className="relative z-10 -mt-6 w-full sm:-mt-4 md:-mt-2">
        <svg
          className="block w-full"
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ height: "clamp(280px, 42vw, 420px)" }}
        >
          <path d={`${WAVE_PATH}   L1440 420 L0 420 Z`} fill="#C4A484" />
          <path
            d={WAVE_PATH}
            fill="none"
            stroke="#111"
            strokeWidth="2"
            strokeDasharray="3 10"
            opacity="0.4"
            strokeLinecap="round"
          />
        </svg>

        <svg
          data-cta-spark
          className="pointer-events-none absolute left-[8%] top-[28%] h-4 w-4 sm:h-5 sm:w-5"
          viewBox="0 0 14 14"
          aria-hidden="true"
        >
          <path d={STAR_PATH} fill="#FFD85A" stroke="#111" strokeWidth="0.8" />
        </svg>
        <svg
          data-cta-spark
          className="pointer-events-none absolute left-[22%] top-[18%] h-3.5 w-3.5"
          viewBox="0 0 14 14"
          aria-hidden="true"
        >
          <path d={STAR_PATH} fill="none" stroke="#111" strokeWidth="1.1" />
        </svg>
        <svg
          data-cta-spark
          className="pointer-events-none absolute left-[38%] top-[32%] h-3 w-3"
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path
            d="M2 4 L5 2 M2 8 L6 8"
            fill="none"
            stroke="#111"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <svg
          data-cta-spark
          className="pointer-events-none absolute left-[52%] top-[14%] h-5 w-5"
          viewBox="0 0 14 14"
          aria-hidden="true"
        >
          <path d={STAR_PATH} fill="#FFD85A" stroke="#111" strokeWidth="0.8" />
        </svg>
        <svg
          data-cta-spark
          className="pointer-events-none absolute left-[68%] top-[8%] h-3.5 w-3.5"
          viewBox="0 0 14 14"
          aria-hidden="true"
        >
          <path
            d="M7 1 L8.2 5.2 L12.5 6.5 L8.2 7.8 L7 12 L5.8 7.8 L1.5 6.5 L5.8 5.2 Z"
            fill="none"
            stroke="#111"
            strokeWidth="1.1"
          />
        </svg>
        <svg
          data-cta-spark
          className="pointer-events-none absolute left-[82%] top-[4%] h-4 w-4"
          viewBox="0 0 14 14"
          aria-hidden="true"
        >
          <path d={STAR_PATH} fill="#FAF8F2" stroke="#111" strokeWidth="0.8" />
        </svg>
        <svg
          data-cta-spark
          className="pointer-events-none absolute right-[6%] top-[12%] h-3 w-3"
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path
            d="M10 3 L7 5 M10 8 L6 7"
            fill="none"
            stroke="#111"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <svg
          data-cta-spark
          className="pointer-events-none absolute left-[14%] top-[42%] h-3 w-3"
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path
            d="M6 1 L6.8 4.2 L10 5 L6.8 5.8 L6 9 L5.2 5.8 L2 5 L5.2 4.2 Z"
            fill="#9BC995"
            stroke="#111"
            strokeWidth="0.6"
          />
        </svg>

        <footer className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-5 px-4 pb-10 pt-6 sm:pb-12">
          <a
            href="#top"
            className="relative block h-14 w-36 overflow-hidden sm:h-16 sm:w-40"
            aria-label="Strand"
          >
            <img
              src={LOGO}
              alt="Strand"
              className="absolute left-1/2 top-1/2 h-[340%] w-auto max-w-none -translate-x-1/2 -translate-y-[48%] object-contain"
            />
          </a>
          <div
            className="flex flex-wrap justify-center gap-5 text-sm text-ink/70 sm:gap-6"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            <a href="#collect" className="hover:text-ink">
              Story
            </a>
            <a href="#ai" className="hover:text-ink">
              How AI sees
            </a>
            <a href="#how-it-works" className="hover:text-ink">
              How it works
            </a>
            <a href="mailto:hello@strand.ai" className="hover:text-ink">
              hello@strand.ai
            </a>
          </div>
          <p className="font-hand text-sm text-ink/50">Every brand has a strand.</p>
        </footer>
      </div>
    </section>
  );
}
