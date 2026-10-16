"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "./gsap";
import { Keeper } from "./Keeper";
import { LOGO } from "./assets";

export function ComingSoon() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const reduced = prefersReducedMotion();
      const keeper = rootRef.current?.querySelector("[data-soon-keeper]");
      const sparks = gsap.utils.toArray<Element>("[data-soon-spark]");
      const copy = gsap.utils.toArray<Element>("[data-soon-copy]");
      if (reduced) {
        gsap.set([keeper, ...copy, ...sparks].filter(Boolean), { opacity: 1, y: 0, scale: 1 });
        return;
      }
      gsap.set(copy, { opacity: 0, y: 18 });
      gsap.set(sparks, { opacity: 0, scale: 0.4 });
      if (keeper) gsap.set(keeper, { opacity: 0, y: 24, scale: 0.92 });
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      if (keeper)
        tl.to(keeper, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.6)" }, 0);
      tl.to(copy, { opacity: 1, y: 0, stagger: 0.1, duration: 0.55 }, 0.25).to(
        sparks,
        { opacity: 1, scale: 1, stagger: 0.08, duration: 0.4, ease: "back.out(2)" },
        0.35,
      );
      if (keeper)
        gsap.to(keeper, {
          y: -8,
          duration: 2.4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: 0.9,
        });
      gsap.to(sparks, {
        opacity: 0.45,
        scale: 1.2,
        duration: 1.1,
        yoyo: true,
        repeat: -1,
        stagger: 0.15,
        ease: "sine.inOut",
        delay: 1,
      });
    },
    { scope: rootRef },
  );

  return (
    <main
      ref={rootRef}
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-paper px-4 py-16 sm:px-6"
    >
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[28vh] w-full"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 110   C 120 70, 240 150, 360 100   C 480 55, 600 145, 720 95   C 840 50, 960 130, 1080 80   C 1200 40, 1320 110, 1440 70   L1440 220 L0 220 Z"
          fill="#C4A484"
        />
        <path
          d="M0 110   C 120 70, 240 150, 360 100   C 480 55, 600 145, 720 95   C 840 50, 960 130, 1080 80   C 1200 40, 1320 110, 1440 70"
          fill="none"
          stroke="#111"
          strokeWidth="1.6"
          strokeDasharray="3 10"
          opacity="0.35"
          strokeLinecap="round"
        />
      </svg>
      <Link
        href="/"
        className="absolute left-4 top-5 z-20 sm:left-8 sm:top-8"
        aria-label="Back to Strand home"
      >
        <span className="relative block h-10 w-28 overflow-hidden sm:h-12 sm:w-36">
          <img
            src={LOGO}
            alt="Strand"
            className="absolute left-1/2 top-1/2 h-[340%] w-auto max-w-none -translate-x-1/2 -translate-y-[48%] object-contain"
          />
        </span>
      </Link>
      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
        <div data-soon-keeper className="relative mb-6 w-44 sm:mb-8 sm:w-56 md:w-64">
          <Keeper pose="yay" priority className="w-full" />
          <svg
            data-soon-spark
            className="absolute -left-2 top-4 h-5 w-5"
            viewBox="0 0 14 14"
            aria-hidden="true"
          >
            <path
              d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
              fill="#FFD85A"
              stroke="#111"
              strokeWidth="0.8"
            />
          </svg>
          <svg
            data-soon-spark
            className="absolute -right-1 top-8 h-4 w-4"
            viewBox="0 0 14 14"
            aria-hidden="true"
          >
            <path
              d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
              fill="none"
              stroke="#111"
              strokeWidth="1.1"
            />
          </svg>
          <svg
            data-soon-spark
            className="absolute -right-4 top-20 h-3.5 w-3.5"
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
            data-soon-spark
            className="absolute -left-5 top-24 h-3 w-3"
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
        </div>
        <span
          data-soon-copy
          className="font-hand relative inline-flex items-center rounded-xl border-2 border-ink bg-accent-yellow px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink"
        >
          Coming soon
          <svg
            data-soon-spark
            className="absolute -right-3 -top-2 h-4 w-4"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path
              d="M4 2 L8 1 M5 5 L9 4"
              fill="none"
              stroke="#111"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <h1
          data-soon-copy
          className="font-display mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl md:text-6xl"
        >
          We&apos;re almost ready.
        </h1>
        <p
          data-soon-copy
          className="font-caveat mt-3 text-2xl leading-snug text-ink/80 sm:text-3xl"
        >
          Early access is on the way.
        </p>
        <p
          data-soon-copy
          className="mt-4 max-w-md text-sm leading-relaxed text-ink/65 sm:text-base"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Strand is tying the last few strands together. Leave your email and we&apos;ll ping you
          the moment doors open.
        </p>
        <div data-soon-copy className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:hello@strand.ai?subject=Early%20access%20waitlist"
            className="sticker-btn-fill !px-6 !py-3 !text-base"
          >
            <span>Notify me</span>
            <span className="sticker-arrow" aria-hidden="true">
              →
            </span>
          </a>
          <Link href="/" className="sticker-btn !px-6 !py-3 !text-base">
            <span>Back home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
