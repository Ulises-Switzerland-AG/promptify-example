export type SearchDraft = { draft: string; appliedQ: string };

// The draft only resets when the search applied in the URL changes.
export function syncSearchDraft(state: SearchDraft, appliedQ: string): SearchDraft {
  return state.appliedQ === appliedQ ? state : { draft: appliedQ, appliedQ };
}
