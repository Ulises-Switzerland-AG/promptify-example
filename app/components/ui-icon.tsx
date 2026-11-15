import type { ComponentType, SVGProps } from "react";
import { ArrowLeft, ArrowRight, Check, Close, Copy, Library, Logout, Pencil, Plus, Search, Shield, Trash } from "pixelarticons/react";

type IconName = "arrow" | "back" | "search" | "plus" | "library" | "copy" | "check" | "shield" | "edit" | "trash" | "close" | "logout";

const icons: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  arrow: ArrowRight,
  back: ArrowLeft,
  search: Search,
  plus: Plus,
  library: Library,
  copy: Copy,
  check: Check,
  shield: Shield,
  edit: Pencil,
  trash: Trash,
  logout: Logout,
  close: Close,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  const Glyph = icons[name];
  return <Glyph shapeRendering="crispEdges" aria-hidden="true" {...props} />;
}