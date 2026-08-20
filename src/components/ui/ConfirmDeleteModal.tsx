import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  title?: string
  message?: string
  itemName?: string
  onConfirm: () => void
  onCancel: () => void
  confirmButtonText?: string
}

export default function ConfirmDeleteModal({
  isOpen,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to permanently delete this item? This action cannot be undone.',
  itemName,
  onConfirm,
  onCancel,
  confirmButtonText = 'Delete',
}: ConfirmDeleteModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    } else {
      setVisible(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ isolation: 'isolate' }}
      role="alertdialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 180ms ease',
        }}
      />

      {/* Modal Card */}
      <div
        className="relative bg-background rounded-2xl border border-border w-full max-w-sm overflow-hidden shadow-2xl"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
          opacity: visible ? 1 : 0,
          transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1), opacity 180ms ease',
        }}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground leading-tight">
                {title}
              </h3>
              {itemName && (
                <p className="text-xs font-semibold text-primary mt-1 truncate">
                  "{itemName}"
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
