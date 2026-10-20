
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowUp } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

const instagramUrl =
  "https://www.instagram.com/midhun_.frames?xtok=MWhqZWFpOHY2aXc2OA=="

function Footer() {
  const currentYear = new Date().getFullYear()

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const navigation = [
    { label: "Home", id: "home" },
    { label: "Portfolio", id: "portfolio" },
    { label: "About", id: "info" },
    { label: "Contact", id: "contact" },
  ]

  return (
    <footer
      id="footer"
      className="relative overflow-hidden bg-[#050505] px-[6%] pt-16 pb-6 text-[#e8e8e8] sm:px-[7%] md:pt-24"
    >
      {/* Subtle background detail */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-slate-400/[0.035] blur-[100px]"
      />

      <div className="relative mx-auto max-w-[1350px]">
        {/* Main CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col justify-between gap-8 border-b border-white/10 pb-12 md:flex-row md:items-end md:pb-16"
        >
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-white/50" />

              <p className="text-[9px] uppercase tracking-[0.3em] text-white/45">
                The Final Frame
              </p>
            </div>

            <h2 className="max-w-3xl font-serif text-[42px] font-normal leading-[1.08] tracking-[-1.5px] text-[#e8e8e8] sm:text-5xl md:text-7xl">
              Every story deserves
              <br />
              <span className="italic text-white/50">
                to be remembered.
              </span>
            </h2>

            <p className="mt-5 max-w-md text-xs leading-6 text-white/45 sm:text-sm">
              Photography, emotion, and moments that stay with you.
            </p>
          </div>

          <a
            href="mailto:hello@midhunframes.com"
            className="group inline-flex w-fit items-center gap-4 border border-white/15 px-5 py-4 text-xs tracking-wide text-white/80 transition-all duration-300 hover:border-white/40 hover:bg-white/[0.04] hover:text-white"
          >
            <span>Let's create something meaningful</span>

            <ArrowUpRight
              size={16}
              strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </a>
        </motion.div>

        {/* Footer links */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-2 gap-x-8 gap-y-10 py-12 sm:grid-cols-3 md:py-16"
        >
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <button
              type="button"
              onClick={() => scrollToSection("home")}
              aria-label="Back to Midhun Frames home"
              className="font-serif text-2xl tracking-tight text-white transition-opacity hover:opacity-70"
            >
              Midhun Frames<span className="text-white/35">.</span>
            </button>

            <p className="mt-4 max-w-[240px] text-[11px] leading-6 text-white/45 sm:text-xs">
              A personal photography portfolio capturing real moments,
              genuine emotions, and visual stories.
            </p>

            <p className="mt-5 text-[9px] uppercase tracking-[0.22em] text-white/30">
              Cinematic Reality × Personal Imagination
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-5 text-[9px] uppercase tracking-[0.25em] text-white/35">
              Explore
            </p>

            <ul className="flex flex-col items-start gap-3 text-xs text-white/65">
              {navigation.map(({ label, id }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className="group inline-flex items-center gap-2 transition-colors duration-300 hover:text-white"
                  >
                    <span>{label}</span>

                    <ArrowUpRight
                      size={12}
                      className="opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-70"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <p className="mb-5 text-[9px] uppercase tracking-[0.25em] text-white/35">
              Connect
            </p>

            <ul className="flex flex-col items-start gap-4 text-xs text-white/65">
              <li>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 transition-colors duration-300 hover:text-white"
                >
                  Instagram

                  <ArrowUpRight
                    size={13}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              </li>

              <li>
                <a
                  href="mailto:hello@midhunframes.com"
                  className="break-all transition-colors duration-300 hover:text-white"
                >
                  hello@midhunframes.com
                </a>
              </li>
            </ul>

            <div className="mt-7">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">
                Based in
              </p>

              <p className="mt-2 text-xs text-white/65">
                Kochi, Kerala, India
              </p>

              <p className="mt-1 text-[10px] text-white/35">
                Available for projects worldwide
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-[9px] tracking-[0.12em] text-white/35 sm:text-[10px]">
            © {currentYear} Midhun Frames. All rights reserved.
          </p>

          <p className="text-[9px] tracking-[0.12em] text-white/35 sm:text-[10px]">
            Photography · Film · Visual Storytelling
          </p>

          <button
            type="button"
            onClick={() => scrollToSection("home")}
            aria-label="Back to top"
            className="group flex w-fit items-center gap-3 text-[9px] uppercase tracking-[0.2em] text-white/50 transition-colors duration-300 hover:text-white"
          >
            Back to top

            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 transition-all duration-300 group-hover:border-white/40 group-hover:bg-white/5">
              <ArrowUp size={14} strokeWidth={1.5} />
            </span>
          </button>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
