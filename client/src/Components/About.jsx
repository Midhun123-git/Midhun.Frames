import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import api from "../api/api.js"

const fStops = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16]

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0 },
}

// reel auto scroll
const BASE_SPEED = 22 // px per second (slow)
const SPEEDS = [0.5, 1, 2]
const RESUME_DELAY = 1800 // ms after user touch/wheel/drag

function About() {
  const [about, setAbout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryHover, setGalleryHover] = useState(false)

  const filmstripRef = useRef(null)
  const dragState = useRef({ down: false, startX: 0, startScroll: 0 })

  const [portraitHover, setPortraitHover] = useState(false)
  const [reelTilt, setReelTilt] = useState({ x: 0, y: 0 })
  const reelRef = useRef(null)
  const [dialHover, setDialHover] = useState(false)

  // reel controls
  const framesScrollRef = useRef(null)
  const [reelPaused, setReelPaused] = useState(false)
  const [speedIndex, setSpeedIndex] = useState(1)

  const framesState = useRef({
    dragging: false,
    hovering: false,
    userPaused: false,
    speed: 1,
    startY: 0,
    startScroll: 0,
    setHeight: 0,
    pos: 0,
    pauseUntil: 0,
  })

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const response = await api.get("/about/public")
        if (response.data?.success) {
          setAbout(response.data.about)
        }
      } catch (error) {
        console.error("Failed to load About content", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAbout()
  }, [])

  const mainImage = about?.mainImage?.url || ""
  const filmStripImages = about?.filmStripImages || []
  const selectedWorkImages = about?.selectedWorkImages || []

  // make one set long enough so wrap always works (min 4 frames)
  const reps = filmStripImages.length
    ? Math.ceil(4 / filmStripImages.length)
    : 0
  const baseSet = Array.from({ length: reps }).flatMap(() => filmStripImages)
  const loopedImages = [...baseSet, ...baseSet, ...baseSet]

  const wrapFramesScroll = () => {
    const el = framesScrollRef.current
    const s = framesState.current
    if (!el || !s.setHeight) return

    if (el.scrollTop >= s.setHeight * 2) {
      el.scrollTop -= s.setHeight
    } else if (el.scrollTop <= 0) {
      el.scrollTop += s.setHeight
    }
  }

  const holdAuto = () => {
    framesState.current.pauseUntil = performance.now() + RESUME_DELAY
  }

  // infinite auto scroll. Own float position, because
  // el.scrollTop += 0.3 gets rounded away in many browsers.
  useEffect(() => {
    const el = framesScrollRef.current
    if (!el || filmStripImages.length === 0) return

    const s = framesState.current
    let rafId
    let last = performance.now()
    let inited = false

    const tick = (now) => {
      const dt = Math.min(now - last, 64) / 1000
      last = now

      const setHeight = el.scrollHeight / 3

      if (setHeight > 0) {
        s.setHeight = setHeight

        if (!inited) {
          s.pos = setHeight
          el.scrollTop = setHeight
          inited = true
        }

        const active =
          !s.userPaused &&
          !s.dragging &&
          !s.hovering &&
          now > s.pauseUntil

        if (active) {
          s.pos += BASE_SPEED * s.speed * dt
          if (s.pos >= setHeight * 2) s.pos -= setHeight
          el.scrollTop = s.pos
        } else {
          wrapFramesScroll()
          s.pos = el.scrollTop
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [filmStripImages.length])

  // wheel on reel: native listener so page does not scroll too
  useEffect(() => {
    const el = framesScrollRef.current
    if (!el) return

    const onWheel = (e) => {
      e.preventDefault()
      el.scrollTop += e.deltaY
      wrapFramesScroll()
      holdAuto()
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [filmStripImages.length])

  const handleReelMove = (e) => {
    if (!reelRef.current || e.pointerType === "touch") return
    const rect = reelRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setReelTilt({ x: py * -6, y: px * 8 })
  }

  const resetReelTilt = () => setReelTilt({ x: 0, y: 0 })

  // reel hover / drag (mouse). Touch uses native scroll.
  const handleFramesEnter = (e) => {
    if (e.pointerType === "mouse") framesState.current.hovering = true
  }

  const handleFramesLeave = () => {
    framesState.current.hovering = false
    framesState.current.dragging = false
    holdAuto()
  }

  const handleFramesPointerDown = (e) => {
    if (e.pointerType !== "mouse") return
    const s = framesState.current
    s.dragging = true
    s.startY = e.clientY
    s.startScroll = framesScrollRef.current?.scrollTop || 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const handleFramesPointerMove = (e) => {
    const s = framesState.current
    if (!s.dragging || !framesScrollRef.current) return
    framesScrollRef.current.scrollTop = s.startScroll - (e.clientY - s.startY)
    wrapFramesScroll()
  }

  const handleFramesPointerUp = () => {
    framesState.current.dragging = false
    holdAuto()
  }

  const handleFramesTouch = () => holdAuto()

  const stepReel = (dir) => {
    const el = framesScrollRef.current
    if (!el) return
    const frame = el.querySelector("[data-frame]")
    const step = (frame?.offsetHeight || 120) + 3

    framesState.current.pauseUntil = performance.now() + RESUME_DELAY + 800
    el.scrollBy({ top: dir * step, behavior: "smooth" })
  }

  const toggleReelPause = () => {
    const next = !framesState.current.userPaused
    framesState.current.userPaused = next
    setReelPaused(next)
  }

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length
    framesState.current.speed = SPEEDS[next]
    setSpeedIndex(next)
  }

  // selected work filmstrip (horizontal)
  const scrollFilmstrip = (dir) => {
    if (filmstripRef.current) {
      filmstripRef.current.scrollBy({
        left: dir * 300,
        behavior: "smooth",
      })
    }
  }

  const handleWheel = (e) => {
    // only convert vertical wheel when there is no horizontal intent
    if (filmstripRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      filmstripRef.current.scrollLeft += e.deltaY
    }
  }

  const handleMouseDown = (e) => {
    dragState.current = {
      down: true,
      startX: e.pageX,
      startScroll: filmstripRef.current?.scrollLeft || 0,
    }
  }

  const endDrag = () => {
    dragState.current.down = false
  }

  const handleMouseMove = (e) => {
    if (!dragState.current.down || !filmstripRef.current) return
    const dx = e.pageX - dragState.current.startX
    filmstripRef.current.scrollLeft = dragState.current.startScroll - dx
  }

  const ctrlBtn =
    "flex h-7 min-w-7 items-center justify-center rounded-full border border-[#e5d4cc]/20 px-2 text-[10px] text-[#e5d4cc]/70 transition-colors duration-300 hover:border-[#e5d4cc]/60 hover:text-[#e5d4cc] active:scale-95"

  if (loading) {
    return (
      <section
        id="info"
        className="relative overflow-hidden bg-[#050505] px-[6%] py-[20px] text-[#e5d4cc] sm:px-[7%] lg:py-[40px]"
      >
        <div className="mx-auto flex min-h-[500px] max-w-[1350px] items-center justify-center">
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#e5d4cc]/40">
            Loading
          </p>
        </div>
      </section>
    )
  }

  if (!about) {
    return null
  }

  return (
    <section
      id="info"
      className="relative overflow-hidden bg-[#050505] px-[6%] py-[10px] text-[#e5d4cc] sm:px-[7%] lg:py-[30px]"
    >
      <div className="relative mx-auto max-w-[1350px]">
        {/* header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="mb-[50px] flex items-start justify-between max-md:flex-col max-md:gap-6 lg:mb-[90px]"
        >
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#e5d4cc]/40">
              01 / About
            </p>

            <h3 className="mt-4 font-serif text-[30px] font-normal leading-[1] text-[#e3cec4] md:text-[42px]">
              {about.heading}
            </h3>
          </div>

          <div className="max-w-[350px] pt-1 text-[12px] leading-[1.9] text-[#e5d4cc]/55 max-md:max-w-none">
            <p>{about.description}</p>
          </div>
        </motion.div>

        {/* hero area: stacked on mobile/tablet, absolute collage on lg+ */}
        <div className="relative flex flex-col gap-12 lg:block lg:min-h-[760px]">
          {/* portrait */}
          <div className="relative z-[50] mx-auto w-[220px] sm:mx-0 sm:w-[240px] lg:absolute lg:left-0 lg:top-0 lg:w-[250px]">
            {mainImage && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 1, ease: "easeOut" }}
                onMouseEnter={() => setPortraitHover(true)}
                onMouseLeave={() => setPortraitHover(false)}
                onClick={() => setPortraitHover((v) => !v)}
                className="relative aspect-square w-full overflow-hidden"
              >
                <img
                  src={mainImage}
                  alt="Midhun Frames portrait"
                  loading="lazy"
                  draggable={false}
                  style={{
                    filter: portraitHover ? "grayscale(0%)" : "grayscale(100%)",
                    transform: portraitHover ? "scale(1.05)" : "scale(1)",
                    transition:
                      "filter 900ms ease-out, transform 900ms ease-out",
                  }}
                  className="block h-full w-full object-cover"
                />
              </motion.div>
            )}

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
              className="mt-6 border-l border-[#e5d4cc]/15 pl-4"
            >
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#e5d4cc]/40">
                Midhun Frames
              </p>

              <p className="mt-3 font-serif text-[15px] italic leading-snug text-[#e3cec4]/80">
                Chasing quiet light
                <br />
                and honest frames.
              </p>

              <p className="mt-4 text-[9px] uppercase tracking-[0.2em] text-[#e5d4cc]/30">
                {about.location}
              </p>
            </motion.div>
          </div>

          {/* approach + dial (lg:contents so children position vs hero area) */}
          <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left lg:contents">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="w-full max-w-[420px] sm:max-w-[340px] lg:absolute lg:left-[32%] lg:top-[15px] lg:w-[260px] lg:max-w-none"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#e5d4cc]/35">
                {about.approachTitle}
              </p>

              <p className="mt-4 text-[12px] leading-[1.8] text-[#e5d4cc]/55 lg:text-[11px]">
                {about.approachText}
              </p>
            </motion.div>

            <div className="flex w-full justify-center sm:w-auto lg:absolute lg:left-[32%] lg:top-[145px] lg:w-[260px]">
              <div
                onMouseEnter={() => setDialHover(true)}
                onMouseLeave={() => setDialHover(false)}
                onClick={() => setDialHover((v) => !v)}
                className="relative flex h-[150px] w-[150px] shrink-0 cursor-pointer items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: dialHover ? 0 : 360 }}
                  transition={{
                    duration: 40,
                    repeat: dialHover ? 0 : Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0"
                >
                  {fStops.map((stop, i) => {
                    const angle = (360 / fStops.length) * i

                    return (
                      <span
                        key={stop}
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          transform: `rotate(${angle}deg) translate(0, -68px) rotate(${-angle}deg)`,
                        }}
                        className="-translate-x-1/2 -translate-y-1/2 text-[8px] tracking-[0.05em] text-[#e5d4cc]/35"
                      >
                        f/{stop}
                      </span>
                    )
                  })}
                </motion.div>

                <div className="absolute inset-0">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: `rotate(${i * 15}deg) translate(0, -54px)`,
                      }}
                      className="h-[6px] w-px -translate-x-1/2 bg-[#e5d4cc]/15"
                    />
                  ))}
                </div>

                <div className="absolute h-[110px] w-[110px] rounded-full border border-[#e5d4cc]/15" />

                <motion.div
                  animate={{
                    scale: dialHover ? 0.75 : 1,
                    borderColor: dialHover
                      ? "rgba(227,116,90,0.5)"
                      : "rgba(229,212,204,0.15)",
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute h-[54px] w-[54px] rounded-full border"
                />

                <div className="relative z-10 text-center">
                  <p className="font-serif text-[13px] text-[#e3cec4]">
                    {dialHover ? "1/125" : "f/2.8"}
                  </p>

                  <p className="mt-1 text-[7px] uppercase tracking-[0.2em] text-[#e5d4cc]/35">
                    {dialHover ? "Shutter" : "ISO 400"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute left-[42%] top-[85px] hidden h-[170px] w-px bg-[#e5d4cc]/20 lg:block" />

          {/* film reel */}
          {filmStripImages.length > 0 && (
            <motion.div
              ref={reelRef}
              onPointerMove={handleReelMove}
              onPointerLeave={resetReelTilt}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
              className="relative mx-auto w-[170px] sm:w-[190px] lg:absolute lg:right-0 lg:top-[30px] lg:z-20 lg:mx-0 lg:w-[210px]"
            >
              <div className="mx-auto mb-1 h-[10px] w-[26px] rounded-t-sm bg-[#e5d4cc]/25" />
              <div className="mx-auto mb-3 h-3 w-px bg-[#e5d4cc]/25" />

              <motion.div
                animate={{ rotate: [-1.2, 1.2, -1.2] }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  transform: `rotateX(${reelTilt.x}deg) rotateY(${reelTilt.y}deg)`,
                  transformStyle: "preserve-3d",
                }}
                className="origin-top"
              >
                <div className="relative flex bg-[#0a0a0a] px-2 py-3 shadow-2xl shadow-black/70">
                  <div className="flex flex-col justify-between gap-3 pr-2">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <span
                        key={`l-${i}`}
                        className="h-[7px] w-[10px] rounded-[1px] bg-[#e5d4cc]/15"
                      />
                    ))}
                  </div>

                  <div
                    ref={framesScrollRef}
                    onPointerEnter={handleFramesEnter}
                    onPointerLeave={handleFramesLeave}
                    onPointerDown={handleFramesPointerDown}
                    onPointerMove={handleFramesPointerMove}
                    onPointerUp={handleFramesPointerUp}
                    onPointerCancel={handleFramesPointerUp}
                    onTouchStart={handleFramesTouch}
                    onTouchMove={handleFramesTouch}
                    onTouchEnd={handleFramesTouch}
                    onScroll={wrapFramesScroll}
                    className="h-[300px] flex-1 cursor-grab select-none overflow-y-scroll active:cursor-grabbing sm:h-[340px] lg:h-[380px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    <div className="flex flex-col gap-[3px]">
                      {loopedImages.map((image, i) => (
                        <div
                          key={`${image._id || image.publicId || i}-${i}`}
                          data-frame
                          className="group relative aspect-[4/3] shrink-0 overflow-hidden border border-[#e5d4cc]/10"
                        >
                          <img
                            src={image.url}
                            alt={`Frame ${(i % filmStripImages.length) + 1}`}
                            loading="lazy"
                            draggable={false}
                            className="h-full w-full object-cover grayscale transition-all duration-700 ease-out group-hover:scale-110 group-hover:grayscale-0"
                          />

                          <span className="pointer-events-none absolute bottom-1 right-1 text-[7px] uppercase tracking-[0.15em] text-white/50 transition-opacity duration-500 group-hover:text-white/90">
                            {String(
                              (i % filmStripImages.length) + 1
                            ).padStart(2, "0")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3 pl-2">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <span
                        key={`r-${i}`}
                        className="h-[7px] w-[10px] rounded-[1px] bg-[#e5d4cc]/15"
                      />
                    ))}
                  </div>
                </div>

                {/* user controls */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepReel(-1)}
                    aria-label="Previous frame"
                    className={ctrlBtn}
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    onClick={toggleReelPause}
                    aria-label={reelPaused ? "Play reel" : "Pause reel"}
                    className={ctrlBtn}
                  >
                    {reelPaused ? "▶" : "Ⅱ"}
                  </button>

                  <button
                    type="button"
                    onClick={() => stepReel(1)}
                    aria-label="Next frame"
                    className={ctrlBtn}
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    onClick={cycleSpeed}
                    aria-label="Change speed"
                    className={ctrlBtn}
                  >
                    {SPEEDS[speedIndex]}x
                  </button>
                </div>

                <div className="mt-3 text-center">
                  <p className="text-[8px] uppercase tracking-[0.25em] text-white/40">
                    Roll 001 · scroll or drag
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative z-10 text-center font-serif text-[clamp(44px,13vw,90px)] font-normal leading-[0.85] tracking-[-2px] text-[#e3cec4] sm:tracking-[-3px] lg:pt-[430px] lg:text-left lg:text-[clamp(80px,9vw,145px)] lg:tracking-[-4px]"
          >
            Visual
            <br />
            <span className="ml-[7%]">Storyteller</span>
          </motion.h2>
        </div>

        {/* what I create */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="mt-[40px] flex items-start justify-between border-t border-[#e5d4cc]/10 pt-6 max-md:flex-col max-md:gap-6"
        >
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#e5d4cc]/35">
              What I create
            </p>

            <p className="mt-3 text-[11px] text-[#e5d4cc]/60">
              Photography · Films · Visual Stories
            </p>
          </div>

          <p className="max-w-[320px] text-[10px] leading-[1.8] text-[#e5d4cc]/40 md:text-right">
            From quiet portraits to energetic cinematic films, every project
            begins with a story.
          </p>
        </motion.div>

        {/* selected work */}
        {selectedWorkImages.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-[70px] border-t border-[#e5d4cc]/10 pt-8 lg:mt-[110px]"
          >
            <div className="flex items-end justify-between max-md:flex-col max-md:items-start max-md:gap-6">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#e5d4cc]/35">
                  Selected work
                </p>

                <h3 className="mt-4 font-serif text-[clamp(38px,11vw,55px)] font-normal leading-none tracking-[-2px] text-[#e3cec4] md:text-[75px]">
                  Stories
                  <br />
                  <span className="ml-[25px]">worth seeing.</span>
                </h3>
              </div>

              <a
                href="#portfolio"
                className="group flex items-center gap-5 text-[9px] uppercase tracking-[0.25em] text-[#e5d4cc]/60 transition-all duration-500 hover:text-[#e5d4cc]"
              >
                <span>View all work</span>

                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5d4cc]/20 transition-all duration-500 group-hover:translate-x-2 group-hover:border-[#e5d4cc]/60">
                  →
                </span>
              </a>
            </div>

            <div className="relative mt-12 lg:mt-20">
              <AnimatePresence mode="wait">
                {!galleryOpen ? (
                  <motion.div
                    key="stack"
                    onMouseEnter={() => setGalleryHover(true)}
                    onMouseLeave={() => setGalleryHover(false)}
                    onClick={() => setGalleryOpen(true)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="relative mx-auto flex h-[280px] w-[220px] cursor-pointer items-center justify-center sm:h-[340px] sm:w-[280px] lg:h-[400px] lg:w-[340px]"
                  >
                    {selectedWorkImages.map((image, i) => {
                      const mid = (selectedWorkImages.length - 1) / 2
                      const offset = i - mid

                      return (
                        <motion.div
                          key={image._id || image.publicId || i}
                          animate={
                            galleryHover
                              ? { x: offset * 60, rotate: offset * 4, scale: 1 }
                              : {
                                  x: 0,
                                  rotate: 0,
                                  scale:
                                    i === selectedWorkImages.length - 1
                                      ? 1
                                      : 0.94,
                                }
                          }
                          transition={{
                            type: "spring",
                            stiffness: 160,
                            damping: 20,
                          }}
                          style={{ position: "absolute", zIndex: i }}
                          className="group h-[220px] w-[170px] overflow-hidden border border-[#e5d4cc]/10 shadow-2xl shadow-black/60 sm:h-[280px] sm:w-[220px] lg:h-[340px] lg:w-[270px]"
                        >
                          <img
                            src={image.url}
                            alt={`Selected work ${i + 1}`}
                            loading="lazy"
                            draggable={false}
                            className="h-full w-full object-cover grayscale transition-all duration-700 ease-out group-hover:grayscale-0"
                          />

                          <div className="pointer-events-none absolute inset-0 bg-black/15 transition-opacity duration-700 group-hover:opacity-0" />
                        </motion.div>
                      )
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="filmstrip"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-[#e5d4cc]/35">
                        <span className="sm:hidden">Swipe to see all photos</span>
                        <span className="hidden sm:inline">
                          Scroll to see all photos
                        </span>
                      </p>

                      <button
                        type="button"
                        onClick={() => setGalleryOpen(false)}
                        className="p-2 text-[9px] uppercase tracking-[0.25em] text-[#e5d4cc]/60 transition-colors duration-300 hover:text-[#e5d4cc]"
                      >
                        Close ✕
                      </button>
                    </div>

                    <div className="relative">
                      <div
                        ref={filmstripRef}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseUp={endDrag}
                        onMouseLeave={endDrag}
                        onMouseMove={handleMouseMove}
                        className="flex w-full cursor-grab items-center gap-4 overflow-x-auto px-1 py-6 active:cursor-grabbing sm:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      >
                        {selectedWorkImages.map((image, i) => (
                          <motion.div
                            key={image._id || image.publicId || i}
                            initial={{ opacity: 0, y: 24, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              duration: 0.45,
                              delay: i * 0.06,
                              ease: "easeOut",
                            }}
                            className="group relative h-[220px] w-[170px] shrink-0 overflow-hidden border border-[#e5d4cc]/10 shadow-2xl shadow-black/60 transition-transform duration-500 hover:scale-105 sm:h-[280px] sm:w-[220px] lg:h-[340px] lg:w-[270px]"
                          >
                            <img
                              src={image.url}
                              alt={`Selected work ${i + 1}`}
                              loading="lazy"
                              draggable={false}
                              className="h-full w-full object-cover grayscale transition-all duration-700 ease-out group-hover:grayscale-0"
                            />

                            <div className="pointer-events-none absolute inset-0 bg-black/15 transition-opacity duration-700 group-hover:opacity-0" />
                          </motion.div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => scrollFilmstrip(-1)}
                        aria-label="Scroll left"
                        className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5d4cc]/20 bg-[#050505]/80 text-[#e5d4cc]/70 backdrop-blur transition-colors duration-300 hover:border-[#e5d4cc]/60 hover:text-[#e5d4cc] sm:flex"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={() => scrollFilmstrip(1)}
                        aria-label="Scroll right"
                        className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5d4cc]/20 bg-[#050505]/80 text-[#e5d4cc]/70 backdrop-blur transition-colors duration-300 hover:border-[#e5d4cc]/60 hover:text-[#e5d4cc] sm:flex"
                      >
                        →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!galleryOpen && (
                <p className="mt-4 text-center text-[9px] uppercase tracking-[0.2em] text-[#e5d4cc]/35">
                  <span className="sm:hidden">Tap to view all</span>
                  <span className="hidden sm:inline">
                    Hover to preview · Click to view all
                  </span>
                </p>
              )}
            </div>
          </motion.div>
        )}

        <div className="mt-[70px] flex justify-between text-[8px] uppercase tracking-[0.25em] text-[#e5d4cc]/25 lg:mt-[90px]">
          <span>Midhun Frames</span>
          <span>01 — About</span>
        </div>
      </div>
    </section>
  )
}

export default About