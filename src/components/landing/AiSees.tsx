/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, registerGsap, prefersReducedMotion } from "./gsap";
import { ICONS } from "./assets";
import { Keeper } from "./Keeper";

const PIECES = [
  { src: ICONS.website, label: "Website", x: "12%", y: "18%" },
  { src: ICONS.message, label: "Review", x: "14%", y: "62%" },
  { src: ICONS.folder, label: "Article", x: "86%", y: "16%" },
  { src: ICONS.profile, label: "Social", x: "88%", y: "60%" },
];

const SPARKLE_PATH = "M7 1 L8 5.5 L12.5 6.5 L8 7.5 L7 12 L6 7.5 L1.5 6.5 L6 5.5 Z";

export function AiSees() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const collectRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const reduced = prefersReducedMotion();
      const pieces = gsap.utils.toArray<HTMLElement>("[data-piece]");
      const sparkles = gsap.utils.toArray<SVGElement>("[data-ai-sparkle]");
      const keeper = sectionRef.current?.querySelector("[data-ai-keeper]") as HTMLElement;
      const robot = sectionRef.current?.querySelector("[data-ai-robot]") as HTMLElement;

      pieces.forEach((piece) => {
        gsap.set(piece, { xPercent: -50, yPercent: -50 });
      });
      gsap.set(collectRef.current, { xPercent: -50 });
      gsap.set(answerRef.current, { xPercent: -50 });

      if (reduced) {
        gsap.set(pieces, { left: "50%", top: "46%", opacity: 0.2, scale: 0.45 });
        gsap.set(answerRef.current, { opacity: 1, scale: 1, y: 0 });
        gsap.set(collectRef.current, { opacity: 1, scale: 1 });
        return;
      }

      gsap.set(pieces, { opacity: 1, scale: 1 });
      gsap.set(answerRef.current, { opacity: 0, scale: 0.88, y: 16 });
      gsap.set(collectRef.current, { opacity: 0, scale: 0.6, y: 20 });
      gsap.set([keeper, robot], { opacity: 0.85, y: 12 });

      const idle = gsap.timeline({ paused: true, repeat: -1 });
      idle
        .to(keeper, { y: -8, duration: 1.4, ease: "sine.inOut" }, 0)
        .to(keeper, { y: 0, duration: 1.4, ease: "sine.inOut" }, 1.4)
        .to(robot, { y: -6, duration: 1.2, ease: "sine.inOut" }, 0.2)
        .to(robot, { y: 0, duration: 1.2, ease: "sine.inOut" }, 1.4)
        .to(
          sparkles,
          {
            scale: 1.3,
            opacity: 0.4,
            duration: 0.7,
            yoyo: true,
            repeat: 1,
            stagger: 0.15,
            ease: "sine.inOut",
          },
          0,
        );

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 20%",
          end: "+=110%",
          pin: true,
          pinSpacing: true,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress > 0.82) idle.play();
            else idle.pause(0);
          },
          onLeave: () => idle.pause(),
          onLeaveBack: () => idle.pause(0),
        },
      });

      tl.to(
        [keeper, robot],
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.08 },
        0,
      );
      pieces.forEach((piece, i) => {
        tl.to(
          piece,
          {
            left: "50%",
            top: "44%",
            opacity: 0.15,
            scale: 0.4,
            duration: 0.7,
            ease: "power2.inOut",
          },
          0.12 + 0.04 * i,
        );
      });
      tl.to(
        collectRef.current,
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.5)" },
        0.55,
      ).to(
        answerRef.current,
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" },
        0.72,
      );
      tl.to({}, { duration: 0.25 });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="ai"
      ref={sectionRef}
      className="relative overflow-hidden px-4 py-14 sm:px-6 md:px-10"
    >
      <div className="mx-auto mb-6 max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold text-ink md:text-5xl">
          How AI sees your brand
        </h2>
        <p className="font-caveat mt-3 text-2xl text-ink/80 md:text-3xl">
          So AI understands your brand
        </p>
        <p className="font-hand mt-2 text-lg text-ink/75 md:text-xl">
          The Strand Keeper gathers signals. AI learns from the strand.
        </p>
      </div>

      <div
        ref={stageRef}
        className="relative mx-auto h-[min(72vh,620px)] min-h-[460px] w-full max-w-6xl"
      >
        {PIECES.map((piece) => (
          <div
            key={piece.label}
            data-piece
            className="absolute z-10"
            style={{ left: piece.x, top: piece.y }}
          >
            <img
              src={piece.src}
              alt={piece.label}
              className="h-auto w-16 object-contain sm:w-20 md:w-24"
              loading="lazy"
            />
            <p className="font-hand mt-0.5 text-center text-sm text-ink/70 md:text-base">
              {piece.label}
            </p>
          </div>
        ))}

        <div
          data-ai-keeper
          className="absolute bottom-[2%] left-[2%] z-20 w-[40%] max-w-[340px] md:left-[6%] md:max-w-[400px]"
        >
          <Keeper pose="searching" className="w-full" />
        </div>

        <div
          ref={collectRef}
          className="absolute left-1/2 top-[38%] z-30 w-[30%] max-w-[200px] md:max-w-[240px]"
        >
          <img
            src={ICONS.collect}
            alt=""
            className="h-auto w-full object-contain"
            loading="lazy"
          />
        </div>

        <div
          data-ai-robot
          className="absolute bottom-[0%] right-[2%] z-20 w-[42%] max-w-[360px] md:right-[4%] md:max-w-[420px]"
        >
          <img
            src={ICONS.aiAlt}
            alt="AI"
            className="h-auto w-full object-contain"
            loading="lazy"
          />
          <svg
            data-ai-sparkle
            className="absolute left-[10%] top-[8%] h-5 w-5"
            viewBox="0 0 14 14"
            aria-hidden="true"
          >
            <path d={SPARKLE_PATH} fill="#FFD85A" stroke="#111" strokeWidth="0.8" />
          </svg>
          <svg
            data-ai-sparkle
            className="absolute right-[14%] top-[16%] h-4 w-4"
            viewBox="0 0 14 14"
            aria-hidden="true"
          >
            <path d={SPARKLE_PATH} fill="#111" />
          </svg>
        </div>

        <div
          ref={answerRef}
          className="absolute left-1/2 top-[2%] z-40 w-[min(92%,400px)]"
        >
          <div className="rounded-[28px] border-2 border-ink bg-paper px-5 py-4 shadow-[3px_3px_0_0_rgba(17,17,17,0.08)]">
            <p className="font-hand text-sm uppercase tracking-wide text-ink/55">
              Recommended
            </p>
            <p className="font-kalam mt-1 text-lg leading-snug text-ink md:text-xl">
              Strand is an AI visibility platform that helps brands get found in AI answers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
