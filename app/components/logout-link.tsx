import { Icon } from "./ui-icon";

export function LogoutLink({ className }: { className?: string }) {
  // Easy Auth owns the session. A plain anchor avoids next/link prefetching, which would fire the logout GET.
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/.auth/logout" className={`logout-link ${className ?? ""}`.trim()} aria-label="Cerrar sesión" title="Cerrar sesión">
      <Icon name="logout" />
    </a>
  );
}
