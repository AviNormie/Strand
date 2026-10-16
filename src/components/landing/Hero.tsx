"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "./gsap";
import { HERO_ART, PAINT_COLORS } from "./assets";

const STORAGE_KEY = "strand-hero-paint-v1";
const MODELS = ["ChatGPT", "Claude", "Gemini", "Perplexity"];

type Tool = "brush" | "eraser";
type Point = { x: number; y: number };

function HeroInner() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const restoredRef = useRef(false);
  const [color, setColor] = useState(PAINT_COLORS[2].hex);
  const [tool, setTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(26);
  const [saved, setSaved] = useState(false);

  const persist = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && restoredRef.current)
      try {
        const data = canvas.toDataURL("image/png");
        localStorage.setItem(STORAGE_KEY, data);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1200);
      } catch {}
  }, []);

  const schedulePersist = useCallback(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => persist(), 350);
  }, [persist]);

  const restore = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      restoredRef.current = true;
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      restoredRef.current = true;
    };
    img.onerror = () => {
      restoredRef.current = true;
    };
    img.src = data;
  }, []);

  const resize = useCallback(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const snapCtx = snapshot.getContext("2d");
    if (snapCtx && canvas.width && canvas.height) snapCtx.drawImage(canvas, 0, 0);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (snapshot.width && snapshot.height) ctx.drawImage(snapshot, 0, 0, w, h);
      else restore();
    }
  }, [restore]);

  useEffect(() => {
    resize();
    const timer = window.setTimeout(() => {
      if (!restoredRef.current) restore();
    }, 50);
    const observer = new ResizeObserver(() => resize());
    if (stageRef.current) observer.observe(stageRef.current);
    window.addEventListener("resize", resize);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [resize, restore]);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion()) return;
      gsap
        .timeline({ defaults: { ease: "power2.out" } })
        .from(copyRef.current, { x: -36, opacity: 0, duration: 0.9 })
        .from(stageRef.current, { x: 48, opacity: 0, scale: 0.96, duration: 1.05 }, "-=0.55")
        .from("[data-hero-cta]", { y: 16, opacity: 0, stagger: 0.08, duration: 0.45 }, "-=0.45")
        .from("[data-paint-dock]", { y: 20, opacity: 0, duration: 0.5 }, "-=0.25");
      gsap.to(stageRef.current, {
        y: -10,
        duration: 3.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: 1.2,
      });
      const underline = copyRef.current?.querySelector<SVGPathElement>("[data-underline]");
      if (underline) {
        const length = underline.getTotalLength();
        underline.style.strokeDasharray = `${length}`;
        underline.style.strokeDashoffset = `${length}`;
        gsap.to(underline, {
          strokeDashoffset: 0,
          duration: 0.8,
          delay: 0.7,
          ease: "power2.inOut",
        });
      }
    },
    { scope: rootRef },
  );

  const getPoint = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const drawTo = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }
    const last = lastPointRef.current;
    ctx.beginPath();
    if (last) {
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.01, y + 0.01);
    }
    ctx.stroke();
    lastPointRef.current = { x, y };
  };

  const endStroke = (e: PointerEvent<HTMLCanvasElement>) => {
    if (drawingRef.current) schedulePersist();
    drawingRef.current = false;
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    localStorage.removeItem(STORAGE_KEY);
    setSaved(false);
  };

  const download = () => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const rect = stage.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FAF8F2";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(canvas, 0, 0, w, h);
    const art = new window.Image();
    art.crossOrigin = "anonymous";
    art.onload = () => {
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(art, 0, 0, w, h);
      persist();
      const link = document.createElement("a");
      link.href = out.toDataURL("image/png");
      link.download = "strand-colored.png";
      link.click();
    };
    art.src = HERO_ART;
  };

  return (
    <div
      ref={rootRef}
      className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.15fr] lg:gap-6"
    >
      <div ref={copyRef} className="relative z-10 max-w-xl">
        <span className="inline-flex items-center rounded-full border-2 border-ink bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
          AI Visibility Platform
        </span>
        <h1 className="font-display mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-[3.35rem]">
          Millions ask AI about your category daily. Are you the{" "}
          <span className="relative inline-block">
            answer?
            <svg
              className="absolute -bottom-1 left-0 h-3 w-full"
              viewBox="0 0 160 12"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                data-underline
                d="M2 8 C 35 2, 70 10, 100 5 C 125 2, 145 9, 158 6"
                fill="none"
                stroke="#FFD85A"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>
        <p
          className="mt-5 max-w-md text-base leading-relaxed text-ink/70 sm:text-lg"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          Strand tracks how AI discovers, understands, and recommends brands across every model and
          every conversation.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="/coming-soon"
            data-hero-cta
            className="sticker-btn-fill !px-5 !py-3 !text-sm uppercase tracking-wide"
          >
            <span>Start free scan</span>
            <span className="sticker-arrow" aria-hidden="true">
              →
            </span>
          </a>
          <a href="#intro" data-hero-cta className="sticker-btn !px-5 !py-3 !text-sm">
            <span className="sticker-arrow !bg-transparent !text-ink" aria-hidden="true">
              ▶
            </span>
            <span>Watch 2-min demo</span>
          </a>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-55" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
            </span>
            Live
          </span>
          <p className="text-sm text-ink/60" style={{ fontFamily: "var(--font-geist-sans)" }}>
            Tracking {MODELS.join(" · ")}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center lg:items-stretch">
        <div
          ref={stageRef}
          className="relative mx-auto aspect-[4/3] w-full max-w-[640px] touch-none overflow-hidden lg:max-w-none lg:h-[min(78vh,680px)] lg:aspect-auto"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 h-full w-full cursor-crosshair"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drawingRef.current = true;
              lastPointRef.current = null;
              const p = getPoint(e);
              drawTo(p.x, p.y);
            }}
            onPointerMove={(e) => {
              if (!drawingRef.current) return;
              const p = getPoint(e);
              drawTo(p.x, p.y);
            }}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={endStroke}
          />
          <img
            src={HERO_ART}
            alt="Strand Keeper connecting brand signals to AI"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none object-contain mix-blend-multiply"
            draggable={false}
            loading="eager"
            decoding="async"
          />
        </div>
        <div
          data-paint-dock
          className="mt-4 w-full max-w-[640px] space-y-3 rounded-[24px] border-2 border-ink/15 bg-paper/80 px-4 py-3 lg:max-w-none"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="cartoon-btn px-3 py-1.5 text-[11px] uppercase tracking-wider"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={() => setTool("eraser")}
                className={`cartoon-btn px-3 py-1.5 text-[11px] uppercase tracking-wider ${tool === "eraser" ? "bg-ink text-paper" : ""}`}
              >
                Eraser
              </button>
              <button
                type="button"
                onClick={() => setTool("brush")}
                className={`cartoon-btn px-3 py-1.5 text-[11px] uppercase tracking-wider ${tool === "brush" ? "bg-ink text-paper" : ""}`}
              >
                Brush
              </button>
              <button
                type="button"
                onClick={download}
                className="cartoon-btn bg-accent-yellow px-3 py-1.5 text-[11px] uppercase tracking-wider"
              >
                Save
              </button>
            </div>
            <span className="font-hand text-sm text-ink/50">
              {saved ? "Saved" : "Auto-saves as you paint"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-caveat text-lg text-ink">Colors</span>
            <div className="flex items-center gap-2">
              {PAINT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={c.label}
                  onClick={() => {
                    setColor(c.hex);
                    setTool("brush");
                  }}
                  className={`h-7 w-7 rounded-full border-2 border-ink transition sm:h-8 sm:w-8 ${color === c.hex && tool === "brush" ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""}`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-ink/65">
              <span className="font-hand text-sm">Brush</span>
              <input
                type="range"
                min={8}
                max={56}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="h-1.5 w-24 accent-ink"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden px-4 pb-8 pt-24 sm:px-6 md:px-10 md:pb-10 md:pt-28"
    >
      <HeroInner />
    </section>
  );
}
