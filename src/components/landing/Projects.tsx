"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "./gsap";
import { ICONS, POSES } from "./assets";

const APPS = [
  { src: ICONS.folder, label: "Drive" },
  { src: ICONS.message, label: "Slack" },
  { src: ICONS.website, label: "Web" },
  { src: ICONS.ai, label: "OpenAI" },
  { src: ICONS.cloud, label: "Cloud" },
  { src: ICONS.data, label: "Docs" },
  { src: ICONS.profile, label: "CRM" },
];

const PROJECTS = [
  {
    id: "thehxd",
    name: "TheHxd",
    blurb: "Site of the Month 2025 — AI visibility lift for a high-performance studio.",
    accent: "#9BC995",
  },
  {
    id: "luminar",
    name: "Luminar",
    blurb: "Transforming a dated platform into an AI-cited security story.",
    accent: "#6C8CFF",
  },
];

type Project = (typeof PROJECTS)[number];

function Scribble({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M2 4 L7 2 M3 9 L8 9 M2 14 L7 16"
        fill="none"
        stroke="#111"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border-2 border-ink bg-paper shadow-[4px_4px_0_0_rgba(17,17,17,0.12)]">
      <div className="flex items-center gap-1.5 border-b-2 border-ink/10 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
        <div className="ml-2 h-5 flex-1 rounded-full border border-ink/15 bg-white/60" />
      </div>
      <div className="relative min-h-[280px] sm:min-h-[320px]">{children}</div>
    </div>
  );
}

