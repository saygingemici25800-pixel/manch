"use client";

import { useEffect, type RefObject } from "react";
import { useLenis } from "@/lib/lenis-store";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Overlay/drawer/modal ortak davranışı: ESC ile kapanma, Tab focus trap, body + Lenis scroll kilidi,
 * açılışta ilk odaklanabilir elemana, kapanışta önceki elemana focus.
 */
export function useDialog(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  const lenis = useLenis();

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;

    lenis?.stop();
    html.style.overflow = "hidden";

    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    // İlk odak: bir sonraki frame + geçiş başladıktan sonra tekrar (visibility transition'ı odağı engelleyebilir)
    const focusFirst = () => {
      if (!el?.contains(document.activeElement)) focusables()[0]?.focus();
    };
    const raf = requestAnimationFrame(focusFirst);
    const retry = window.setTimeout(focusFirst, 120);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(retry);
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
      lenis?.start();
      previous?.focus?.();
    };
  }, [open, onClose, ref, lenis]);
}
