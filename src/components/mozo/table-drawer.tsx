"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** Bottom sticky CTA area. Si se pasa, se renderiza fuera del scroll. */
  footer?: React.ReactNode;
};

/**
 * Bottom drawer en mobile (full-screen sheet con handle), panel lateral en md+.
 * Pensado para que el contenido scrollee y los CTAs principales queden fijos
 * al pie con safe-area-inset.
 */
export function TableDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: Props) {
  // Lock body scroll cuando está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc cierra.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer / Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute bottom-0 left-0 right-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 will-change-transform md:left-auto md:top-0 md:right-0 md:max-h-none md:h-full md:w-[420px] md:rounded-l-3xl md:rounded-tr-none ${
          open ? "translate-y-0" : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2 md:hidden">
          <div className="h-1 w-10 rounded-full bg-zinc-300" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-3 md:py-5">
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold leading-tight md:text-lg">
              {title}
            </div>
            {subtitle && (
              <div className="mt-0.5 text-xs text-zinc-500 md:text-sm">
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 rounded-full p-2 text-zinc-500 transition active:scale-95 active:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div className="border-t border-zinc-100 bg-white px-5 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
