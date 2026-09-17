import type { ReactNode } from "react";

// <html> ve <body> `[locale]/layout.tsx` icinde; burasi sadece gecis katmani.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
