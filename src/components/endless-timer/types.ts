export type AppPage = "home" | "timeline" | "analytics" | "profile";
export type ActionMode = "select" | "create" | "change" | "remove";
export type AnalyticsPreset = "today" | "7d" | "30d" | "custom";

export type ActionDraft = {
  id: string | null;
  name: string;
  color: string;
  icon: string;
};

export type HistoryEditDraft = {
  actionId: string;
  titleSnapshot: string;
  startedAt: string;
};

export type AnalyticsRange = {
  preset: AnalyticsPreset;
  from: string;
  to: string;
};
