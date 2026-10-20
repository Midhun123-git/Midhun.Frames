import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Star,
  Quote,
  Send,
  LogIn,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Camera,
  Heart,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import api from "../api/api.js";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const formatDate = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

/* ------------------------------------------------------------------ */
/* HERO BACKDROP: a contact sheet. Film strips drift across a light    */
/* table and the photographer's favourites are marked as picks.        */
/* ------------------------------------------------------------------ */

const FRAME_W = 210;
const FRAME_H = 140;

const sceneOrder = [
  "sunset",
  "arch",
  "rings",
  "portrait",
  "lights",
  "horizon",
  "bokeh",
  "mountains",
];

const filmRows = [
  { offset: 0, reverse: false, duration: 110, pickAt: 2 },
  { offset: 3, reverse: true, duration: 130, pickAt: 5 },
  { offset: 6, reverse: false, duration: 120, pickAt: 0 },
];

const sprocketStyle = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgba(201,169,106,0.32) 0px, rgba(201,169,106,0.32) 9px, transparent 9px, transparent 21px)",
};

// Gradients shared by every frame, defined once.
function SceneDefs() {
  return (
    <svg
      width="0"
      height="0"
      className="absolute"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="fs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d1610" />
          <stop offset="55%" stopColor="#8a6a3c" />
          <stop offset="100%" stopColor="#e0c28b" />
        </linearGradient>
        <linearGradient id="fs-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e0e12" />
          <stop offset="60%" stopColor="#3b2f2a" />
          <stop offset="100%" stopColor="#c9a96a" />
        </linearGradient>
        <linearGradient id="fs-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0a0a" />
          <stop offset="100%" stopColor="#2b2218" />
        </linearGradient>
        <linearGradient id="fs-warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0c28b" />
          <stop offset="100%" stopColor="#6b4f2a" />
        </linearGradient>
        <radialGradient id="fs-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f3dfb0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#c9a96a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Scene({ type }) {
  switch (type) {
    case "sunset":
      return (
        <>
          <rect width="200" height="140" fill="url(#fs-sky)" />
          <circle cx="100" cy="88" r="62" fill="url(#fs-glow)" />
          <circle cx="100" cy="88" r="20" fill="#f3dfb0" opacity="0.92" />
          <path d="M0 110 Q50 85 100 105 T200 100 V140 H0Z" fill="#17120c" />
          <path d="M0 125 Q60 105 120 122 T200 118 V140 H0Z" fill="#0d0b08" />
        </>
      );

    case "arch":
      return (
        <>
          <rect width="200" height="140" fill="url(#fs-dusk)" />
          <path
            d="M62 140 V70 a38 38 0 0 1 76 0 V140"
            fill="url(#fs-glow)"
            stroke="#e0c28b"
            strokeWidth="2"
            opacity="0.9"
          />
          <circle cx="92" cy="88" r="6" fill="#0b0908" />
          <path d="M82 140 q0 -38 10 -38 q10 0 10 38z" fill="#0b0908" />
          <circle cx="110" cy="85" r="6.5" fill="#0b0908" />
          <path d="M99 140 q0 -42 11 -42 q11 0 11 42z" fill="#0b0908" />
        </>
      );

    case "rings":
      return (
        <>
          <rect width="200" height="140" fill="url(#fs-night)" />
          <circle cx="100" cy="70" r="64" fill="url(#fs-glow)" opacity="0.55" />
          <circle cx="86" cy="76" r="26" fill="none" stroke="#e0c28b" strokeWidth="3" />
          <circle cx="114" cy="76" r="26" fill="none" stroke="#c9a96a" strokeWidth="3" />
          <polygon points="100,34 106,44 100,54 94,44" fill="#f3dfb0" />
        </>
      );

    case "portrait":
      return (
        <>
          <rect width="200" height="140" fill="url(#fs-dusk)" />
          <circle cx="112" cy="62" r="60" fill="url(#fs-glow)" opacity="0.6" />
          <ellipse cx="100" cy="62" rx="20" ry="25" fill="#120e0a" />
          <path d="M48 140 Q52 100 100 98 Q148 100 152 140Z" fill="#120e0a" />
          <path
            d="M118 48 q9 14 -2 32"
            fill="none"
            stroke="#e0c28b"
            strokeWidth="1.5"
            opacity="0.75"
          />
        </>
      );

    case "lights":
      return (
        <>
          <rect width="200" height="140" fill="url(#fs-night)" />
          <path d="M0 30 Q100 84 200 30" fill="none" stroke="#6b4f2a" strokeWidth="1" />
          {[
            [20, 41],
            [50, 56],
            [80, 64],
            [110, 66],
            [140, 62],
            [170, 50],
            [195, 36],
          ].map(([x, y]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="13" fill="url(#fs-glow)" />
              <circle cx={x} cy={y} r="3" fill="#f3dfb0" />
            </g>
          ))}
        </>
      );

    case "horizon":
      return (
        <>
          <rect width="200" height="140" fill="url(#fs-sky)" />
          <circle cx="100" cy="72" r="46" fill="url(#fs-glow)" />
          <circle cx="100" cy="72" r="15" fill="#f3dfb0" />
          <rect y="88" width="200" height="52" fill="#14100b" />
          {[
            [80, 94, 40],
            [70, 101, 60],
            [82, 108, 36],
            [60, 115, 80],
            [76, 123, 48],
          ].map(([x, y, w]) => (
            <rect key={y} x={x} y={y} width={w} height="2" fill="#e0c28b" opacity="0.55" />
          ))}
        </>
      );

    case "bokeh":
      return (
        <>
          <rect width="200" height="140" fill="url(#fs-warm)" opacity="0.8" />
          {[
            [40, 40, 24, 0.5],
            [90, 80, 34, 0.35],
            [150, 38, 20, 0.6],
            [160, 100, 28, 0.4],
            [60, 112, 16, 0.55],
            [118, 28, 12, 0.7],
          ].map(([x, y, r, o]) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={r}
              fill="#f3dfb0"
              fillOpacity={o * 0.4}
              stroke="#f3dfb0"
              strokeOpacity={o}
              strokeWidth="1"
            />
          ))}
        </>
      );

    default:
      return (
        <>
          <rect width="200" height="140" fill="url(#fs-dusk)" />
          <circle cx="150" cy="34" r="12" fill="#f3dfb0" />
          <circle cx="150" cy="34" r="40" fill="url(#fs-glow)" opacity="0.5" />
          <polygon points="0,140 50,70 90,120 130,60 200,140" fill="#17120c" />
          <polygon points="60,140 110,92 160,140" fill="#0d0b08" />
        </>
      );
  }
}

