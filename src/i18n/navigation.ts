import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Kural 15: sayfa ici linklerde next/link degil bunlar kullanilir.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
