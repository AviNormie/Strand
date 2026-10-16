"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "./gsap";

const FAQS = [
  {
    q: "What is AEO / GEO?",
    a: "Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) are about getting your brand cited in AI answers — ChatGPT, Claude, Gemini, Perplexity — not just ranked in blue links.",
  },
  {
    q: "How is Strand different from SEO tools like Ahrefs or Semrush?",
    a: "SEO tools track search rankings and backlinks. Strand tracks how AI models talk about your brand, which sources they cite, and where competitors outrank you in generative answers.",
  },
  {
    q: "How often does the data update?",
    a: "Starter refreshes weekly. Growth and Scale refresh daily so you can catch mention shifts as models change.",
  },
  {
    q: "Which AI engines do you track?",
    a: "ChatGPT, Claude, Gemini, and Perplexity — with more engines on the Scale plan as they matter for your category.",
  },
  {
    q: "Can I track competitors too?",
    a: "Yes. Add competitors when you connect your brand and see side-by-side mention rates, sentiment, and citation gaps.",
  },
  {
    q: "Is this available in India? What currency is pricing in?",
    a: "Yes — Strand is built for India and APAC startups. Pricing is in INR (₹), with transparent self-serve plans and no sales wall.",
  },
];

export function Faq() {
  const sectionRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(0);

  useGSAP(
    () => {
      registerGsap();
      const reduced = prefersReducedMotion();
      const items = gsap.utils.toArray<HTMLElement>("[data-faq-item]");
      const thinker = sectionRef.current?.querySelector("[data-faq-thinker]");
      const plant = sectionRef.current?.querySelector("[data-faq-plant]");
      const sparks = gsap.utils.toArray<SVGElement>("[data-faq-spark]");

      if (reduced) {
        gsap.set(items, { opacity: 1, y: 0 });
        gsap.set(sparks, { opacity: 1, scale: 1 });
        return;
      }

      gsap.set(items, { opacity: 0, y: 20 });
      gsap.set(sparks, { opacity: 0, scale: 0.4 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });
      gsap.to(sparks, {
        opacity: 1,
        scale: 1,
        stagger: 0.1,
        duration: 0.45,
        ease: "back.out(2)",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });
      gsap.to(sparks, {
        opacity: 0.45,
        scale: 1.2,
        duration: 1.1,
        yoyo: true,
        repeat: -1,
        stagger: 0.18,
        ease: "sine.inOut",
        delay: 0.6,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "bottom top",
          toggleActions: "play pause resume pause",
        },
      });
      if (thinker) {
        gsap.to(thinker, {
          y: -8,
          duration: 2.4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            end: "bottom top",
            toggleActions: "play pause resume pause",
          },
        });
      }
      if (plant) {
        gsap.to(plant, {
          rotate: 4,
          duration: 2.8,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          transformOrigin: "50% 100%",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            end: "bottom top",
            toggleActions: "play pause resume pause",
          },
        });
      }
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative overflow-hidden bg-paper px-4 py-14 sm:px-6 md:px-10 md:py-20"
    >
      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <span className="font-hand relative inline-flex items-center rounded-xl border-2 border-ink px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink">
            FAQ
            <svg className="absolute -right-3 -top-2 h-4 w-4" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M4 2 L8 1 M5 5 L9 4"
                fill="none"
                stroke="#111"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
            Common questions,{" "}
            <span className="font-caveat relative inline-block text-[1.15em] font-normal">
              straight answers.
              <svg
                className="absolute -bottom-1 left-0 h-3 w-full"
                viewBox="0 0 220 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 7 C 40 2, 100 9, 150 4 C 185 2, 205 7, 218 5"
                  fill="none"
                  stroke="#FFD85A"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
              <svg className="absolute -right-4 -top-2 h-4 w-4" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M3 2 L7 1 M4 5 L8 4"
                  fill="none"
                  stroke="#111"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
        </div>

        <div className="relative mt-10 md:mt-12">
          <div
            data-faq-thinker
            className="pointer-events-none absolute -left-4 top-4 z-10 hidden h-[280px] w-[220px] overflow-visible lg:block xl:-left-10 xl:h-[320px] xl:w-[260px]"
          >
            <div className="flex h-full w-full items-center justify-center">
              <img
                src="/assets/faq/thinker.svg"
                alt=""
                className="faq-ink-art h-[160%] w-[160%] max-w-none object-contain"
                loading="lazy"
                draggable={false}
              />
            </div>
            <svg data-faq-spark className="absolute right-2 top-2 h-5 w-5" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
                fill="#FFD85A"
                stroke="#111"
                strokeWidth="0.8"
              />
            </svg>
            <svg data-faq-spark className="absolute right-8 top-10 h-3.5 w-3.5" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
                fill="none"
                stroke="#111"
                strokeWidth="1.1"
              />
            </svg>
            <svg data-faq-spark className="absolute left-4 top-16 h-3 w-3" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 4 L5 2 M2 8 L6 8" fill="none" stroke="#111" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <svg data-faq-spark className="absolute bottom-8 right-0 h-3 w-3" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M10 3 L7 5 M10 8 L6 7" fill="none" stroke="#111" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>

          <div
            data-faq-plant
            className="pointer-events-none absolute -right-2 bottom-16 z-10 hidden h-[220px] w-[180px] overflow-visible lg:block xl:-right-8 xl:h-[260px] xl:w-[210px]"
          >
            <div className="flex h-full w-full items-center justify-center">
              <img
                src="/assets/faq/plant.svg"
                alt=""
                className="faq-ink-art h-[155%] w-[155%] max-w-none object-contain"
                loading="lazy"
                draggable={false}
              />
            </div>
            <svg data-faq-spark className="absolute left-2 top-2 h-4 w-4" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M7 1 L8.2 5.2 L12.5 6.5 L8.2 7.8 L7 12 L5.8 7.8 L1.5 6.5 L5.8 5.2 Z"
                fill="none"
                stroke="#111"
                strokeWidth="1.1"
              />
            </svg>
            <svg data-faq-spark className="absolute right-4 top-8 h-3.5 w-3.5" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
                fill="#FFD85A"
                stroke="#111"
                strokeWidth="0.7"
              />
            </svg>
            <svg data-faq-spark className="absolute -left-1 top-20 h-3 w-3" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 4 L5 2 M2 8 L6 8" fill="none" stroke="#111" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <svg data-faq-spark className="absolute bottom-6 right-1 h-3 w-3" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M10 3 L7 5 M10 8 L6 7" fill="none" stroke="#111" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>

          <svg
            data-faq-spark
            className="pointer-events-none absolute left-[22%] top-2 hidden h-4 w-4 lg:block"
            viewBox="0 0 14 14"
            aria-hidden="true"
          >
            <path
              d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
              fill="#FFD85A"
              stroke="#111"
              strokeWidth="0.7"
            />
          </svg>
          <svg
            data-faq-spark
            className="pointer-events-none absolute right-[24%] top-6 hidden h-3.5 w-3.5 lg:block"
            viewBox="0 0 14 14"
            aria-hidden="true"
          >
            <path
              d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
              fill="none"
              stroke="#111"
              strokeWidth="1"
            />
          </svg>
          <svg
            data-faq-spark
            className="pointer-events-none absolute bottom-28 left-[20%] hidden h-3 w-3 lg:block"
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

          <div className="relative z-20 mx-auto max-w-xl space-y-3">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q} data-faq-item className="faq-card overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5 sm:py-4"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span className="font-hand text-base text-ink sm:text-lg">{item.q}</span>
                    <svg
                      className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 6 L8 11 L13 6"
                        fill="none"
                        stroke="#111"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <p
                        className="px-4 pb-4 text-sm leading-relaxed text-ink/65 sm:px-5 sm:text-base"
                        style={{ fontFamily: "var(--font-geist-sans)" }}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative mt-12 flex justify-center">
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
            viewBox="0 0 500 40"
            aria-hidden="true"
          >
            <path
              d="M10 22 C 70 10, 130 30, 190 18 C 250 6, 310 28, 370 16 C 420 8, 460 24, 490 20"
              fill="none"
              stroke="#111"
              strokeWidth="1.5"
              strokeDasharray="3 7"
              strokeLinecap="round"
            />
            <circle cx="120" cy="16" r="3" fill="#FAF8F2" stroke="#111" strokeWidth="1.2" />
            <circle cx="280" cy="14" r="3" fill="#FFD85A" />
            <circle cx="400" cy="18" r="3" fill="#111" />
          </svg>
          <a href="/coming-soon" className="sticker-btn relative z-10 !rounded-2xl !px-6 !py-3 !text-base">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8 L14 3 L10 8 L14 13 Z" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <span>Get early access</span>
            <span className="sticker-arrow" aria-hidden="true">
              →
            </span>
          </a>
          <svg
            data-faq-spark
            className="pointer-events-none absolute -left-2 top-0 h-4 w-4 sm:left-1/4"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path d="M2 4 L5 2 M2 8 L6 8" fill="none" stroke="#111" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <svg
            data-faq-spark
            className="pointer-events-none absolute -right-2 top-1 h-4 w-4 sm:right-1/4"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path d="M10 3 L7 5 M10 8 L6 7" fill="none" stroke="#111" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}
