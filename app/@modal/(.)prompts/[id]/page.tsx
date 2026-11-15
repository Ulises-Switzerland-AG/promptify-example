import { PromptDetail, type PromptRouteProps } from "@/app/components/prompt-detail";

export default function Page(props: PromptRouteProps) {
  return PromptDetail({ ...props, modal: true });
}
