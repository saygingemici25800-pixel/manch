import { notFound } from "next/navigation";

/** Kural 35 — eşleşmeyen tüm /[locale]/* yolları → [locale]/not-found.tsx */
export default function CatchAll() {
  notFound();
}
