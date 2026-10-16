"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, registerGsap, prefersReducedMotion, primeStroke } from "./gsap";
import { ICONS, POSES } from "./assets";

const KEEPER_POSE = POSES.pulling;

const NODES = [
  { src: ICONS.star, label: "Reviews", x: 380, y: 268 },
  { src: ICONS.folder, label: "Articles", x: 560, y: 248 },
  { src: ICONS.website, label: "Website", x: 740, y: 255 },
];

const FEATURES = [
  {
    src: ICONS.search,
    title: "Discover",
    copy: "See how AI finds and talks about your brand.",
  },
  {
    src: ICONS.status,
    title: "Track",
    copy: "Monitor visibility across AI models in real time.",
  },
  {
    src: ICONS.data,
    title: "Improve",
    copy: "Get actionable insights to increase visibility.",
  },
  {
    src: ICONS.stars,
    title: "Stay Ahead",
    copy: "Beat competitors and own your category narrative.",
  },
  {
    src: ICONS.spot,
    title: "Grow",
    copy: "More visibility. More trust. More customers.",
  },
];

const VIEW_W = 1100;
const VIEW_H = 400;

export function Collect() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const strandRef = useRef<SVGPathElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresPlayed = useRef(false);

  useGSAP(
    () => {
      registerGsap();
      const reduced = prefersReducedMotion();
      const strand = strandRef.current;
      const cards = gsap.utils.toArray<HTMLElement>("[data-feature]", featuresRef.current);
      const icons = gsap.utils.toArray<HTMLElement>("[data-feature-icon]", featuresRef.current);

      primeStroke(strand);
      gsap.set("[data-strand-node]", { opacity: 1 });
      gsap.set("[data-knows]", { opacity: reduced ? 1 : 0 });

      if (reduced) {
        gsap.set(strand, { strokeDashoffset: 0 });
        gsap.set(cards, { opacity: 1, y: 0 });
        gsap.set("[data-note]", { opacity: 1 });
        gsap.set("[data-knows]", { opacity: 1 });
        return;
      }

      gsap.set(cards, { opacity: 0, y: 24 });
      gsap.set("[data-note]", { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: "top 18%",
          end: "+=80%",
          pin: true,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      tl.to(strand, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);
      tl.to("[data-note]", { opacity: 1, duration: 0.2 }, 0.25);
      tl.to("[data-knows]", { opacity: 1, duration: 0.25 }, 0.7);

      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: "top 82%",
        once: true,
        onEnter: () => {
          if (featuresPlayed.current) return;
          featuresPlayed.current = true;
          gsap.to(cards, {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.55,
            ease: "power2.out",
          });
          gsap.fromTo(
            icons,
            { scale: 0.75, rotate: -8 },
            {
              scale: 1,
              rotate: 0,
              stagger: 0.1,
              duration: 0.65,
              ease: "back.out(1.6)",
            },
          );
        },
      });

      cards.forEach((card) => {
        const icon = card.querySelector("[data-feature-icon]");
        const enter = () => {
          gsap.to(card, {
            y: -6,
            rotation: gsap.utils.random(-1.2, 1.2),
            duration: 0.35,
            ease: "back.out(1.6)",
            overwrite: "auto",
          });
          if (icon) {
            gsap.to(icon, {
              scale: 1.12,
              rotation: gsap.utils.random(-8, 8),
              duration: 0.4,
              ease: "back.out(2)",
              overwrite: "auto",
            });
          }
        };
        const leave = () => {
          gsap.to(card, {
            y: 0,
            rotation: 0,
            duration: 0.35,
            ease: "power2.out",
            overwrite: "auto",
          });
          if (icon) {
            gsap.to(icon, {
              scale: 1,
              rotation: 0,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
        };
        card.addEventListener("mouseenter", enter);
        card.addEventListener("mouseleave", leave);
        card.addEventListener("focusin", enter);
        card.addEventListener("focusout", leave);
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="collect"
      ref={sectionRef}
      className="relative z-10 overflow-hidden bg-paper px-4 pt-16 pb-16 sm:px-6 md:px-10 md:pt-20 md:pb-20"
    >
      <div className="relative z-20 mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-[2.75rem]">
          AI doesn&apos;t see brands directly.
          <br />
          It sees connected signals.
        </h2>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-55" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
            </span>
            Live
          </span>
          <p className="text-sm text-ink/55" style={{ fontFamily: "var(--font-geist-sans)" }}>
            Tracking ChatGPT · Claude · Gemini · Perplexity
          </p>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative mx-auto mt-8 h-[min(58vh,500px)] min-h-[360px] w-full max-w-6xl md:mt-10"
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            ref={strandRef}
            d="M 170 275 C 280 215, 380 305, 480 250 C 580 195, 680 300, 780 245 C 860 210, 940 235, 1020 225"
            fill="none"
            stroke="#111111"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {NODES.map((node, i) =>
            i % 2 === 0 ? (
              <circle key={node.label} cx={node.x} cy={node.y} r="5" fill="#111" />
            ) : (
              <circle
                key={node.label}
                cx={node.x}
                cy={node.y}
                r="4.5"
                fill="#FAF8F2"
                stroke="#111"
                strokeWidth="1.6"
              />
            ),
          )}
        </svg>

        <div className="absolute bottom-[-2%] left-[-1%] z-20 w-[33%] max-w-[300px] md:max-w-[340px]">
          <div
            data-note
            className="font-caveat absolute -top-1 left-[52%] z-30 w-[7.5rem] text-base leading-tight text-ink sm:w-[8.5rem] sm:text-lg"
          >
            We track what matters
            <svg className="ml-1 mt-0.5 h-10 w-12 -rotate-6" viewBox="0 0 48 40" aria-hidden="true">
              <path
                d="M28 4 C 18 14, 12 22, 10 34"
                fill="none"
                stroke="#111"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M4 28 L10 34 L16 27"
                fill="none"
                stroke="#111"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <img
            src={KEEPER_POSE}
            alt="The Strand Keeper"
            className="h-auto w-full select-none object-contain"
            draggable={false}
            loading="eager"
          />
        </div>

        {NODES.map((node) => (
          <div
            key={node.label}
            data-strand-node
            className="absolute z-30 flex -translate-x-1/2 flex-col items-center"
            style={{
              left: `${(node.x / VIEW_W) * 100}%`,
              top: `${(node.y / VIEW_H) * 100}%`,
            }}
          >
            <div className="-mt-[5.5rem] flex h-[5.25rem] w-[5.25rem] items-center justify-center overflow-visible sm:-mt-28 sm:h-28 sm:w-28">
              <img
                src={node.src}
                alt={node.label}
                className="h-[140%] w-[140%] max-w-none object-contain object-center"
                loading="eager"
                draggable={false}
              />
            </div>
            <span className="mt-3 block h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            <span
              className="mt-1 whitespace-nowrap text-xs font-medium text-ink/80 sm:text-sm"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              {node.label}
            </span>
          </div>
        ))}

        <div className="absolute bottom-[-2%] right-[-1%] z-20 w-[37%] max-w-[320px] md:max-w-[360px]">
          <div
            data-knows
            className="absolute -top-2 left-1/2 z-30 flex w-[10rem] -translate-x-1/2 flex-col items-center sm:w-[11.5rem] md:-top-4 md:w-[13rem]"
          >
            <p className="font-caveat text-center text-xl leading-tight text-ink md:text-2xl">
              now AI knows your brand
            </p>
            <svg className="mt-0.5 h-10 w-14 rotate-[12deg]" viewBox="0 0 64 48" aria-hidden="true">
              <path
                d="M18 4 C 26 18, 34 28, 42 38"
                fill="none"
                stroke="#111"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M32 32 L42 38 L34 40"
                fill="none"
                stroke="#111"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <img
            src={ICONS.aiAlt}
            alt="AI"
            className="h-auto w-full select-none object-contain"
            draggable={false}
            loading="eager"
          />
        </div>
      </div>

      <div
        ref={featuresRef}
        className="relative z-20 mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 md:mt-16 md:grid-cols-5 md:gap-3"
      >
        {FEATURES.map((feature) => (
          <button
            key={feature.title}
            type="button"
            data-feature
            className="feature-card cartoon-card flex cursor-pointer flex-col items-center px-4 py-5 text-center outline-none transition-[box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ink/30 sm:px-5 sm:py-6"
          >
            <div className="flex h-28 w-28 items-center justify-center overflow-visible sm:h-32 sm:w-32">
              <img
                data-feature-icon
                src={feature.src}
                alt=""
                className="h-[130%] w-[130%] max-w-none object-contain"
                loading="lazy"
              />
            </div>
            <h3 className="font-display mt-3 text-lg font-bold text-ink">{feature.title}</h3>
            <p
              className="mt-1.5 text-sm leading-snug text-ink/65"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              {feature.copy}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
