"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion, primeStroke } from "./gsap";

const HOW_ICONS = {
  tag: "/assets/how/icon-2.svg",
  search: "/assets/how/icon-3.svg",
  chart: "/assets/how/icon-4.svg",
  target: "/assets/how/icon-5.svg",
};

const STEPS = [
  {
    n: "01",
    title: "Connect your brand",
    copy: "Tell us your brand name, competitors, and category. Takes 60 seconds.",
    icon: HOW_ICONS.tag,
    accent: "#FFD85A",
  },
  {
    n: "02",
    title: "We track AI prompts",
    copy: "We run hundreds of realistic customer queries across ChatGPT, Claude, Gemini, and Perplexity daily.",
    icon: HOW_ICONS.search,
    accent: "#6C8CFF",
  },
  {
    n: "03",
    title: "Get your visibility report",
    copy: "See your mention rate, ranking vs. competitors, sentiment, and which sources AI is citing.",
    icon: HOW_ICONS.chart,
    accent: "#9BC995",
  },
  {
    n: "04",
    title: "Take action",
    copy: "We surface the exact gaps pulling your score down, and give you a clear list of what to fix first.",
    icon: HOW_ICONS.target,
    accent: "#E8A598",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const underlineRef = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const reduced = prefersReducedMotion();
      const underline = underlineRef.current;
      const cards = gsap.utils.toArray<HTMLElement>("[data-how-card]");
      const icons = gsap.utils.toArray<HTMLElement>("[data-how-icon]");
      const nums = gsap.utils.toArray<HTMLElement>("[data-how-num]");
      const sparks = gsap.utils.toArray<SVGElement>("[data-how-spark]");
      const flow = sectionRef.current?.querySelector("[data-how-flow]") ?? null;
      primeStroke(underline);
      const tilts = cards.map((_, i) => (i % 2 == 0 ? -1.2 : 1.1));

      if (reduced) {
        gsap.set(underline, { strokeDashoffset: 0, stroke: "#FFD85A" });
        cards.forEach((card, i) => {
          gsap.set(card, { opacity: 1, y: 0, scale: 1, rotation: tilts[i] });
        });
        gsap.set(flow, { opacity: 1, y: 0 });
        gsap.set(sparks, { opacity: 1, scale: 1 });
        return;
      }

      cards.forEach((card, i) => {
        gsap.set(card, { opacity: 0, y: 40, scale: 0.88, rotation: 3 * tilts[i] });
      });
      gsap.set(flow, { opacity: 0, y: 20 });
      gsap.set(underline, { stroke: "#FFD85A" });
      gsap.set(sparks, { opacity: 0, scale: 0 });
      gsap.set(nums, { scale: 0.7 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 65%",
          toggleActions: "play none none none",
        },
      });
      tl.to(underline, { strokeDashoffset: 0, duration: 0.85, ease: "power2.out" }, 0).to(
        flow,
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        0.15,
      );
      cards.forEach((card, i) => {
        tl.to(
          card,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotation: tilts[i],
            duration: 0.7,
            ease: "back.out(1.8)",
          },
          0.32 + 0.12 * i,
        );
      });
      tl.to(nums, { scale: 1, duration: 0.4, stagger: 0.12, ease: "back.out(2.2)" }, 0.45).to(
        sparks,
        { opacity: 1, scale: 1, stagger: 0.06, duration: 0.35, ease: "back.out(2)" },
        0.55,
      );

      gsap.to(icons, {
        y: "+=8",
        rotation: "+=6",
        duration: 2.1,
        yoyo: true,
        repeat: -1,
        stagger: 0.22,
        ease: "sine.inOut",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "bottom top",
          toggleActions: "play pause resume pause",
        },
      });
      gsap.to(sparks, {
        opacity: 0.35,
        scale: 1.25,
        duration: 0.9,
        yoyo: true,
        repeat: -1,
        stagger: 0.15,
        ease: "sine.inOut",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "bottom top",
          toggleActions: "play pause resume pause",
        },
      });

      const cleanups: (() => void)[] = [];
      cards.forEach((card, i) => {
        const icon = card.querySelector("[data-how-icon]");
        const tilt = tilts[i];
        const enter = () => {
          gsap.to(card, {
            y: -10,
            rotation: tilt + (i % 2 == 0 ? -2.2 : 2.2),
            duration: 0.35,
            ease: "back.out(1.8)",
            overwrite: "auto",
          });
          if (icon) {
            gsap.to(icon, { scale: 1.18, duration: 0.4, ease: "back.out(2)", overwrite: "auto" });
          }
        };
        const leave = () => {
          gsap.to(card, {
            y: 0,
            rotation: tilt,
            duration: 0.35,
            ease: "power2.out",
            overwrite: "auto",
          });
          if (icon) {
            gsap.to(icon, { scale: 1, duration: 0.35, ease: "power2.out", overwrite: "auto" });
          }
        };
        card.addEventListener("mouseenter", enter);
        card.addEventListener("mouseleave", leave);
        card.addEventListener("focusin", enter);
        card.addEventListener("focusout", leave);
        cleanups.push(() => {
          card.removeEventListener("mouseenter", enter);
          card.removeEventListener("mouseleave", leave);
          card.removeEventListener("focusin", enter);
          card.removeEventListener("focusout", leave);
        });
      });
      return () => cleanups.forEach((fn) => fn());
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative overflow-hidden bg-paper px-4 py-10 sm:px-6 md:px-10 md:py-14"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <span className="font-hand relative inline-flex items-center rounded-xl border-2 border-ink px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink">
            <svg className="absolute -left-3 -top-3 h-4 w-4" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M2 4 L5 2 M2 8 L6 8"
                fill="none"
                stroke="#111"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            How it works
            <svg className="absolute -right-3 -top-2 h-4 w-4" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M10 3 L7 5 M10 8 L6 7"
                fill="none"
                stroke="#111"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <h2 className="font-display mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
            From brand to answer,{" "}
            <span className="relative inline-block">
              tracked automatically.
              <svg
                className="absolute -bottom-1 left-0 h-3.5 w-full"
                viewBox="0 0 280 12"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  ref={underlineRef}
                  d="M2 8 C 60 2, 140 11, 200 5 C 240 2, 265 9, 278 6"
                  fill="none"
                  stroke="#FFD85A"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
        </div>

        <div data-how-flow className="relative mx-auto mt-3 w-full max-w-6xl md:mt-4">
          <div className="mx-auto flex h-[280px] w-full items-center justify-center overflow-hidden sm:h-[340px] md:h-[400px]">
            <img
              src="/assets/how/icon-1.svg"
              alt="From brand to answer — Strand tracks the path automatically"
              className="how-flow-art h-[280%] w-[280%] max-w-none object-contain object-center sm:h-[300%] sm:w-[300%] md:h-[320%] md:w-[320%]"
              loading="lazy"
              draggable={false}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 md:mt-8 md:gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              data-how-card
              tabIndex={0}
              className="how-step-card relative flex min-h-[170px] cursor-pointer items-start gap-4 p-5 outline-none focus-visible:ring-2 focus-visible:ring-ink/30 sm:min-h-[190px] sm:p-6"
            >
              <span
                className="pointer-events-none absolute -right-2 -top-2 h-10 w-10 rounded-full opacity-40"
                style={{ background: step.accent }}
                aria-hidden="true"
              />
              <svg
                data-how-spark
                className="absolute -left-2 -top-2 h-4 w-4"
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
                data-how-spark
                className="absolute -right-1 top-3 h-3.5 w-3.5"
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
              <span
                data-how-num
                className="how-step-num relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper"
              >
                {step.n}
              </span>
              <div className="relative z-10 min-w-0 flex-1 pr-24 sm:pr-28">
                <h3 className="font-display text-lg font-bold text-ink sm:text-xl">{step.title}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed text-ink/65 sm:text-base"
                  style={{ fontFamily: "var(--font-geist-sans)" }}
                >
                  {step.copy}
                </p>
              </div>
              <div
                data-how-icon
                className="absolute bottom-2 right-2 z-10 flex h-24 w-24 items-center justify-center overflow-visible sm:bottom-3 sm:right-3 sm:h-28 sm:w-28"
              >
                <img
                  src={step.icon}
                  alt=""
                  className="how-ink-icon h-[145%] w-[145%] max-w-none object-contain"
                  loading="lazy"
                />
              </div>
              {i % 2 == 1 && (
                <svg
                  data-how-spark
                  className="absolute bottom-3 left-4 h-4 w-4"
                  viewBox="0 0 14 14"
                  aria-hidden="true"
                >
                  <path
                    d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
                    fill={step.accent}
                    stroke="#111"
                    strokeWidth="0.7"
                  />
                </svg>
              )}
            </div>
          ))}
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
          <circle cx="120" cy="16" r="3" fill="#FAF8F2" stroke="#111" strokeWidth="1.2" />
          <path
            d="M300 8 L302 14 L308 14 L303 18 L305 24 L300 20 L295 24 L297 18 L292 14 L298 14 Z"
            fill="#FFD85A"
            stroke="#111"
            strokeWidth="0.8"
          />
          <circle cx="480" cy="18" r="3" fill="#111" />
        </svg>
      </div>
    </section>
  );
}
