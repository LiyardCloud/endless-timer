import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Coffee,
  Dumbbell,
  Flame,
  House,
  MoonStar,
  PencilRuler,
  Users
} from "lucide-react";

const actionIcons = {
  brain: Brain,
  coffee: Coffee,
  briefcase: BriefcaseBusiness,
  users: Users,
  moon: MoonStar,
  book: BookOpen,
  dumbbell: Dumbbell,
  home: House,
  pen: PencilRuler,
  flame: Flame
} satisfies Record<string, LucideIcon>;

const legacyIconMap: Record<string, keyof typeof actionIcons> = {
  "◉": "brain",
  "◌": "coffee",
  "△": "briefcase",
  "□": "users",
  "✦": "moon",
  "✳": "book",
  "▣": "dumbbell",
  "⬢": "home"
};

export const ACTION_ICON_NAMES = Object.keys(actionIcons) as Array<keyof typeof actionIcons>;

export function normalizeActionIconName(icon: string): keyof typeof actionIcons {
  if (icon in actionIcons) {
    return icon as keyof typeof actionIcons;
  }

  return legacyIconMap[icon] ?? "brain";
}

export function getActionIcon(icon: string): LucideIcon {
  return actionIcons[normalizeActionIconName(icon)];
}
