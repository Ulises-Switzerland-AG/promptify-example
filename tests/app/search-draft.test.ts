import { describe, expect, it } from "vitest";
import { syncSearchDraft } from "@/app/components/search-draft";

describe("search draft", () => {
  it("keeps what the User typed while the applied search is unchanged", () => {
    const state = { draft: "", appliedQ: "informe" };
    expect(syncSearchDraft(state, "informe")).toBe(state);
  });

  it("follows the applied search when it changes", () => {
    expect(syncSearchDraft({ draft: "", appliedQ: "informe" }, "")).toEqual({ draft: "", appliedQ: "" });
    expect(syncSearchDraft({ draft: "x", appliedQ: "" }, "informe")).toEqual({ draft: "informe", appliedQ: "informe" });
  });
});
