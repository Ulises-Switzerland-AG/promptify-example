import { PromptEditor } from "@/app/components/prompt-editor";
import type { PromptRouteProps } from "@/app/components/prompt-detail";

export default function Page(props: PromptRouteProps) {
  return PromptEditor(props);
}
