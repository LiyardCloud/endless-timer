import { BarChart3, CircleUserRound, House, Rows3, type LucideIcon } from "lucide-react";

import { ACTION_COLORS } from "@/lib/default-actions";
import type { CurrentState } from "@/lib/types";
import type { ActionDraft, AppPage, HistoryEditDraft } from "@/components/endless-timer/types";

export const emptyCurrentState: CurrentState = {
  currentTitle: "",
  currentActionId: null,
  currentActionName: null,
  currentActionColor: null,
  currentActionIcon: null,
  currentStartedAt: null
};

export const emptyDraft: ActionDraft = {
  id: null,
  name: "",
  color: ACTION_COLORS[0],
  icon: "brain"
};

export const emptyHistoryEditDraft: HistoryEditDraft = {
  actionId: "",
  titleSnapshot: "",
  startedAt: ""
};

export const navItems: Array<{ page: AppPage; href: string; label: string; icon: LucideIcon }> = [
  { page: "home", href: "/", label: "Home", icon: House },
  { page: "timeline", href: "/timeline", label: "Timeline", icon: Rows3 },
  { page: "analytics", href: "/analytics", label: "Analytics", icon: BarChart3 },
  { page: "profile", href: "/profile", label: "Profile", icon: CircleUserRound }
];

export function pageDescription(page: AppPage) {
  switch (page) {
    case "home":
      return "Current timer and action switcher";
    case "timeline":
      return "Daily timer entries and activity flow";
    case "analytics":
      return "Time breakdowns, percentages, and filters";
    case "profile":
      return "Account, app actions, and workspace details";
  }
}

export function pageTitle(page: AppPage) {
  switch (page) {
    case "home":
      return "Today at a glance";
    case "timeline":
      return "Daily timeline";
    case "analytics":
      return "Activity analytics";
    case "profile":
      return "Profile and workspace";
  }
}