function Frame({ scene, number, pick }) {
  return (
    <div className="relative mx-1.5 shrink-0" style={{ width: FRAME_W }}>
      <div
        className="relative overflow-hidden border border-white/10 bg-black"
        style={{ height: FRAME_H }}
      >
        <svg
          viewBox="0 0 200 140"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <Scene type={scene} />
        </svg>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[8px] tracking-[0.18em] text-[#c9a96a]/60">
        <span>â–¸ {String(number).padStart(2, "0")}A</span>
        <span>MF 400</span>
      </div>

      {/* Grease-pencil pick mark */}
      {pick && (
        <div
          className="pointer-events-none absolute -left-1.5 -top-1.5"
          style={{ width: FRAME_W + 12, height: FRAME_H + 12 }}
        >
          <svg
            viewBox="0 0 222 152"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path
              d="M8 20 C 30 -4, 170 -6, 206 18 C 222 50, 214 110, 196 128 C 150 150, 50 148, 14 126 C -4 96, -2 48, 12 22"
              fill="none"
              stroke="#e0c28b"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.95"
            />
          </svg>
          <Star
            size={15}
            fill="#e0c28b"
            className="absolute -right-2 -top-2 text-[#e0c28b]"
          />
        </div>
      )}
    </div>
  );
}

function FilmStrip({ offset, reverse, duration, pickAt, reduceMotion }) {
  const base = sceneOrder.map(
    (_, i) => sceneOrder[(i + offset) % sceneOrder.length]
  );

  // Three copies so the loop never shows a gap, even on wide screens.
  const frames = [0, 1, 2].flatMap((copy) =>
    base.map((scene, i) => ({
      key: `${copy}-${i}`,
      scene,
      number: i + 1,
      pick: i === pickAt,
    }))
  );

  return (
    <motion.div
      className="w-max border-y border-white/[0.06] bg-[#0b0a09]"
      animate={
        reduceMotion
          ? undefined
          : { x: reverse ? ["-33.3333%", "0%"] : ["0%", "-33.3333%"] }
      }
      transition={{ duration, ease: "linear", repeat: Infinity }}
    >
      <div className="my-2 h-[6px]" style={sprocketStyle} />

      <div className="flex">
        {frames.map((frame) => (
          <Frame
            key={frame.key}
            scene={frame.scene}
            number={frame.number}
            pick={frame.pick}
          />
        ))}
      </div>

      <div className="my-2 h-[6px]" style={sprocketStyle} />
    </motion.div>
  );
}

function HeroBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <SceneDefs />

      {/* Light table glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,rgba(224,194,139,0.16),transparent_60%)]" />

      {/* Tilted wall of film strips */}
      <div className="absolute -left-[12%] -right-[12%] top-1/2 flex -translate-y-1/2 -rotate-[7deg] flex-col gap-6 opacity-45 md:opacity-65">
        {filmRows.map((row, index) => (
          <FilmStrip key={index} {...row} reduceMotion={reduceMotion} />
        ))}
      </div>

      {/* Light leaks */}
      <motion.div
        className="absolute -right-[15%] -top-[25%] h-[70vw] max-h-[900px] w-[70vw] max-w-[900px] rounded-full bg-[radial-gradient(circle,rgba(255,160,70,0.30),transparent_65%)] mix-blend-screen blur-2xl"
        animate={reduceMotion ? undefined : { opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
      />
      <div className="absolute -bottom-[30%] -left-[10%] h-[50vw] max-h-[700px] w-[50vw] max-w-[700px] rounded-full bg-[radial-gradient(circle,rgba(201,169,106,0.20),transparent_65%)] mix-blend-screen blur-2xl" />

      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />

      {/* Keep headline readable and blend into next section */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/95 via-[#080808]/60 to-[#080808]/15" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/60 via-transparent to-[#080808]" />
    </div>
  );
}

function StarRating({ rating = 5, size = 14 }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          fill={index < Number(rating) ? "#c9a96a" : "transparent"}
          className={index < Number(rating) ? "text-[#c9a96a]" : "text-white/15"}
        />
      ))}
    </div>
  );
}

