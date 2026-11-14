import React, { useEffect, useMemo, useRef, useState } from "react";
import { Rocket, SkipForward } from "lucide-react";

// Per-world intro settings. Add an entry here (e.g. "moon") to give another
// world its own launch → cruise → landing sequence.
export const WORLD_INTROS = {
  mars: {
    planetFrom: "#ef6a3a",
    planetTo: "#8a2a12",
    surfaceFrom: "#c4562c",
    surfaceTo: "#5a1d0e",
    skyColor: "#2a120c",
  },
};

// Timeline (ms from start) at which each stage begins.
const STAGES = [
  ["countdown", 0],
  ["liftoff", 3000],
  ["cruise", 6200],
  ["landing", 10200],
  ["touchdown", 13600],
];

function usePrefersReducedMotion() {
  return useMemo(() => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }, []);
}

function RocketSvg({ flame = true, className = "" }) {
  return (
    <svg viewBox="0 0 60 140" className={className} aria-hidden="true">
      {flame && (
        <g className="wi-flame">
          <path d="M18 112 Q30 150 42 112 Z" fill="#fbbf24" />
          <path d="M23 112 Q30 136 37 112 Z" fill="#fff7ed" />
        </g>
      )}
      <path d="M12 92 L2 116 L16 108 Z" fill="#dc2626" />
      <path d="M48 92 L58 116 L44 108 Z" fill="#dc2626" />
      <path d="M30 4 C46 22 48 60 46 112 L14 112 C12 60 14 22 30 4 Z" fill="#f1f5f9" />
      <path d="M30 4 C38 13 42 24 44 34 L16 34 C18 24 22 13 30 4 Z" fill="#ef4444" />
      <circle cx="30" cy="56" r="8" fill="#0ea5e9" stroke="#334155" strokeWidth="3" />
      <rect x="14" y="98" width="32" height="6" fill="#cbd5e1" />
      <path d="M24 112 L36 112 L34 104 L26 104 Z" fill="#475569" />
    </svg>
  );
}

function LanderSvg({ thrust, className = "" }) {
  return (
    <svg viewBox="0 0 80 90" className={className} aria-hidden="true">
      {thrust && (
        <g className="wi-flame">
          <path d="M32 60 Q40 88 48 60 Z" fill="#fbbf24" />
          <path d="M36 60 Q40 76 44 60 Z" fill="#fff7ed" />
        </g>
      )}
      <path d="M22 48 L8 74 M58 48 L72 74" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
      <path d="M2 74 H14 M66 74 H78" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 4 C60 8 66 30 62 52 L18 52 C14 30 20 8 40 4 Z" fill="#f1f5f9" />
      <circle cx="40" cy="26" r="9" fill="#0ea5e9" stroke="#334155" strokeWidth="3" />
      <rect x="30" y="52" width="20" height="8" fill="#475569" />
    </svg>
  );
}

