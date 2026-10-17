/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "./gsap";
import { ICONS, ILLUSTRATIONS } from "./assets";

const PATH_ICONS = [
  { src: ICONS.folder, label: "Docs" },
  { src: ICONS.star, label: "Mentions" },
  { src: ICONS.message, label: "Reviews" },
  { src: ICONS.website, label: "Web" },
];

const WAVE_PATH =
  "M0 72   C 120 40, 240 100, 360 70   C 480 40, 600 105, 720 68   C 840 32, 960 100, 1080 62   C 1200 28, 1320 90, 1440 55";

export function Intro() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion()) return;

      gsap.from("[data-intro-copy]", {
        x: -24,
        opacity: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });
      gsap.from("[data-intro-art]", {
        x: 32,
        opacity: 0,
        duration: 1,
        delay: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });
      gsap.from("[data-path-icon]", {
        y: 16,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: "back.out(1.4)",
        scrollTrigger: { trigger: "[data-wave]", start: "top 85%" },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section id="intro" ref={sectionRef} className="relative overflow-hidden">
      <div className="relative z-10 px-4 pb-6 pt-10 sm:px-6 md:px-10 md:pt-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.15fr] lg:gap-8">
          <div data-intro-copy className="relative max-w-xl">
            <span className="font-hand inline-flex items-center rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm text-ink">
              Introducing Strand
            </span>
            <h2 className="font-display mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-[3.4rem]">
              {"If AI can't find your brand,"}{" "}
              <span className="relative inline-block">
                {"you don't exist"}
                <svg
                  className="absolute -bottom-1 left-0 h-3 w-full"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 8 C 40 2, 90 10, 130 5 C 160 2, 185 9, 198 6"
                    fill="none"
                    stroke="#FFD85A"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </h2>
            <p
              className="mt-6 max-w-md text-base leading-relaxed text-ink/70 sm:text-lg"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Strand shows how ChatGPT, Claude, Gemini, and Perplexity talk about your category — and
              helps you become the answer they recommend.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <a href="#how-it-works" className="sticker-btn-fill">
                <span>How it works</span>
                <span className="sticker-arrow" aria-hidden="true">
                  →
                </span>
              </a>
              <a href="/analyze" className="sticker-btn">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <path
                    d="M2 8 L14 3 L10 8 L14 13 Z"
                    stroke="#111"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path d="M10 8 H3" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span>Start free scan</span>
                <span className="sticker-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </div>
            <svg className="mt-3 ml-6 h-10 w-24 text-ink" viewBox="0 0 96 40" aria-hidden="true">
              <path
                d="M8 8 C 30 28, 55 32, 88 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M76 14 L88 22 L78 30"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div data-intro-art className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative">
              <img
                src={ILLUSTRATIONS.board}
                alt="Strand Keeper exploring brand signals on a board"
                className="relative z-10 h-auto w-full select-none object-contain"
                loading="lazy"
                decoding="async"
              />
              <img
                src={ILLUSTRATIONS.desk}
                alt=""
                className="pointer-events-none absolute -bottom-2 -left-4 z-20 w-[42%] max-w-[220px] select-none object-contain sm:-left-8 sm:w-[38%] md:max-w-[260px]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>

      <div data-wave className="relative z-0 h-[140px] w-full sm:h-[160px] md:h-[180px]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={`${WAVE_PATH}   L1440 180 L0 180 Z`} fill="#E8E0D0" />
          <path
            d={WAVE_PATH}
            fill="none"
            stroke="#111"
            strokeWidth="1.5"
            strokeDasharray="2 9"
            opacity="0.35"
          />
        </svg>
        <div className="absolute inset-x-0 top-[18%] z-10 mx-auto flex max-w-4xl items-end justify-between px-8 sm:top-[22%] sm:px-16">
          {PATH_ICONS.map((icon) => (
            <div key={icon.label} data-path-icon className="flex flex-col items-center">
              <img
                src={icon.src}
                alt={icon.label}
                className="h-auto w-11 object-contain drop-shadow-sm sm:w-14 md:w-16"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
