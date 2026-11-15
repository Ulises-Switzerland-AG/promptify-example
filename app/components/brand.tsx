import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Promptify, inicio">
      <svg className="brand-mark" width="32" height="32" viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
        <path d="M2 0h12v2h2v12h-2v2H2v-2H0V2h2Zm2 4v8h2V9h5V7h1V5h-1V4Zm2 2h4v1H6Z" fillRule="evenodd" />
      </svg>
      <span>Promptify<span className="brand-period">.</span></span>
    </Link>
  );
}
