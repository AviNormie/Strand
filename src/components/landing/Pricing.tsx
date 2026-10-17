"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "./gsap";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "₹1,999",
    period: "/mo",
    features: ["15–20 prompts", "3 engines", "Weekly refresh"],
    cta: "Start free",
    href: "/analyze",
    popular: false,
    solid: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: "₹5,999",
    period: "/mo",
    features: ["50 prompts", "4 engines", "Daily refresh"],
    cta: "Get started",
    href: "/analyze",
    popular: true,
    solid: false,
  },
  {
    id: "scale",
    name: "Scale",
    price: "₹15,000+",
    period: "/mo",
    features: ["150+ prompts", "4–5 engines", "Daily refresh"],
    cta: "Contact us",
    href: "mailto:hello@strand.ai",
    popular: false,
    solid: true,
  },
];

function Check() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8.5 L6.5 12 L13 4"
        fill="none"
        stroke="#111"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Sparks({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M2 5 L6 3 M3 9 L7 9"
        fill="none"
        stroke="#111"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const LEAF_PATH =
  "M20 38 C 18 28, 10 22, 8 12 C 16 16, 20 24, 20 38 Z M20 38 C 22 28, 30 22, 32 12 C 24 16, 20 24, 20 38 Z";
const STAR_PATH = "M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z";

export function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const reduced = prefersReducedMotion();
      const cards = gsap.utils.toArray<HTMLElement>("[data-price-card]");
      const teacher = sectionRef.current?.querySelector("[data-teacher]");
      const cloud = sectionRef.current?.querySelector("[data-cloud]");
      if (reduced) {
        gsap.set(cards, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(cards, { opacity: 0, y: 32 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        stagger: 0.12,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });
      if (teacher) {
        gsap.set(teacher, { transformOrigin: "70% 85%" });
        gsap.to(teacher, {
          rotate: 4,
          y: -4,
          duration: 1.6,
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
      if (cloud) {
        gsap.to(cloud, {
          x: 14,
          y: -8,
          duration: 3.2,
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
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative overflow-hidden bg-paper px-4 py-14 sm:px-6 md:px-10 md:py-20"
    >
      <div className="relative mx-auto max-w-6xl">
        <div
          data-cloud
          className="pointer-events-none absolute right-2 top-2 z-10 w-28 sm:right-6 sm:top-0 sm:w-36 md:w-44"
        >
          <img
            src="/assets/pricing/cloud.svg"
            alt=""
            className="how-ink-icon h-auto w-full object-contain"
            loading="lazy"
            draggable={false}
          />
        </div>
        <svg
          className="pointer-events-none absolute right-[18%] top-10 hidden h-5 w-5 sm:block"
          viewBox="0 0 14 14"
          aria-hidden="true"
        >
          <path d={STAR_PATH} fill="#FFD85A" stroke="#111" strokeWidth="0.7" />
        </svg>
        <svg
          className="pointer-events-none absolute right-[8%] top-24 hidden h-4 w-4 sm:block"
          viewBox="0 0 14 14"
          aria-hidden="true"
        >
          <path d={STAR_PATH} fill="#111" />
        </svg>

        <div className="relative z-10 max-w-2xl">
          <span className="font-hand relative inline-flex items-center rounded-xl border-2 border-ink px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink">
            <Sparks className="absolute -left-3 -top-3" />
            Pricing
            <Sparks className="absolute -right-2 -top-2 rotate-90" />
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
            Built for startups,{" "}
            <span className="relative inline-block">
              not enterprises.
              <svg
                className="absolute -bottom-1 left-0 h-3 w-full"
                viewBox="0 0 260 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 7 C 50 2, 120 9, 180 4 C 220 2, 245 7, 258 5"
                  fill="none"
                  stroke="#111"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
          <p
            className="mt-4 max-w-lg text-base text-ink/65 sm:text-lg"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Transparent, self-serve pricing. No &apos;contact sales&apos; wall. Start tracking AI
            mentions in minutes.
          </p>
        </div>

        <div className="relative mt-10 md:mt-12">
          <div
            data-teacher
            className="pointer-events-none relative z-20 mx-auto mb-2 w-32 sm:w-36 lg:absolute lg:-left-2 lg:bottom-0 lg:mb-0 lg:w-[22%] lg:max-w-[200px]"
          >
            <img
              src="/assets/pricing/teacher.svg"
              alt="Strand Keeper teaching pricing"
              className="how-ink-icon h-auto w-full object-contain"
              loading="lazy"
              draggable={false}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:ml-[18%] lg:grid-cols-3 lg:gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                data-price-card
                className={`pricing-card relative flex flex-col p-5 sm:p-6 ${
                  plan.popular ? "pricing-card-popular" : ""
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-paper">
                    Most popular
                  </span>
                )}
                <Sparks className="absolute -right-1 -top-2" />
                <h3 className="font-display text-xl font-bold text-ink">{plan.name}</h3>
                <p className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  {plan.price}
                  <span className="ml-1 text-base font-medium text-ink/50">{plan.period}</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-ink/75 sm:text-base"
                      style={{ fontFamily: "var(--font-geist-sans)" }}
                    >
                      <Check />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.href}
                  className={`mt-6 inline-flex items-center justify-center gap-1 rounded-2xl border-2 border-ink px-4 py-2.5 text-sm font-semibold transition ${
                    plan.solid
                      ? "bg-ink text-paper hover:brightness-110"
                      : "bg-paper text-ink hover:bg-ink hover:text-paper"
                  }`}
                >
                  {plan.cta}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <a href="#how-it-works" className="sticker-btn !rounded-full !px-6 !py-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8 L14 3 L10 8 L14 13 Z" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <span>Compare features</span>
            <span className="sticker-arrow" aria-hidden="true">
              →
            </span>
          </a>
        </div>

        <div className="relative mt-8">
          <svg
            className="absolute bottom-0 left-2 h-10 w-10 text-ink opacity-70 sm:left-4"
            viewBox="0 0 40 40"
            aria-hidden="true"
          >
            <path
              d={LEAF_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            className="absolute bottom-0 right-2 h-10 w-10 text-ink opacity-70 sm:right-4"
            viewBox="0 0 40 40"
            aria-hidden="true"
          >
            <path
              d={LEAF_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <svg className="mx-auto h-8 w-full max-w-2xl" viewBox="0 0 500 28" aria-hidden="true">
            <path
              d="M10 16 C 70 8, 130 22, 190 14 C 250 6, 310 22, 370 12 C 420 6, 460 18, 490 14"
              fill="none"
              stroke="#111"
              strokeWidth="1.5"
              strokeDasharray="3 7"
              strokeLinecap="round"
            />
            <circle cx="140" cy="14" r="3" fill="#FAF8F2" stroke="#111" strokeWidth="1.2" />
            <circle cx="300" cy="12" r="3" fill="#111" />
          </svg>
        </div>
      </div>
    </section>
  );
}
