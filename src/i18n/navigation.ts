import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware Link / redirect / usePathname / useRouter — next/link yerine bunları kullan.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