function HxdScreen({ active }: { active: boolean }) {
  return (
    <div className="relative h-full overflow-hidden">
      <div
        className="project-video-bg absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #FFD85A55, transparent 45%), radial-gradient(circle at 80% 70%, #9BC99555, transparent 40%), linear-gradient(120deg, #FAF8F2, #F3F0E6, #E8F0E4)",
        }}
      />
      <div
        className="project-video-layer absolute -inset-[12%] opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(105deg, transparent 0 28px, rgba(17,17,17,0.03) 28px 30px)",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        {[
          { src: ICONS.star, x: "8%", y: "18%", delay: "0s" },
          { src: ICONS.folder, x: "78%", y: "14%", delay: "0.4s" },
          { src: ICONS.message, x: "70%", y: "68%", delay: "0.8s" },
          { src: ICONS.status, x: "12%", y: "72%", delay: "1.1s" },
        ].map((item) => (
          <img
            key={item.src + item.x}
            src={item.src}
            alt=""
            className="project-bob absolute h-10 w-10 object-contain sm:h-12 sm:w-12"
            style={{ left: item.x, top: item.y, animationDelay: item.delay }}
            loading="lazy"
          />
        ))}
      </div>
      <div className="relative z-10 flex h-full flex-col px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg font-bold tracking-tight text-ink">
            TheHXD<span className="text-accent-green">{"°"}</span>
          </p>
          <div className="hidden gap-3 text-[10px] font-semibold uppercase tracking-wider text-ink/45 sm:flex">
            <span>Works</span>
            <span>About</span>
            <span>Contact</span>
          </div>
        </div>
        <h3 className="font-display mt-6 max-w-[16ch] text-2xl font-bold leading-tight text-ink sm:text-3xl">
          High-Performance <span className="text-accent-green">Development</span>
          {" for Businesses & Startups."}
        </h3>
        <p
          className="mt-3 max-w-sm text-sm text-ink/60"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Design systems, product builds, and AI-ready surfaces that get cited — not just clicked.
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper">
            Book a Call With TheHxd
          </span>
          <span className="rounded-full border-2 border-ink px-3 py-1.5 text-xs font-semibold text-ink">
            Explore our works
          </span>
        </div>
        <div
          className="mt-4 overflow-hidden rounded-xl border-2 border-ink/15 bg-white/70 px-3 py-2 backdrop-blur-sm"
          aria-hidden={!active}
        >
          <div data-ticker className="font-hand flex gap-8 whitespace-nowrap text-sm text-ink/70">
            <span>AI mentions +42%</span>
            <span>Cited on Claude</span>
            <span>Top-3 in category</span>
            <span>AI mentions +42%</span>
            <span>Cited on Claude</span>
            <span>Top-3 in category</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LuminarScreen({ active }: { active: boolean }) {
  return (
    <div className="relative h-full overflow-hidden">
      <div
        className="project-video-bg absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 70% 25%, #6C8CFF44, transparent 42%), radial-gradient(circle at 25% 80%, #FFD85A44, transparent 38%), linear-gradient(160deg, #FAF8F2, #EEF1FA, #F7F4EA)",
        }}
      />
      <div
        className="project-video-layer absolute -inset-[10%] opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, transparent 0 40%, rgba(17,17,17,0.03) 41% 42%, transparent 43%)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative z-10 flex h-full flex-col items-center px-5 py-6 text-center sm:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white/80 px-3 py-1 text-xs font-semibold text-ink">
          <img src={ICONS.cloud} alt="" className="h-4 w-4 object-contain" />
          Integrations
        </span>
        <h3 className="font-display mt-5 max-w-[18ch] text-2xl font-bold leading-tight text-ink sm:text-3xl">
          A data security solution that works for your ecosystem.
        </h3>
        <p
          className="mt-3 max-w-sm text-sm text-ink/60"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Connectors that keep your brand story coherent wherever AI looks.
        </p>
        <div className="relative mt-8 flex w-full max-w-md flex-wrap items-end justify-center gap-3 sm:gap-4">
          {APPS.map((app, i) => {
            const featured = app.label === "OpenAI";
            return (
              <div
                key={app.label}
                data-app-icon
                className="relative flex flex-col items-center"
                style={{
                  animationDelay: `${0.12 * i}s`,
                  transform: featured ? "translateY(-6px) scale(1.12)" : undefined,
                }}
              >
                {featured && (
                  <>
                    <span className="project-pulse-ring absolute inset-[-10px] rounded-2xl border-2 border-accent-blue" />
                    <span
                      className="project-pulse-ring absolute inset-[-10px] rounded-2xl border-2 border-accent-yellow"
                      style={{ animationDelay: "0.7s" }}
                    />
                  </>
                )}
                <img
                  src={app.src}
                  alt={app.label}
                  className={`project-bob h-12 w-12 object-contain sm:h-14 sm:w-14 ${featured ? "drop-shadow-md" : ""}`}
                  style={{ animationDelay: `${0.18 * i}s` }}
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
        <div className="mt-auto pt-6 font-hand text-sm text-ink/55" aria-hidden={!active}>
          <span
            data-live-dot
            className="mr-2 inline-block h-2 w-2 rounded-full bg-accent-green"
          />
          {"Live integration map · syncing"}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % 3);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div data-project-card className="relative flex flex-col">
      {index === 0 && (
        <div className="pointer-events-none absolute -left-3 -top-14 z-20 w-24 sm:-left-4 sm:-top-16 sm:w-28">
          <img
            src={POSES.happy}
            alt=""
            className="project-bob h-auto w-full object-contain"
            loading="lazy"
          />
          <svg className="absolute -right-1 top-2 h-4 w-4" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z"
              fill="#FFD85A"
              stroke="#111"
              strokeWidth="0.8"
            />
          </svg>
        </div>
      )}
      <BrowserFrame>
        {project.id === "thehxd" ? (
          <HxdScreen active={slide === 0} />
        ) : (
          <LuminarScreen active={slide === 1} />
        )}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => setSlide((s) => (s + 2) % 3)}
          className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink transition hover:-translate-x-0.5"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => setSlide((s) => (s + 1) % 3)}
          className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink transition hover:translate-x-0.5"
        >
          ›
        </button>
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setSlide(i)}
              className={`h-2 w-2 rounded-full border border-ink transition ${slide === i ? "bg-ink" : "bg-transparent"}`}
            />
          ))}
        </div>
      </BrowserFrame>
      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink text-[11px] font-bold">
            {index + 1}
          </span>
          <p
            className="text-sm leading-snug text-ink/65"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            {project.blurb}{" "}
            <span className="relative font-semibold text-ink">
              {project.name}
              <svg
                className="absolute -bottom-1 left-0 h-2.5 w-full"
                viewBox="0 0 80 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M1 5 C 20 1, 40 7, 60 3 C 70 1, 76 5, 79 4"
                  fill="none"
                  stroke="#FFD85A"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </p>
        </div>
        <span
          className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink text-sm"
          aria-hidden="true"
        >
          ↗
        </span>
      </div>
    </div>
  );
}

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const reduced = prefersReducedMotion();
      const cards = gsap.utils.toArray<HTMLElement>("[data-project-card]");
      if (reduced) {
        gsap.set(cards, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(cards, { opacity: 0, y: 36 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.65,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });
      gsap.to("[data-ticker]", {
        xPercent: -50,
        duration: 14,
        ease: "none",
        repeat: -1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "bottom top",
          toggleActions: "play pause resume pause",
        },
      });
      gsap.to("[data-live-dot]", {
        opacity: 0.25,
        duration: 0.7,
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
      gsap.to("[data-app-icon]", {
        y: "+=5",
        duration: 2.4,
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
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative overflow-hidden bg-paper px-4 py-20 sm:px-6 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-3xl text-center">
        <span className="font-hand inline-flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1 text-sm text-ink">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper">
            2
          </span>
          Featured client work
          <Scribble />
        </span>
        <h2 className="font-display mt-4 text-4xl font-bold text-ink sm:text-5xl md:text-6xl">
          Our{" "}
          <span className="relative inline-block">
            projects
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
          className="mx-auto mt-4 max-w-lg text-base text-ink/65 sm:text-lg"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Real work. Real impact. A peek into the brands we&apos;ve helped become AI-visible.
        </p>
      </div>

      <div className="relative mx-auto mt-14 grid max-w-6xl gap-10 md:grid-cols-2 md:gap-8">
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <a href="#cta" className="sticker-btn !px-6 !py-3 !text-base">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8 L14 3 L10 8 L14 13 Z" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          <span>See more projects</span>
          <span className="sticker-arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>

      <svg className="mx-auto mt-10 h-10 w-full max-w-3xl" viewBox="0 0 600 40" aria-hidden="true">
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
