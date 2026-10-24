
import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Camera,
  Plus,
  Volume2,
  VolumeX,
} from "lucide-react";
import api from "../api/api.js";

const MAX_SHOTS = 5;
const AUTO_SHOT_DELAY = 2400;
const SHOT_LIFETIME = 10_000;

const SHUTTER_TOTAL = 0.52;
const SHUTTER_CLOSED_AT = 0.17;

const EASE = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* Cloudinary image optimization                                       */
/* ------------------------------------------------------------------ */

const optimizeCloudinaryUrl = (url, width) => {
  if (!url || !url.includes("res.cloudinary.com")) return url;

  // Avoid adding transformations twice if the URL already has them.
  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return url;

  const afterUpload = url.slice(uploadIndex + "/upload/".length);

  if (/^(?:f_auto|q_auto|w_\d+|c_limit|c_fill|c_scale)\b/.test(afterUpload)) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,c_limit,w_${width}/`
  );
};

const getHeroImageSrcSet = (url) => {
  if (!url || !url.includes("res.cloudinary.com")) return undefined;

  return [
    `${optimizeCloudinaryUrl(url, 640)} 640w`,
    `${optimizeCloudinaryUrl(url, 960)} 960w`,
    `${optimizeCloudinaryUrl(url, 1440)} 1440w`,
    `${optimizeCloudinaryUrl(url, 1920)} 1920w`,
  ].join(", ");
};

/* ------------------------------------------------------------------ */
/* Built-in shutter sound                                              */
/* ------------------------------------------------------------------ */

function playSynthShutter(ctx) {
  const now = ctx.currentTime;

  const click = (time, frequency, level) => {
    const length = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      data[i] =
        (Math.random() * 2 - 1) *
        Math.exp(-i / (length * 0.16));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 1.1;

    const gain = ctx.createGain();
    gain.gain.value = level;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(time);
  };

  const thump = (time) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(170, time);
    osc.frequency.exponentialRampToValueAtTime(55, time + 0.07);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  };

  click(now, 3400, 1.1);
  thump(now);
  click(now + 0.09, 2300, 0.8);
  thump(now + 0.09);
}

/* ------------------------------------------------------------------ */
/* Shutter iris                                                        */
/* ------------------------------------------------------------------ */

function ShutterIris({ trigger }) {
  const maskId = useId();

  const radius = useMotionValue(6000);
  const cx = useMotionValue(0);
  const cy = useMotionValue(0);

  useEffect(() => {
    if (!trigger) return undefined;

    const open = Math.hypot(
      window.innerWidth,
      window.innerHeight
    ) * 1.15;

    cx.set(trigger.x);
    cy.set(trigger.y);

    const controls = animate(radius, [open, 0, 0, open], {
      duration: SHUTTER_TOTAL,
      times: [0, SHUTTER_CLOSED_AT / SHUTTER_TOTAL, 0.42, 1],
      ease: ["easeIn", "linear", "easeOut"],
    });

    return () => controls.stop();
  }, [trigger, radius, cx, cy]);

  const points = useTransform([radius, cx, cy], ([r, x, y]) =>
    Array.from({ length: 6 }, (_, k) => {
      const angle = (Math.PI / 3) * k + Math.PI / 6;
      return `${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`;
    }).join(" ")
  );

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[85] h-full w-full"
    >
      <defs>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="white" />
          <motion.polygon points={points} fill="black" />
        </mask>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill="#050505"
        mask={`url(#${maskId})`}
      />

      <motion.polygon
        points={points}
        fill="none"
        stroke="#c9a875"
        strokeWidth="1"
        strokeOpacity="0.7"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Polaroid                                                            */
/* ------------------------------------------------------------------ */

function Polaroid({ shot, reduced, constraintsRef, onExpire }) {
  const develop = reduced
    ? {}
    : {
        initial: {
          filter: "brightness(0.15) saturate(0) blur(8px)",
        },
        animate: {
          filter: "brightness(1) saturate(1) blur(0px)",
        },
        transition: {
          duration: 3.8,
          ease: [0.3, 0.1, 0.2, 1],
          delay: 0.4,
        },
      };

  useEffect(() => {
    const timer = window.setTimeout(
      () => onExpire(shot.id),
      SHOT_LIFETIME
    );

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot.id]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={constraintsRef}
      dragElastic={0.08}
      onClick={(event) => event.stopPropagation()}
      aria-label={`Photograph ${shot.number}, drag to move`}
      initial={{
        opacity: 0,
        scale: 0.6,
        rotate: shot.rotation - 14,
        y: 60,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: shot.rotation,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.7,
        rotate: shot.rotation + 15,
        y: 20,
      }}
      transition={{
        duration: reduced ? 0.15 : 0.7,
        ease: EASE,
      }}
      whileHover={reduced ? undefined : { scale: 1.035, zIndex: 50 }}
      whileDrag={{ scale: 1.06, zIndex: 100, cursor: "grabbing" }}
      className="pointer-events-auto absolute z-20 cursor-grab select-none outline-none"
      style={{
        left: `${shot.x}%`,
        top: `${shot.y}%`,
        width: shot.width,
        touchAction: "none",
      }}
    >
      <div className="border border-black/10 bg-[#f1eee6] p-[7px] pb-3 shadow-[0_12px_35px_rgba(0,0,0,0.4)] sm:p-[9px] sm:pb-4">
        <div
          className="relative w-full overflow-hidden bg-neutral-900"
          style={{ aspectRatio: shot.aspect }}
        >
          <motion.img
            {...develop}
            src={shot.image}
            alt=""
            draggable={false}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full select-none object-cover"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/5" />
          <div className="pointer-events-none absolute inset-0 border border-white/10" />
        </div>

        <div className="flex items-end justify-between gap-1 pt-2">
          <div>
            <p className="font-serif text-[10px] tracking-[0.12em] text-[#24231f] sm:text-xs">
              MIDHUN FRAMES
            </p>
            <p className="mt-1 text-[7px] uppercase tracking-[0.17em] text-black/45 sm:text-[8px]">
              A moment preserved
            </p>
          </div>

          <span className="pb-[1px] font-mono text-[8px] text-black/45">
            {String(shot.number).padStart(2, "0")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export default function Hero() {
  const reduced = useReducedMotion();

  const [heroContent, setHeroContent] = useState(null);
  const [loadedImage, setLoadedImage] = useState(false);
  const [failedImage, setFailedImage] = useState(false);

  const [shots, setShots] = useState([]);
  const [taken, setTaken] = useState(0);
  const [flash, setFlash] = useState(false);
  const [shutter, setShutter] = useState(null);
  const [aiming, setAiming] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const sectionRef = useRef(null);
  const imgRef = useRef(null);
  const takenRef = useRef(0);
  const autoDoneRef = useRef(false);
  const shutterAudioRef = useRef(null);
  const soundRef = useRef(true);
  const fileReadyRef = useRef(false);
  const audioCtxRef = useRef(null);
  const timersRef = useRef([]);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const smoothX = useSpring(cursorX, {
    stiffness: 180,
    damping: 24,
  });

  const smoothY = useSpring(cursorY, {
    stiffness: 180,
    damping: 24,
  });

  const heroImage = heroContent?.imageUrl || "";

  // Fetch the admin-managed hero content.
  useEffect(() => {
    let active = true;

    const fetchHero = async () => {
      try {
        const response = await api.get("/hero");
        const content = response.data?.data;

        if (active && content) {
          setHeroContent(content);
        }
      } catch (error) {
        console.error("Unable to load hero content:", error);
      }
    };

    fetchHero();

    return () => {
      active = false;
    };
  }, []);

  // If the image URL has already been cached, don't wait for another load event.
  useEffect(() => {
    const img = imgRef.current;

    if (img?.complete && img.naturalWidth > 0) {
      setLoadedImage(true);
      setFailedImage(false);
    }
  }, [heroImage]);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  // Camera shutter audio.
  useEffect(() => {
    const audio = new Audio("/sounds/camera-shutter.mp3");

    audio.preload = "none";
    audio.volume = 0.7;

    const markReady = () => {
      fileReadyRef.current = true;
    };

    const markFailed = () => {
      fileReadyRef.current = false;
    };

    audio.addEventListener("canplaythrough", markReady);
    audio.addEventListener("error", markFailed);

    shutterAudioRef.current = audio;

    return () => {
      audio.removeEventListener("canplaythrough", markReady);
      audio.removeEventListener("error", markFailed);
      audio.pause();
      shutterAudioRef.current = null;

      audioCtxRef.current?.close?.();
      audioCtxRef.current = null;

      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const playShutterSound = useCallback(() => {
    if (!soundRef.current) return;

    const audio = shutterAudioRef.current;

    if (audio && fileReadyRef.current) {
      try {
        audio.currentTime = 0;

        const playback = audio.play();

        if (playback && typeof playback.catch === "function") {
          playback.catch(() => {});
        }
      } catch {
        // Continue to the synthesized sound.
      }

      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;

      if (ctx.state === "suspended") {
        ctx.resume().then(() => playSynthShutter(ctx)).catch(() => {});
        return;
      }

      playSynthShutter(ctx);
    } catch {
      // Camera sound is optional.
    }
  }, []);

  const triggerFlash = useCallback(() => {
    setFlash(true);

    const id = window.setTimeout(
      () => setFlash(false),
      reduced ? 120 : 260
    );

    timersRef.current.push(id);
  }, [reduced]);

  const capture = useCallback(
    (clientX, clientY) => {
      const section = sectionRef.current;

      if (!heroImage || !section) return;

      const bounds = section.getBoundingClientRect();
      const px = clientX - bounds.left;
      const py = clientY - bounds.top;

      const img = imgRef.current;

      const aspect =
        img?.naturalWidth && img?.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : 1.5;

      const vw = window.innerWidth;
      const isPhone = vw < 640;
      const width = vw < 640 ? 150 : vw < 768 ? 180 : 210;
      const height = (width - 18) / aspect + 18 + 46;

      const widthPct = (width / bounds.width) * 100;
      const heightPct = (height / bounds.height) * 100;
      const headerPct = (84 / bounds.height) * 100;

      const minX = isPhone ? 4 : 34;
      const maxX = Math.max(minX, 96 - widthPct);
      const minY = headerPct + 2;

      const maxY = Math.max(
        minY,
        isPhone ? 100 - heightPct - 52 : 100 - heightPct - 10
      );

      const number = takenRef.current + 1;
      takenRef.current = number;

      const newShot = {
        id: `${Date.now()}-${number}`,
        number,
        image: heroImage,
        width,
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        rotation: -12 + Math.random() * 24,
        aspect,
      };

      setTaken(number);
      playShutterSound();

      if (!reduced) {
        setShutter({ id: number, x: px, y: py });
      }

      const delay = reduced ? 0 : SHUTTER_CLOSED_AT * 1000;

      const id = window.setTimeout(() => {
        setShots((current) => [...current, newShot].slice(-MAX_SHOTS));
        triggerFlash();
      }, delay);

      timersRef.current.push(id);
    },
    [heroImage, reduced, playShutterSound, triggerFlash]
  );

  const handlePhotoClick = useCallback(
    (event) => {
      autoDoneRef.current = true;
      capture(event.clientX, event.clientY);
    },
    [capture]
  );

  const expireShot = useCallback((id) => {
    setShots((current) => current.filter((shot) => shot.id !== id));
  }, []);

  // Automatically take the first Polaroid after the hero image loads.
  useEffect(() => {
    if (!loadedImage || !heroImage || autoDoneRef.current) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      if (autoDoneRef.current || !sectionRef.current) return;

      autoDoneRef.current = true;

      const bounds = sectionRef.current.getBoundingClientRect();

      capture(
        bounds.left + bounds.width * 0.66,
        bounds.top + bounds.height * 0.42
      );
    }, reduced ? 300 : AUTO_SHOT_DELAY);

    return () => window.clearTimeout(timeout);
  }, [loadedImage, heroImage, capture, reduced]);

  const handlePointerMove = useCallback(
    (event) => {
      if (event.pointerType === "touch") return;

      cursorX.set(event.clientX);
      cursorY.set(event.clientY);
    },
    [cursorX, cursorY]
  );

  const scrollToPortfolio = useCallback(() => {
    document.getElementById("portfolio")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
    });
  }, [reduced]);

  return (
    <>
      <section
        id="home"
        ref={sectionRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setAiming(true);
        }}
        onPointerLeave={() => setAiming(false)}
        onClick={handlePhotoClick}
        className="relative isolate flex min-h-[100svh] w-full cursor-crosshair flex-col justify-end overflow-hidden bg-[#090a0b] text-[#f3f0e8] selection:bg-white/20"
      >
        {/* Optimized full-bleed hero photograph */}
        {heroImage && (
          <img
            ref={imgRef}
            src={optimizeCloudinaryUrl(heroImage, 1440)}
            srcSet={getHeroImageSrcSet(heroImage)}
            sizes="100vw"
            alt="Midhun Frames cinematic photography"
            draggable={false}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            onLoad={() => {
              setLoadedImage(true);
              setFailedImage(false);
            }}
            onError={() => {
              setFailedImage(true);
              setLoadedImage(false);
            }}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-black/10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/25" />

        {/* Film grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.1] mix-blend-soft-light"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.88\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'.4\'/%3E%3C/svg%3E")',
          }}
        />

        {/* Viewfinder frame */}
        <div className="pointer-events-none absolute inset-x-4 bottom-4 top-[84px] sm:inset-x-8 sm:bottom-8 md:inset-x-10 md:bottom-10">
          <span className="absolute left-0 top-0 h-5 w-5 border-l border-t border-[#c9a875] sm:h-7 sm:w-7" />
          <span className="absolute right-0 top-0 h-5 w-5 border-r border-t border-[#c9a875] sm:h-7 sm:w-7" />
          <span className="absolute bottom-0 left-0 h-5 w-5 border-b border-l border-[#c9a875] sm:h-7 sm:w-7" />
          <span className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-[#c9a875] sm:h-7 sm:w-7" />

          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
        </div>

        {/* Top metadata */}
        <div className="pointer-events-none absolute left-7 right-7 top-[100px] z-10 flex items-start justify-between gap-4 sm:left-12 sm:right-12 sm:top-[108px] md:left-16 md:right-16">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/80 sm:text-[10px]">
              {heroContent?.eyebrow || "Photography · Films · Stories"}
            </p>
            <div className="mt-3 h-px w-12 bg-[#c9a875]" />
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[8px] uppercase tracking-[0.25em] text-white/70 sm:text-[9px]">
              Independent visual artist
            </p>
            <p className="mt-2 font-serif text-xs tracking-[0.08em] text-white/90 sm:text-sm">
              Kerala, India
            </p>
          </div>
        </div>

        {/* Polaroid layer */}
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <AnimatePresence initial={false}>
            {shots.map((shot) => (
              <Polaroid
                key={shot.id}
                shot={shot}
                reduced={reduced}
                constraintsRef={sectionRef}
                onExpire={expireShot}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Main editorial text - shown immediately */}
        <div className="pointer-events-none relative z-10 w-full px-7 pb-28 pt-44 sm:px-12 sm:pb-28 md:px-16 md:pb-32">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <p className="mb-5 flex items-center gap-3 text-[9px] uppercase tracking-[0.32em] text-white/80 sm:text-[10px]">
              <span className="h-px w-8 bg-[#c9a875]" />
              {heroContent?.subheading || "Stories told through light"}
            </p>

            <h1 className="max-w-4xl whitespace-pre-line font-serif text-[clamp(3.1rem,9vw,8rem)] font-normal leading-[0.92] tracking-[-0.05em] text-white">
              {heroContent?.heading || "Moments become memories."}
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-7 text-white/80 sm:mt-8 sm:text-base sm:leading-8">
              {heroContent?.description ||
                "I capture the honest, fleeting moments that make every story uniquely yours."}
            </p>

            <div className="pointer-events-auto mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-10">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  scrollToPortfolio();
                }}
                className="group inline-flex min-h-12 items-center gap-4 border border-white/60 bg-black/20 px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-sm transition duration-300 hover:border-white hover:bg-white hover:text-black"
              >
                Explore the work
                <ArrowUpRight
                  size={15}
                  strokeWidth={1.5}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </button>

              <span className="flex items-center gap-2 text-[9px] uppercase tracking-[0.17em] text-white/70">
                <Camera size={14} strokeWidth={1.4} />
                {taken > 0 ? (
                  `${taken} frame${taken === 1 ? "" : "s"} captured`
                ) : (
                  <>
                    <span className="sm:hidden">Tap anywhere to shoot</span>
                    <span className="hidden sm:inline">
                      Click anywhere to shoot
                    </span>
                  </>
                )}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bottom details + sound toggle */}
        <div className="pointer-events-none absolute bottom-7 left-7 right-7 z-30 flex items-end justify-between gap-4 sm:bottom-12 sm:left-12 sm:right-12 md:bottom-14 md:left-16 md:right-16">
          <div className="hidden sm:block">
            <p className="text-[8px] uppercase tracking-[0.25em] text-white/60 sm:text-[9px]">
              Available for selected projects
            </p>
            <p className="mt-2 font-serif text-sm tracking-wide text-white/85">
              Midhun Frames
            </p>
          </div>

          <div className="ml-auto flex items-center gap-5">
            <motion.div
              animate={reduced ? undefined : { y: [0, 5, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="hidden items-center gap-3 text-[8px] uppercase tracking-[0.2em] text-white/75 sm:flex sm:text-[9px]"
            >
              <span>Scroll to explore</span>
              <ArrowDown size={15} strokeWidth={1.3} />
            </motion.div>

            <button
              type="button"
              aria-label={
                soundEnabled ? "Mute camera sound" : "Enable camera sound"
              }
              aria-pressed={soundEnabled}
              onClick={(event) => {
                event.stopPropagation();
                setSoundEnabled((current) => !current);
              }}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white/85 backdrop-blur-sm transition hover:border-[#c9a875] hover:text-[#c9a875]"
            >
              {soundEnabled ? (
                <Volume2 size={16} strokeWidth={1.5} />
              ) : (
                <VolumeX size={16} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Custom cursor */}
        {!reduced && aiming && (
          <motion.div
            className="pointer-events-none fixed left-0 top-0 z-[80] hidden h-10 w-10 items-center justify-center rounded-full border border-white/55 text-white/80 mix-blend-difference md:flex"
            style={{
              x: smoothX,
              y: smoothY,
              translateX: "-50%",
              translateY: "-50%",
            }}
          >
            <Plus size={14} strokeWidth={1.2} />
          </motion.div>
        )}

        {/* Shutter blades */}
        {!reduced && <ShutterIris trigger={shutter} />}

        {/* Camera flash */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.1 : 0.26 }}
              className="pointer-events-none absolute inset-0 z-[90] bg-white"
            />
          )}
        </AnimatePresence>

        {!heroImage && (
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[#090a0b]" />
        )}

        {failedImage && (
          <div className="pointer-events-none absolute bottom-24 right-8 z-10 text-[8px] uppercase tracking-[0.18em] text-white/50">
            Hero image unavailable
          </div>
        )}
      </section>
    </>
  );
}
