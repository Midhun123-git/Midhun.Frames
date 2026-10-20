
import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Camera, CheckCircle2, LoaderCircle, UploadCloud, XCircle } from "lucide-react"

function GalleryUploadLoader({
  isUploading = false,
  status = "uploading",
  message,
  onClose,
}) {
  const isSuccess = status === "success"
  const isError = status === "error"
  const isVisible = isUploading || isSuccess || isError

  const title = isSuccess
    ? "Upload Complete"
    : isError
      ? "Upload Failed"
      : "Creating Your Gallery"

  const description =
    message ||
    (isSuccess
      ? "Your media is ready for the gallery."
      : isError
        ? "Something went wrong. Please try again."
        : "Please wait while your media is being uploaded securely.")

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#101114] p-8 text-center shadow-2xl"
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent" />

            {(isSuccess || isError) && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close upload status"
                className="absolute right-4 top-4 rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            )}

            <div className="mb-6 flex justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                <div className="absolute inset-2 rounded-full border border-white/10" />

                {isSuccess ? (
                  <CheckCircle2
                    size={38}
                    className="text-emerald-400"
                  />
                ) : isError ? (
                  <XCircle size={38} className="text-red-400" />
                ) : (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-200"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Camera
                        size={34}
                        className="text-slate-100"
                      />
                    </motion.div>
                  </>
                )}
              </div>
            </div>

            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">
              MIDHUN FRAMES
            </p>

            <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white">
              {title}
            </h2>

            <p className="mx-auto max-w-xs text-sm leading-6 text-white/55">
              {description}
            </p>

            {isUploading && (
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-center gap-2 text-xs text-white/60">
                  <UploadCloud size={15} />
                  <span>Uploading your media securely</span>
                  <LoaderCircle
                    size={14}
                    className="animate-spin"
                  />
                </div>

                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-slate-200"
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/30">
                  Please don't close this window
                </p>
              </div>
            )}

            {(isSuccess || isError) && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="mt-7 w-full rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                {isSuccess ? "Continue" : "Close"}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GalleryUploadLoader
