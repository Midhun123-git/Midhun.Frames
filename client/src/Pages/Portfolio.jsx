import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import api from "../api/api.js"
import {
  X,
  Play,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const CATEGORIES = [
  "All",
  "Wedding",
  "Portrait",
  "Pre Wedding",
  "Engagement",
  "Events",
]

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
}

const gridItem = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.05,
      ease: "easeOut",
    },
  }),
}

function Portfolio() {
  const [media, setMedia] = useState([])
  const [activeCategory, setActiveCategory] = useState("All")
  const [activeType, setActiveType] = useState("All")
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [mutedVideos, setMutedVideos] = useState({})

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await api.get("/gallery/public")

        const galleryData = response.data.gallery || []

        const formattedMedia = galleryData
          .filter((item) => item.isPublic === true)
          .map((item) => ({
            id: item._id,
            title: item.title || "Untitled",
            client: item.client || "",
            category: item.category || "Events",
            date: item.date || "",
            mediaType: item.mediaType || "image",
            src: item.imageUrl,
            featured: item.featured || false,
          }))
          .filter((item) => item.src)

        setMedia(formattedMedia)
      } catch (error) {
        console.error("Failed to load portfolio:", error)
        setError("Unable to load portfolio.")
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [])

  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      const categoryMatch =
        activeCategory === "All" ||
        item.category === activeCategory

      const typeMatch =
        activeType === "All" ||
        (activeType === "Photos" &&
          item.mediaType === "image") ||
        (activeType === "Videos" &&
          item.mediaType === "video")

      return categoryMatch && typeMatch
    })
  }, [media, activeCategory, activeType])

  const photosCount = media.filter(
    (item) => item.mediaType === "image"
  ).length

  const videosCount = media.filter(
    (item) => item.mediaType === "video"
  ).length

  const openLightbox = (item) => {
    const index = filteredMedia.findIndex(
      (mediaItem) => mediaItem.id === item.id
    )

    setCurrentIndex(index)
    setSelectedMedia(item)
  }

  const closeLightbox = () => {
    setSelectedMedia(null)
  }

  const showPrevious = () => {
    if (!filteredMedia.length) return

    const nextIndex =
      currentIndex === 0
        ? filteredMedia.length - 1
        : currentIndex - 1

    setCurrentIndex(nextIndex)
    setSelectedMedia(filteredMedia[nextIndex])
  }

  const showNext = () => {
    if (!filteredMedia.length) return

    const nextIndex =
      currentIndex === filteredMedia.length - 1
        ? 0
        : currentIndex + 1

    setCurrentIndex(nextIndex)
    setSelectedMedia(filteredMedia[nextIndex])
  }

  const toggleMute = (id, event) => {
    event.stopPropagation()

    setMutedVideos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!selectedMedia) return

      if (event.key === "Escape") {
        closeLightbox()
      }

      if (event.key === "ArrowLeft") {
        showPrevious()
      }

      if (event.key === "ArrowRight") {
        showNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedMedia, currentIndex, filteredMedia])

  return (
    <section
      id="portfolio"
      className="
        dock-obstacle
        relative
        overflow-hidden
        bg-[#050505]
        px-[6%]
        py-[80px]
        text-[#e5d4cc]
        sm:px-[7%]
      "
    >
      <div className="relative mx-auto max-w-[1350px]">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{
            once: true,
            amount: 0.3,
          }}
          className="mb-[50px]"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-[#c9a875]" />

            <p className="text-[9px] uppercase tracking-[0.3em] text-[#c9a875]">
              02 / Work
            </p>
          </div>

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h2
                className="
                  font-serif
                  text-[58px]
                  italic
                  font-normal
                  leading-[0.9]
                  tracking-[-2px]
                  text-[#e3cec4]
                  md:text-[80px]
                "
              >
                Portfolio
              </h2>

              <p
                className="
                  mt-6
                  max-w-[500px]
                  text-[12px]
                  leading-[1.9]
                  text-[#e5d4cc]/55
                  md:text-[13px]
                "
              >
                A collection of photographs and films created across
                weddings, portraits, engagements and events.
              </p>
            </div>

            {!loading && (
              <div className="flex gap-8 border-l border-white/10 pl-6">
                <div>
                  <p className="font-serif text-3xl text-[#c9a875]">
                    {photosCount}
                  </p>

                  <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-white/30">
                    Photographs
                  </p>
                </div>

                <div>
                  <p className="font-serif text-3xl text-[#c9a875]">
                    {videosCount}
                  </p>

                  <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-white/30">
                    Films
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex flex-col gap-7 border-y border-white/10 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-7">
              {["All", "Photos", "Videos"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`
                    relative
                    pb-2
                    text-[9px]
                    uppercase
                    tracking-[0.25em]
                    transition
                    ${
                      activeType === type
                        ? "text-[#c9a875]"
                        : "text-white/30 hover:text-white/60"
                    }
                  `}
                >
                  {type}

                  {activeType === type && (
                    <motion.span
                      layoutId="mediaType"
                      className="absolute bottom-0 left-0 h-px w-full bg-[#c9a875]"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-5">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`
                    text-[8px]
                    uppercase
                    tracking-[0.2em]
                    transition
                    ${
                      activeCategory === category
                        ? "text-[#c9a875]"
                        : "text-white/25 hover:text-white/60"
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="aspect-[4/5] animate-pulse bg-white/[0.03]"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="border border-white/10 px-6 py-20 text-center">
            <p className="text-[9px] uppercase tracking-[0.25em] text-white/30">
              {error}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          filteredMedia.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-white/10 px-6 py-24 text-center"
            >
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#c9a875]/70">
                Portfolio
              </p>

              <h3 className="mt-5 font-serif text-3xl text-white/80">
                No work available yet
              </h3>

              <p className="mx-auto mt-4 max-w-md text-[10px] leading-6 text-white/25">
                New photographs and films will appear here as they
                are added to the gallery.
              </p>
            </motion.div>
          )}

        {!loading &&
          !error &&
          filteredMedia.length > 0 && (
            <motion.div
              layout
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
                lg:grid-cols-4
              "
            >
              <AnimatePresence mode="popLayout">
                {filteredMedia.map((item, index) => (
                  <motion.article
                    key={item.id}
                    custom={index}
                    variants={gridItem}
                    initial="hidden"
                    animate="show"
                    exit={{
                      opacity: 0,
                      scale: 0.96,
                    }}
                    layout
                    onClick={() => openLightbox(item)}
                    className="
                      group
                      relative
                      cursor-pointer
                      overflow-hidden
                      border
                      border-white/[0.07]
                      bg-[#080808]
                    "
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {item.mediaType === "video" ? (
                        <video
                          src={item.src}
                          muted={
                            mutedVideos[item.id] !== false
                          }
                          loop
                          autoPlay
                          playsInline
                          preload="metadata"
                          className="
                            h-full
                            w-full
                            object-cover
                            transition
                            duration-1000
                            group-hover:scale-105
                          "
                        />
                      ) : (
                        <img
                          src={item.src}
                          alt={item.title}
                          loading="lazy"
                          className="
                            h-full
                            w-full
                            object-cover
                            grayscale
                            transition
                            duration-1000
                            group-hover:scale-105
                            group-hover:grayscale-0
                          "
                        />
                      )}

                      <div
                        className="
                          absolute
                          inset-0
                          bg-gradient-to-t
                          from-black/85
                          via-black/10
                          to-black/10
                          opacity-70
                          transition
                          duration-700
                          group-hover:opacity-90
                        "
                      />

                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        {item.featured && (
                          <span
                            className="
                              border
                              border-[#c9a875]/60
                              bg-black/60
                              px-3
                              py-1.5
                              text-[7px]
                              uppercase
                              tracking-[0.2em]
                              text-[#c9a875]
                              backdrop-blur-sm
                            "
                          >
                            Featured
                          </span>
                        )}

                        {item.mediaType === "video" && (
                          <span
                            className="
                              flex
                              items-center
                              gap-1.5
                              border
                              border-white/20
                              bg-black/60
                              px-3
                              py-1.5
                              text-[7px]
                              uppercase
                              tracking-[0.2em]
                              text-white/60
                              backdrop-blur-sm
                            "
                          >
                            <Play
                              size={8}
                              fill="currentColor"
                            />
                            Film
                          </span>
                        )}
                      </div>

                      {item.mediaType === "video" && (
                        <button
                          type="button"
                          onClick={(event) =>
                            toggleMute(item.id, event)
                          }
                          className="
                            absolute
                            right-4
                            top-4
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            border
                            border-white/20
                            bg-black/60
                            text-white/60
                            backdrop-blur-sm
                            transition
                            hover:border-[#c9a875]
                            hover:text-[#c9a875]
                          "
                        >
                          {mutedVideos[item.id] !== false ? (
                            <VolumeX size={12} />
                          ) : (
                            <Volume2 size={12} />
                          )}
                        </button>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="translate-y-3 transition duration-500 group-hover:translate-y-0">
                          <p className="mb-2 text-[7px] uppercase tracking-[0.25em] text-[#c9a875]">
                            {item.category}
                          </p>

                          <h3 className="font-serif text-2xl text-white/90">
                            {item.title}
                          </h3>

                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-[8px] uppercase tracking-[0.15em] text-white/35">
                              {item.client}
                            </p>

                            <span className="text-[8px] uppercase tracking-[0.2em] text-white/40 opacity-0 transition duration-500 group-hover:opacity-100">
                              View
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

        {!loading &&
          !error &&
          filteredMedia.length > 0 && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="mt-14 flex justify-end"
            >
              <a
                href="#gallery"
                className="
                  group
                  flex
                  items-center
                  gap-3
                  text-[10px]
                  uppercase
                  tracking-[0.25em]
                  text-[#e5d4cc]/70
                  transition-colors
                  duration-300
                  hover:text-[#e5d4cc]
                "
              >
                See Full Gallery

                <span className="text-sm transition-transform duration-300 group-hover:translate-x-1">
                  â†’
                </span>
              </a>
            </motion.div>
          )}
      </div>

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeLightbox}
            className="
              fixed
              inset-0
              z-[100]
              flex
              items-center
              justify-center
              bg-black/95
              p-4
              backdrop-blur-md
              sm:p-6
            "
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="
                absolute
                right-5
                top-5
                z-20
                flex
                h-10
                w-10
                items-center
                justify-center
                border
                border-white/10
                text-white/50
                transition
                hover:border-[#c9a875]
                hover:text-[#c9a875]
              "
            >
              <X size={17} />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                showPrevious()
              }}
              className="
                absolute
                left-3
                top-1/2
                z-20
                flex
                h-11
                w-11
                -translate-y-1/2
                items-center
                justify-center
                border
                border-white/10
                bg-black/40
                text-white/50
                backdrop-blur-sm
                transition
                hover:border-[#c9a875]
                hover:text-[#c9a875]
                sm:left-6
              "
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                showNext()
              }}
              className="
                absolute
                right-3
                top-1/2
                z-20
                flex
                h-11
                w-11
                -translate-y-1/2
                items-center
                justify-center
                border
                border-white/10
                bg-black/40
                text-white/50
                backdrop-blur-sm
                transition
                hover:border-[#c9a875]
                hover:text-[#c9a875]
                sm:right-6
              "
            >
              <ChevronRight size={18} />
            </button>

            <motion.div
              initial={{
                scale: 0.96,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.96,
                opacity: 0,
              }}
              transition={{
                duration: 0.35,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
              className="
                flex
                max-h-[92vh]
                w-full
                max-w-6xl
                flex-col
                overflow-hidden
                border
                border-white/10
                bg-[#070707]
              "
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[7px] uppercase tracking-[0.3em] text-[#c9a875]">
                    {selectedMedia.mediaType === "video"
                      ? "Motion / Film"
                      : "Photography"}
                  </p>

                  <h3 className="mt-1 truncate font-serif text-xl text-white/90">
                    {selectedMedia.title}
                  </h3>
                </div>

                <p className="ml-5 shrink-0 text-[8px] uppercase tracking-[0.2em] text-white/20">
                  {currentIndex + 1} / {filteredMedia.length}
                </p>
              </div>

              <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-black p-4 sm:p-8">
                {selectedMedia.mediaType === "video" ? (
                  <video
                    key={selectedMedia.id}
                    src={selectedMedia.src}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[72vh] max-w-full object-contain"
                  />
                ) : (
                  <img
                    key={selectedMedia.id}
                    src={selectedMedia.src}
                    alt={selectedMedia.title}
                    className="max-h-[72vh] max-w-full object-contain"
                  />
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-5">
                  <span className="text-[8px] uppercase tracking-[0.15em] text-white/30">
                    {selectedMedia.client}
                  </span>

                  <span className="text-[8px] uppercase tracking-[0.15em] text-[#c9a875]/70">
                    {selectedMedia.category}
                  </span>

                  <span className="text-[8px] uppercase tracking-[0.15em] text-white/25">
                    {selectedMedia.date}
                  </span>
                </div>

                <span className="text-[7px] uppercase tracking-[0.2em] text-white/20">
                  Use â† â†’ to navigate
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default Portfolio
