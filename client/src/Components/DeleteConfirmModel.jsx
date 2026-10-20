
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Trash2 } from "lucide-react";

function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete this item?",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName = "",
  loading = false,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !loading
            ) {
              onClose();
            }
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#141519] shadow-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10">
                  <AlertTriangle
                    size={20}
                    className="text-red-400"
                  />
                </div>

                <span className="text-sm font-medium tracking-wide text-gray-300">
                  CONFIRMATION
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="Close confirmation"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-7">
              <h2
                id="delete-modal-title"
                className="text-xl font-semibold tracking-tight text-white"
              >
                {title}
              </h2>

              <p
                id="delete-modal-description"
                className="mt-3 text-sm leading-6 text-gray-400"
              >
                {message}
              </p>

              {itemName && (
                <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                  <p className="break-words text-sm font-medium text-gray-200">
                    {itemName}
                  </p>
                </div>
              )}

              <p className="mt-4 text-xs text-gray-500">
                This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] bg-white/[0.02] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} />

                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DeleteConfirmModal;
