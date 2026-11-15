import { PromptCreator } from "@/app/components/prompt-creator";
import type { PromptRouteProps } from "@/app/components/prompt-detail";

export default function Page(props: Pick<PromptRouteProps, "searchParams"> = {}) {
  return PromptCreator(props);
}
