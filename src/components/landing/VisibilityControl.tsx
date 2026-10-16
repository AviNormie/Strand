"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion, primeStroke } from "./gsap";
import { ICONS } from "./assets";

const INSIGHTS = [
  { icon: ICONS.status, text: "AI mentions up 34% this week" },
  { icon: ICONS.stars, text: "3 rivals outranking you on Claude" },
  { icon: ICONS.folder, text: "Wednesday posts cited most often" },
];

const STATS = [
  { icon: ICONS.search, text: "58% of searches now end without a click." },
  { icon: ICONS.status, text: "4x faster growth for AI-first brands." },
  { icon: ICONS.spot, text: "250+ enterprises use AEO tools." },
  { icon: ICONS.triangle, text: "0 affordable tools for India / APAC startups." },
];

const BARS = [
  { label: "ChatGPT", h: 72, pattern: "solid" },
  { label: "Claude", h: 48, pattern: "diag" },
  { label: "Gemini", h: 58, pattern: "vert" },
  { label: "Perplexity", h: 36, pattern: "dots" },
] as const;

export function VisibilityControl() {
  const sectionRef = useRef<HTMLElement>(null);
  const connectorRef = useRef<SVGPathElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const reduced = prefersReducedMotion();
      const bars = gsap.utils.toArray<HTMLElement>("[data-bar]");
      const cards = gsap.utils.toArray<HTMLElement>("[data-viz-card]");
      const stats = gsap.utils.toArray<HTMLElement>("[data-stat]");
      const connector = connectorRef.current;

      primeStroke(connector);

      if (reduced) {
        gsap.set(connector, { strokeDashoffset: 0 });
        gsap.set(bars, { scaleY: 1 });
        gsap.set(cards, { opacity: 1, y: 0 });
        gsap.set(stats, { opacity: 1, y: 0 });
        if (scoreRef.current) scoreRef.current.textContent = "74";
        return;
      }

      gsap.set(bars, { scaleY: 0, transformOrigin: "bottom" });
      gsap.set(cards, { opacity: 0, y: 32 });
      gsap.set(stats, { opacity: 0, y: 20 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });
      tl.to(connector, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, 0)
        .to(cards, { opacity: 1, y: 0, stagger: 0.12, duration: 0.6, ease: "power2.out" }, 0.2)
        .to(bars, { scaleY: 1, stagger: 0.08, duration: 0.7, ease: "back.out(1.4)" }, 0.35)
        .to(stats, { opacity: 1, y: 0, stagger: 0.08, duration: 0.45 }, 0.55);

      const score = { val: 0 };
      tl.to(
        score,
        {
          val: 74,
          duration: 1,
          ease: "power2.out",
          onUpdate: () => {
            if (scoreRef.current) scoreRef.current.textContent = String(Math.round(score.val));
          },
        },
        0.3,
      );

      gsap.to("[data-insight]", {
        y: "+=4",
        duration: 2.2,
        yoyo: true,
        repeat: -1,
        stagger: 0.25,
        ease: "sine.inOut",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "bottom top",
          toggleActions: "play pause resume pause",
        },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="visibility-control"
      ref={sectionRef}
      className="relative overflow-hidden bg-paper px-4 py-20 sm:px-6 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-4xl text-center">
        <span className="font-hand inline-flex items-center gap-2 rounded-xl border-2 border-ink px-3 py-1 text-sm text-ink">
          <svg data-sparkle width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
              fill="#FFD85A"
              stroke="#111"
              strokeWidth="0.8"
            />
          </svg>
          Take control of your
          <svg data-sparkle width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
              fill="#FFD85A"
              stroke="#111"
              strokeWidth="0.8"
            />
          </svg>
        </span>
        <h2 className="font-display mt-4 text-4xl font-bold text-ink sm:text-5xl md:text-6xl">
          AI{" "}
          <span className="relative inline-block">
            Visibility
            <svg
              className="absolute -bottom-1 left-0 h-3 w-full"
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M2 8 C 40 2, 90 11, 140 5 C 170 2, 190 9, 198 6"
                fill="none"
                stroke="#FFD85A"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h2>
        <p
          className="mx-auto mt-5 max-w-xl text-base text-ink/65 sm:text-lg"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Track every AI mention, understand every gap, and close the distance between you and the top answer.
        </p>
      </div>

      <div
        data-dashboard
        className="relative mx-auto mt-12 grid max-w-6xl items-end gap-6 lg:grid-cols-[0.7fr_1.15fr_1fr]"
      >
        <div className="relative mx-auto w-[85%] max-w-[260px] rotate-[-4deg] lg:mx-0 lg:w-full">
          <img
            src="/assets/z.svg"
            alt="Strand connecting brand signals"
            className="h-auto w-full select-none object-contain"
            draggable={false}
            loading="lazy"
          />
        </div>

        <div data-viz-card className="cartoon-card relative p-5 sm:p-6">
          <svg
            className="pointer-events-none absolute -left-8 top-8 hidden h-24 w-16 lg:block"
            viewBox="0 0 40 80"
            aria-hidden="true"
          >
            <path
              ref={connectorRef}
              d="M4 70 C 10 40, 20 30, 36 10"
              fill="none"
              stroke="#111"
              strokeWidth="1.6"
              strokeDasharray="4 6"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">AI Visibility Score</p>
              <p className="font-display mt-1 text-4xl font-bold text-ink">
                <span ref={scoreRef}>0</span>
                <span className="text-2xl text-ink/40">/100</span>
              </p>
              <p className="font-hand mt-1 text-sm text-accent-green">+ 12 pts</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">Engines tracked</p>
              <p className="font-display text-3xl font-bold text-ink">4</p>
            </div>
          </div>
          <p className="mt-5 text-xs text-ink/50">Mention frequency across all AI engines, last 7 days</p>
          <div className="mt-3 flex h-28 items-end gap-3">
            {BARS.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  data-bar
                  className="w-full rounded-t-md border-2 border-ink"
                  style={{
                    height: `${bar.h}%`,
                    background:
                      bar.pattern === "solid"
                        ? "#FFD85A"
                        : bar.pattern === "diag"
                          ? "repeating-linear-gradient(45deg,#111 0 2px,#FAF8F2 2px 6px)"
                          : bar.pattern === "vert"
                            ? "repeating-linear-gradient(90deg,#6C8CFF 0 3px,#FAF8F2 3px 7px)"
                            : "radial-gradient(circle,#9BC995 1.2px,#FAF8F2 1.3px)",
                    backgroundSize: bar.pattern === "dots" ? "6px 6px" : undefined,
                  }}
                />
                <span className="font-hand text-[10px] text-ink/60 sm:text-xs">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div data-viz-card className="cartoon-card space-y-3 p-5 sm:p-6">
          {INSIGHTS.map((insight) => (
            <div
              key={insight.text}
              data-insight
              className="flex items-center gap-3 rounded-full border-2 border-ink bg-paper px-3 py-2"
            >
              <img src={insight.icon} alt="" className="h-9 w-9 object-contain" loading="lazy" />
              <p className="font-hand text-sm leading-snug text-ink sm:text-base">{insight.text}</p>
            </div>
          ))}
          <div className="pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">AI Growth Insights</p>
            <p className="mt-1 text-sm text-ink/65" style={{ fontFamily: "var(--font-geist-sans)" }}>
              Actionable suggestions so Strand can close the gap between you and the top AI answer.
            </p>
          </div>
        </div>
      </div>

      <div className="cartoon-card mx-auto mt-10 grid max-w-6xl grid-cols-1 divide-y-2 divide-dashed divide-ink/20 sm:grid-cols-2 sm:divide-x-2 sm:divide-y-0 md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.text} data-stat className="flex items-start gap-3 px-5 py-5">
            <img src={stat.icon} alt="" className="h-12 w-12 shrink-0 object-contain" loading="lazy" />
            <p className="text-sm leading-snug text-ink/75" style={{ fontFamily: "var(--font-geist-sans)" }}>
              {stat.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <a href="/coming-soon" className="sticker-btn !px-6 !py-3 !text-base">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8 L14 3 L10 8 L14 13 Z" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          <span>Get early access</span>
          <span className="sticker-arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>

      <svg className="mx-auto mt-8 h-10 w-full max-w-3xl" viewBox="0 0 600 40" aria-hidden="true">
        <path
          d="M10 22 C 80 8, 140 32, 220 18 C 300 4, 360 30, 440 16 C 500 6, 560 28, 590 20"
          fill="none"
          stroke="#111"
          strokeWidth="1.6"
          strokeDasharray="3 8"
          strokeLinecap="round"
        />
        <circle cx="120" cy="16" r="3.5" fill="#FFD85A" />
        <circle cx="300" cy="14" r="3.5" fill="#6C8CFF" />
        <circle cx="480" cy="18" r="3.5" fill="#9BC995" />
      </svg>
    </section>
  );
}
