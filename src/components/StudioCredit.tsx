import { STUDIO_NAME, STUDIO_URL, openExternalUrl } from "../services/brand";

type Props = {
  className?: string;
  /** Tighter copy for sidebar / tight footers */
  compact?: boolean;
};

/** Discreet “Built by ApexForge” credit — works in desktop, PWA, and Android. */
export function StudioCredit({ className = "", compact = false }: Props) {
  return (
    <p
      className={
        className ||
        (compact
          ? "text-[10px] text-ocean-500 leading-relaxed"
          : "mt-3 text-[11px] text-ocean-500/90")
      }
    >
      Built by{" "}
      <a
        href={STUDIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ocean-400/90 hover:text-ocean-300 underline-offset-2 hover:underline transition-colors"
        onClick={(e) => {
          e.preventDefault();
          void openExternalUrl(STUDIO_URL);
        }}
      >
        {STUDIO_NAME}
      </a>
    </p>
  );
}
