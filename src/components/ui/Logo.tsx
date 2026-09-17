import LogoManch from "./logo-manch";

interface Props {
  className?: string;
  /** erişilebilir ad; boşsa dekoratif */
  label?: string;
}

/** MANCH wordmark — public/logo/logo-manch.svg'den inline (currentColor ile invert davranışı). */
export default function Logo({ className, label }: Props) {
  return <LogoManch className={className} label={label} />;
}