function ReviewAvatar({ review, size = "h-12 w-12" }) {
  const [imageError, setImageError] = useState(false);

  const image =
    review?.profilePicture ||
    review?.picture ||
    review?.avatar ||
    review?.photoURL ||
    "";

  const initials = (review?.client || "Client")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    setImageError(false);
  }, [image]);

  // Viewfinder frame: square photo with gold focus brackets.
  // Brackets sit slightly outside and snap in (focus lock) on hover.
  const bracket =
    "pointer-events-none absolute h-2.5 w-2.5 border-[#e0c28b] transition-all duration-300";

  return (
    <div className={`group relative ${size} shrink-0`}>
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[2px] bg-gradient-to-br from-[#c9a96a]/20 to-white/[0.03] ring-1 ring-[#c9a96a]/25">
        {image && !imageError ? (
          <img
            src={image}
            alt={`${review?.client || "Client"} profile`}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium tracking-wide text-[#c9a96a]">
            {initials}
          </span>
        )}
      </div>

      <span
        className={`${bracket} -left-1.5 -top-1.5 border-l border-t group-hover:-left-0.5 group-hover:-top-0.5`}
      />
      <span
        className={`${bracket} -right-1.5 -top-1.5 border-r border-t group-hover:-right-0.5 group-hover:-top-0.5`}
      />
      <span
        className={`${bracket} -bottom-1.5 -left-1.5 border-b border-l group-hover:-bottom-0.5 group-hover:-left-0.5`}
      />
      <span
        className={`${bracket} -bottom-1.5 -right-1.5 border-b border-r group-hover:-bottom-0.5 group-hover:-right-0.5`}
      />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="h-px w-8 bg-[#c9a96a]" />
      <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#c9a96a]">
        {children}
      </span>
    </div>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [featuredReview, setFeaturedReview] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [userLoggedIn, setUserLoggedIn] = useState(
    Boolean(localStorage.getItem("userToken"))
  );

  const [form, setForm] = useState({
    rating: 5,
    review: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);

      const response = await api.get("/reviews/public");
      const data = response.data;

      if (data.success && Array.isArray(data.reviews)) {
        const formattedReviews = data.reviews.map((review) => ({
          ...review,
          createdAt: formatDate(review.createdAt),
        }));

        setReviews(formattedReviews);

        setFeaturedReview(
          formattedReviews.find((review) => review.featured === true) ||
            formattedReviews[0] ||
            null
        );
      } else {
        setReviews([]);
        setFeaturedReview(null);
      }
    } catch (error) {
      console.error("Failed to load public reviews:", error);
      setReviews([]);
      setFeaturedReview(null);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();

    const handleUserAuthChanged = () => {
      setUserLoggedIn(Boolean(localStorage.getItem("userToken")));
    };

    window.addEventListener("userAuthChanged", handleUserAuthChanged);

    return () => {
      window.removeEventListener("userAuthChanged", handleUserAuthChanged);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSubmitMessage("");
    setSubmitError("");
  };

  const handleRating = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
    setSubmitMessage("");
    setSubmitError("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    const userToken = localStorage.getItem("userToken");

    if (!userToken) {
      setSubmitError("Please log in to share your experience.");
      return;
    }

    if (!form.review.trim()) {
      setSubmitError("Please write your review.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMessage("");
      setSubmitError("");

      const response = await api.post(
        "/reviews",
        {
          rating: Number(form.rating),
          review: form.review.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      setSubmitMessage(
        response.data.message ||
          "Thank you! Your review has been submitted for approval."
      );

      setForm({
        rating: 5,
        review: "",
      });

      await fetchReviews();
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          "We couldn't submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    if (!reviews.length) {
      return { total: 0, average: 0, fiveStar: 0 };
    }

    const totalRating = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return {
      total: reviews.length,
      average: (totalRating / reviews.length).toFixed(1),
      fiveStar: reviews.filter((review) => Number(review.rating) === 5).length,
    };
  }, [reviews]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#080808] text-[#f3f0e9]">
      {/* HERO */}
      <section className="relative flex min-h-[78vh] items-center px-5 py-24 sm:px-8 md:min-h-[85vh] md:px-12 lg:px-20">
        <HeroBackdrop />

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="max-w-5xl"
          >
            <motion.div variants={item}>
              <SectionLabel>Stories from our clients</SectionLabel>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-5xl font-light leading-[0.98] tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-[7rem]"
            >
              More than
              <br />
              just a <span className="text-[#c9a96a]">moment.</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-7 max-w-xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8"
            >
              Every photograph holds a memory. Every story holds a feeling.
              Read about the moments our clients trusted us to capture.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-9 flex flex-col gap-4 sm:flex-row"
            >
              <a
                href="#all-reviews"
                className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-sm bg-[#c9a96a] px-6 py-3 text-black transition-all duration-300 hover:bg-[#e0c28b]"
              >
                <span className="text-xs font-medium tracking-wide">
                  Read Client Stories
                </span>
                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:rotate-45"
                />
              </a>

              <a
                href="#share-review"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-sm border border-white/20 px-6 py-3 text-white transition-colors hover:border-white/50 hover:bg-white/[0.04]"
              >
                <MessageCircle size={16} />
                <span className="text-xs tracking-wide">Write a Review</span>
              </a>
            </motion.div>

            <motion.div
              variants={item}
              className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-white/45"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#c9a96a]" />
                Genuine client feedback
              </div>
              <span className="hidden h-4 w-px bg-white/20 sm:block" />
              <div className="flex items-center gap-2">
                <Heart size={14} className="text-[#c9a96a]" />
                Memories made together
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-5 sm:px-8 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
          {[
            {
              icon: MessageCircle,
              value: stats.total,
              label: "Published reviews",
              detail: "Real client experiences",
            },
            {
              icon: Star,
              value: stats.average,
              label: "Average rating",
              detail: "Based on published reviews",
            },
            {
              icon: Sparkles,
              value: stats.fiveStar,
              label: "Five-star reviews",
              detail: "Memories worth celebrating",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="group rounded-sm border border-white/[0.09] bg-gradient-to-br from-white/[0.045] to-transparent p-6 transition-colors duration-300 hover:border-[#c9a96a]/30 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a96a]/25 bg-[#c9a96a]/[0.07]">
                    <Icon size={17} className="text-[#c9a96a]" />
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-white/20 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#c9a96a]"
                  />
                </div>

                <p className="mt-6 text-4xl font-light tracking-tight sm:text-5xl">
                  {stat.value}
                </p>

                <p className="mt-2 text-sm text-white/80">{stat.label}</p>
                <p className="mt-1 text-xs text-white/35">{stat.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURED REVIEW */}
      <section className="px-5 py-24 sm:px-8 md:px-12 md:py-32 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <SectionLabel>A little love from our clients</SectionLabel>
              <h2 className="text-3xl font-light tracking-tight sm:text-4xl md:text-5xl">
                The story that stays.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/40">
              The most meaningful part of our work is knowing how much these
              memories mean to you.
            </p>
          </div>

          {loadingReviews ? (
            <div className="h-72 animate-pulse rounded-sm border border-white/10 bg-white/[0.025]" />
          ) : featuredReview ? (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="overflow-hidden rounded-sm border border-white/10 bg-[#0d0d0d]"
            >
              <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
                <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden border-b border-white/[0.06] bg-gradient-to-br from-[#c9a96a]/10 via-[#111] to-[#080808] p-7 sm:p-10 lg:min-h-[440px] lg:border-b-0 lg:border-r">
                  <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-[#c9a96a]/10" />
                  <div className="absolute -right-7 -top-7 h-36 w-36 rounded-full border border-[#c9a96a]/10" />

                  <div className="relative flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#c9a96a]">
                    <Sparkles size={14} />
                    Featured story
                  </div>

                  <div className="relative mt-16">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a96a]/25 bg-black/20">
                      <Quote
                        size={30}
                        strokeWidth={1}
                        className="text-[#c9a96a]"
                      />
                    </div>

                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      Captured with care
                    </p>

                    <p className="mt-2 text-2xl font-light tracking-tight">
                      {featuredReview.service || "A story worth sharing"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-center p-6 sm:p-9 md:p-12 lg:p-14">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StarRating rating={featuredReview.rating} size={15} />
                    <span className="rounded-full border border-[#c9a96a]/20 bg-[#c9a96a]/[0.06] px-3 py-1.5 text-[10px] text-[#c9a96a]">
                      Client favourite
                    </span>
                  </div>

                  <p className="mt-8 text-xl font-light leading-relaxed text-white/85 sm:text-2xl md:text-3xl">
                    â€œ{featuredReview.review}â€
                  </p>

                  {featuredReview.adminReply && (
                    <div className="mt-7 rounded-sm border border-[#c9a96a]/15 bg-[#c9a96a]/[0.04] p-4 sm:p-5">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#c9a96a]">
                        A note from Midhun Frames
                      </p>
                      <p className="mt-2 text-sm leading-7 text-white/55">
                        {featuredReview.adminReply}
                      </p>
                    </div>
                  )}

                  <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
                    <ReviewAvatar review={featuredReview} size="h-12 w-12" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white/90">
                        {featuredReview.client}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {[featuredReview.createdAt, featuredReview.service]
                          .filter(Boolean)
                          .join(" Â· ")}
                      </p>
                    </div>
                    <CheckCircle2
                      size={17}
                      className="ml-auto shrink-0 text-[#c9a96a]"
                    />
                  </div>
                </div>
              </div>
            </motion.article>
          ) : (
            <div className="rounded-sm border border-white/10 bg-[#0d0d0d] px-6 py-12 text-center sm:px-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a96a]/20 bg-[#c9a96a]/[0.05]">
                <Quote size={23} className="text-[#c9a96a]" />
              </div>
              <h3 className="mt-5 text-xl font-light sm:text-2xl">
                Our first client story is waiting.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
                Published reviews will appear here after they're approved.
              </p>
              <a
                href="#share-review"
                className="mt-6 inline-flex items-center gap-2 text-sm text-[#c9a96a] transition-colors hover:text-white"
              >
                Share your experience <ChevronRight size={16} />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ALL REVIEWS */}
      <section
        id="all-reviews"
        className="scroll-mt-20 border-y border-white/[0.06] bg-[#0a0a0a] px-5 py-24 sm:px-8 md:px-12 md:py-28 lg:px-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel>Kind words, lasting memories</SectionLabel>
              <h2 className="text-3xl font-light tracking-tight sm:text-4xl md:text-5xl">
                From the people who matter.
              </h2>
            </div>

            <p className="max-w-sm text-sm leading-6 text-white/40">
              Every experience is different. We're grateful to be part of each
              one.
            </p>
          </div>

          {loadingReviews ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-sm border border-white/10 bg-white/[0.02]"
                />
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.08 }}
              className="grid gap-4 md:grid-cols-2"
            >
              {reviews.map((review, index) => (
                <motion.article
                  variants={item}
                  key={review._id || index}
                  className="group flex h-full flex-col rounded-sm border border-white/[0.09] bg-[#0e0e0e] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a96a]/30 hover:bg-[#111] sm:p-8"
                >
                  <div className="flex items-center justify-between gap-4">
                    <StarRating rating={review.rating} size={14} />
                    <span className="text-[10px] tracking-[0.18em] text-white/25">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-7 flex-1">
                    <Quote
                      size={21}
                      strokeWidth={1}
                      className="mb-3 text-[#c9a96a]/65"
                    />
                    <p className="text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                      {review.review}
                    </p>
                  </div>

                  <div className="mt-7 border-t border-white/[0.08] pt-5">
                    <div className="flex items-center gap-3">
                      <ReviewAvatar review={review} size="h-11 w-11" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white/90">
                          {review.client}
                        </p>
                        <p className="mt-1 truncate text-xs text-white/40">
                          {[review.service, review.createdAt]
                            .filter(Boolean)
                            .join(" Â· ")}
                        </p>
                      </div>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-white/30 transition-colors group-hover:border-[#c9a96a]/30 group-hover:text-[#c9a96a]">
                        <ArrowUpRight size={15} />
                      </div>
                    </div>

                    {review.adminReply && (
                      <div className="mt-5 rounded-sm border-l-2 border-[#c9a96a]/50 bg-white/[0.02] px-4 py-3">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#c9a96a]">
                          From Midhun Frames
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/50">
                          {review.adminReply}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </motion.div>
          ) : (
            <div className="rounded-sm border border-white/10 bg-[#0e0e0e] px-6 py-12 text-center sm:px-10 sm:py-16">
              <MessageCircle
                size={28}
                className="mx-auto text-[#c9a96a]"
                strokeWidth={1}
              />
              <h3 className="mt-5 text-xl font-light sm:text-2xl">
                We'd love to hear your story.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/40">
                There are no published reviews yet. Your experience could be
                the first to inspire someone.
              </p>
              <a
                href="#share-review"
                className="mt-6 inline-flex items-center gap-2 text-sm text-[#c9a96a] hover:text-white"
              >
                Write the first review <ArrowUpRight size={16} />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* REVIEW FORM */}
      <section
        id="share-review"
        className="scroll-mt-20 px-5 py-24 sm:px-8 md:px-12 md:py-32 lg:px-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <SectionLabel>Your experience matters</SectionLabel>

              <h2 className="text-4xl font-light leading-tight tracking-[-0.045em] sm:text-5xl md:text-6xl">
                How did we
                <br />
                make you <span className="text-[#c9a96a]">feel?</span>
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/50 sm:text-base sm:leading-8">
                Your words mean more than you know. Tell us about your
                experience and help another person feel confident choosing
                Midhun Frames.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Your account, your review",
                    text: "Your account details are used automatically.",
                  },
                  {
                    icon: Heart,
                    title: "Honest feedback matters",
                    text: "Share what you genuinely experienced.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Reviewed before publishing",
                    text: "Your review appears after admin approval.",
                  },
                ].map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div key={feature.title} className="flex gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a96a]/20 bg-[#c9a96a]/[0.05]">
                        <Icon size={16} className="text-[#c9a96a]" />
                      </div>
                      <div>
                        <p className="text-sm text-white/80">
                          {feature.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-white/40">
                          {feature.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!userLoggedIn ? (
              <div className="flex flex-col justify-center rounded-sm border border-white/10 bg-[#0e0e0e] p-6 sm:p-10 md:p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a96a]/25 bg-[#c9a96a]/[0.07]">
                  <LogIn size={22} className="text-[#c9a96a]" />
                </div>

                <h3 className="mt-6 text-2xl font-light sm:text-3xl">
                  Let's start with a quick login.
                </h3>

                <p className="mt-3 max-w-lg text-sm leading-7 text-white/45">
                  Sign in to share your review. We'll use your account details
                  so you can focus on telling us about your experience.
                </p>

                <a
                  href="/login"
                  className="mt-7 inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-sm bg-[#c9a96a] px-6 py-3 text-black transition-colors hover:bg-[#e0c28b]"
                >
                  <span className="text-xs font-medium">Login to continue</span>
                  <ArrowUpRight size={16} />
                </a>

                <p className="mt-5 text-xs text-white/30">
                  Already have an account? You're just one step away.
                </p>
              </div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onSubmit={handleSubmitReview}
                className="rounded-sm border border-white/10 bg-[#0e0e0e] p-5 sm:p-8 md:p-10"
              >
                <div className="mb-8 flex items-center gap-3 border-b border-white/[0.08] pb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a96a]/25 bg-[#c9a96a]/[0.06]">
                    <Camera size={17} className="text-[#c9a96a]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-light sm:text-xl">
                      Share your experience
                    </h3>
                    <p className="mt-1 text-xs text-white/40">
                      It only takes a couple of minutes.
                    </p>
                  </div>
                </div>

                <fieldset>
                  <legend className="mb-3 text-xs font-medium text-white/75">
                    How would you rate your experience?
                  </legend>

                  <div className="rounded-sm border border-white/10 bg-[#080808] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleRating(rating)}
                          aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
                          aria-pressed={form.rating === rating}
                          className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 ${
                            form.rating === rating
                              ? "border-[#c9a96a]/60 bg-[#c9a96a]/15"
                              : "border-transparent hover:border-white/15"
                          }`}
                        >
                          <Star
                            size={22}
                            fill={rating <= form.rating ? "#c9a96a" : "transparent"}
                            className={
                              rating <= form.rating
                                ? "text-[#c9a96a]"
                                : "text-white/25"
                            }
                          />
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-white/40">
                        {form.rating === 5
                          ? "Absolutely loved it!"
                          : form.rating === 4
                            ? "A really good experience"
                            : form.rating === 3
                              ? "It was a good experience"
                              : form.rating === 2
                                ? "Could have been better"
                                : "Tell us how we can improve"}
                      </p>
                      <span className="text-xs text-[#c9a96a]">
                        {form.rating} of 5
                      </span>
                    </div>
                  </div>
                </fieldset>

                <div className="mt-7">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label
                      htmlFor="review-text"
                      className="text-xs font-medium text-white/75"
                    >
                      Tell us your story
                    </label>
                    <span className="text-[10px] text-white/35">
                      {form.review.length}/1000
                    </span>
                  </div>

                  <textarea
                    id="review-text"
                    name="review"
                    value={form.review}
                    onChange={handleChange}
                    rows={6}
                    maxLength={1000}
                    required
                    placeholder="What did you enjoy most? How did the experience feel? We'd love to hear..."
                    className="w-full resize-y rounded-sm border border-white/10 bg-[#080808] px-4 py-4 text-sm leading-7 text-white/85 outline-none transition-colors placeholder:text-white/25 focus:border-[#c9a96a]/60"
                  />
                </div>

                {submitMessage && (
                  <div
                    role="status"
                    className="mt-6 flex items-start gap-3 rounded-sm border border-[#c9a96a]/25 bg-[#c9a96a]/[0.06] p-4"
                  >
                    <CheckCircle2
                      size={19}
                      className="mt-0.5 shrink-0 text-[#c9a96a]"
                    />
                    <div>
                      <p className="text-sm text-white/90">
                        Thank you for sharing!
                      </p>
                      <p className="mt-1 text-xs leading-6 text-white/55">
                        {submitMessage}
                      </p>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div
                    role="alert"
                    className="mt-6 rounded-sm border border-red-400/20 bg-red-400/[0.05] p-4"
                  >
                    <p className="text-sm leading-6 text-red-200/85">
                      {submitError}
                    </p>
                  </div>
                )}

                <div className="mt-7 border-t border-white/[0.08] pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group flex min-h-12 w-full items-center justify-center gap-3 rounded-sm bg-[#c9a96a] px-6 py-4 text-black transition-all duration-300 hover:bg-[#e0c28b] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="text-xs font-medium">
                        Submitting your review...
                      </span>
                    ) : (
                      <>
                        <Send
                          size={16}
                          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                        <span className="text-xs font-semibold">
                          Share My Review
                        </span>
                        <ArrowUpRight
                          size={16}
                          className="transition-transform group-hover:rotate-45"
                        />
                      </>
                    )}
                  </button>

                  <p className="mt-4 text-center text-[11px] leading-5 text-white/35">
                    Your review will be published after approval. Thank you for
                    being part of our story.
                  </p>
                </div>
              </motion.form>
            )}
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="relative overflow-hidden border-t border-white/[0.06] px-5 py-24 sm:px-8 md:px-12 md:py-32 lg:px-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-[#10100e] to-[#080808]" />
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c9a96a]/40 to-transparent" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a96a]/25 bg-[#c9a96a]/[0.06]">
            <Heart size={23} strokeWidth={1} className="text-[#c9a96a]" />
          </div>

          <p className="mt-7 text-[10px] uppercase tracking-[0.3em] text-[#c9a96a]">
            Thank you for being here
          </p>

          <h2 className="mt-5 text-4xl font-light leading-tight tracking-[-0.05em] sm:text-5xl md:text-7xl">
            Your memories.
            <br />
            <span className="text-white/45">Our privilege.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
            Every story shared with us is a reminder of why we love what we do.
            We look forward to capturing more moments that matter.
          </p>

          <a
            
            className="group mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-sm border border-[#c9a96a]/40 px-6 py-3 text-[#e1c58f] transition-all duration-300 hover:border-[#c9a96a] hover:bg-[#c9a96a] hover:text-black"
          >
            <span className="text-xs font-medium">Let's Create Memories</span>
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:rotate-45"
            />
          </a>
        </div>
      </section>
    </main>
  );
}