function Stars({ moving }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() < 0.15 ? 3 : Math.random() < 0.5 ? 2 : 1,
        delay: Math.random() * 3,
      })),
    []
  );
  return (
    <div className={`absolute inset-0 overflow-hidden ${moving ? "wi-stars-move" : ""}`}>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white wi-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function WorldIntro({ t, world = "mars", onPlaySfx, onFinish }) {
  const cfg = WORLD_INTROS[world] || WORLD_INTROS.mars;
  const text = t.worldIntro;
  const reducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState(reducedMotion ? "touchdown" : "countdown");
  const [count, setCount] = useState(3);
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    if (reducedMotion) return undefined;
    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));

    // Countdown beeps: 3, 2, 1
    [3, 2, 1].forEach((n, i) =>
      at(i * 1000, () => {
        setCount(n);
        onPlaySfx?.("beep");
      })
    );
    STAGES.slice(1).forEach(([name, ms]) =>
      at(ms, () => {
        setStage(name);
        if (name === "liftoff") onPlaySfx?.("launch");
        if (name === "touchdown") onPlaySfx?.("land");
      })
    );
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    clearTimers();
    onPlaySfx?.("click");
    setStage("touchdown");
  };

  const landed = stage === "touchdown";

  return (
    <div
      className={`fixed inset-0 z-30 overflow-hidden transition-colors duration-[1500ms] ${
        landed ? "bg-black/0" : "bg-[#05070f]"
      }`}
      role="dialog"
      aria-label={text.ariaLabel}
    >
      {/* ---------- Space backdrop (hidden once landed) ---------- */}
      <div
        className={`absolute inset-0 transition-opacity duration-[1500ms] ${
          landed ? "opacity-0" : "opacity-100"
        }`}
      >
        <Stars moving={stage === "cruise"} />

        {/* COUNTDOWN + LIFTOFF: Earth launch pad */}
        {(stage === "countdown" || stage === "liftoff") && (
          <div className={`absolute inset-0 ${stage === "liftoff" ? "wi-ground-drop" : ""}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-[#05070f] via-[#13305a] to-[#3b82c4]" />
            <div className="absolute bottom-0 inset-x-0 h-[18%] bg-gradient-to-b from-[#3f6b3a] to-[#22401f]" />
            {/* Launch tower */}
            <div className="absolute bottom-[18%] left-1/2 ml-12 w-3 h-[34%] bg-slate-500" />
            <div className="absolute bottom-[38%] left-1/2 ml-3 w-12 h-1.5 bg-slate-500" />
            <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-40 h-3 bg-slate-600 rounded-t" />
          </div>
        )}

        {(stage === "countdown" || stage === "liftoff") && (
          <div
            className={`absolute left-1/2 bottom-[calc(18%+10px)] -translate-x-1/2 w-16 sm:w-20 ${
              stage === "liftoff" ? "wi-liftoff" : ""
            }`}
          >
            <RocketSvg flame={stage === "liftoff"} className="w-full h-auto" />
            {stage === "liftoff" && (
              <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 w-56 h-16 wi-smoke" />
            )}
          </div>
        )}

        {/* CRUISE: Earth shrinks behind, Mars grows ahead */}
        {stage === "cruise" && (
          <>
            <div className="absolute left-[6%] bottom-[10%] w-40 h-40 rounded-full bg-gradient-to-br from-sky-400 via-blue-600 to-blue-900 shadow-[0_0_60px_rgba(56,189,248,0.4)] wi-earth-away" />
            {/* Glow is a soft gradient on the wrapper (a scaled box-shadow renders as a square) */}
            <div
              className="absolute right-[4%] top-[6%] w-40 h-40 flex items-center justify-center rounded-full wi-planet-grow"
              style={{ background: `radial-gradient(circle, ${cfg.planetFrom}55 30%, transparent 70%)` }}
            >
              <div
                className="w-24 h-24 rounded-full"
                style={{ background: `radial-gradient(circle at 35% 35%, ${cfg.planetFrom}, ${cfg.planetTo})` }}
              />
            </div>
            <div className="absolute left-[18%] bottom-[22%] w-12 sm:w-14 wi-cruise">
              <RocketSvg className="w-full h-auto rotate-[55deg]" />
            </div>
          </>
        )}

        {/* LANDING: surface rises, lander descends with retro-thrust */}
        {stage === "landing" && (
          <>
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[260vmax] h-[260vmax] rounded-full wi-surface-rise"
              style={{
                background: `radial-gradient(circle at 50% 8%, ${cfg.surfaceFrom}, ${cfg.surfaceTo} 60%)`,
              }}
            />
            <div className="absolute inset-0 wi-atmo-glow" style={{ background: `${cfg.skyColor}` }} />
            <div className="absolute left-1/2 -translate-x-1/2 w-20 sm:w-24 wi-descend">
              <LanderSvg thrust className="w-full h-auto" />
            </div>
          </>
        )}

        {/* Stage captions */}
        {!landed && (
          <div className="absolute inset-x-0 top-[16%] flex flex-col items-center text-center px-4 pointer-events-none">
            {stage === "countdown" && (
              <>
                <p className="text-sky-200 font-bold tracking-widest uppercase text-xs sm:text-sm mb-2">
                  {text.countdown}
                </p>
                <span key={count} className="font-display text-7xl sm:text-8xl font-bold text-white wi-pop">
                  {count}
                </span>
              </>
            )}
            {stage === "liftoff" && (
              <span className="font-display text-5xl sm:text-6xl font-bold text-amber-300 drop-shadow-lg wi-pop">
                {text.liftoff}
              </span>
            )}
            {stage === "cruise" && (
              <div className="wi-fade-in">
                <p className="font-display text-2xl sm:text-3xl font-bold text-white">{text.cruise}</p>
                <p className="mt-1 text-orange-200 font-semibold">{text.cruiseSub}</p>
              </div>
            )}
            {stage === "landing" && (
              <p className="font-display text-2xl sm:text-3xl font-bold text-white drop-shadow-lg wi-fade-in">
                {text.landing}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---------- Touchdown card over the real 3D Mars scene ---------- */}
      {landed && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-t from-black/60 via-black/10 to-transparent">
          <div className="text-center max-w-md wi-rise-in">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs sm:text-sm font-extrabold uppercase tracking-wider mb-3 backdrop-blur-md">
              ✅ {text.touchdown}
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)] mb-2">
              {text.landedTitle}
            </h2>
            <p className="text-orange-100 font-semibold drop-shadow mb-6">{text.landedSub}</p>
            <button
              type="button"
              onClick={onFinish}
              autoFocus
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-display text-lg font-bold shadow-[0_10px_30px_rgba(234,88,12,0.5)] transition hover:-translate-y-0.5 active:translate-y-0"
            >
              <Rocket className="w-5 h-5" />
              {text.startBtn}
            </button>
          </div>
        </div>
      )}

      {/* Skip */}
      {!landed && (
        <button
          type="button"
          onClick={skip}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900/70 hover:bg-slate-800/90 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-bold text-slate-100 transition"
        >
          {text.skip}
          <SkipForward className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
