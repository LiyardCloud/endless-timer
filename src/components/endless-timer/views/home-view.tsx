import type { CSSProperties, Dispatch, FormEvent, SetStateAction } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ACTION_COLORS } from "@/lib/default-actions";
import { getActionIcon } from "@/lib/action-icons";
import { formatDuration } from "@/lib/format";
import type { ActionItem, CurrentState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Eyebrow, Field, Surface } from "@/components/endless-timer/ui-primitives";
import type { ActionDraft, ActionMode } from "@/components/endless-timer/types";

type HomeViewProps = {
  currentState: CurrentState;
  titleDraft: string;
  setTitleDraft: (title: string) => void;
  actions: ActionItem[];
  actionDraft: ActionDraft;
  setActionDraft: Dispatch<SetStateAction<ActionDraft>>;
  editingActionId: string | null;
  actionMode: ActionMode;
  busy: string | null;
  showActionForm: boolean;
  interactionHint: string;
  handleActionSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleActionSelection: (action: ActionItem) => Promise<void>;
  openCreateMode: () => void;
  openChangeMode: () => void;
  openRemoveMode: () => void;
  resetActionEditor: () => void;
};

export function HomeView(state: HomeViewProps) {
  const timerPanelStyle = state.currentState.currentActionColor
    ? ({
        "--timer-accent": state.currentState.currentActionColor,
        background: `radial-gradient(circle at top left, ${state.currentState.currentActionColor}30, transparent 34%), linear-gradient(145deg, ${state.currentState.currentActionColor}22, #0d1016 58%, #0d1016 100%)`,
        borderColor: `${state.currentState.currentActionColor}36`
      } as CSSProperties)
    : undefined;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-6">
      <Surface className="p-[16px_18px_18px]" style={timerPanelStyle}>
        <CardHeader className="mb-1 gap-0 p-0">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Current action
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="line-clamp-2 max-w-[18ch] font-mono text-[clamp(1.55rem,6vw,2.15rem)] leading-[0.98] tracking-[-0.07em] text-white/95 sm:line-clamp-1 sm:max-w-none">
                {state.currentState.currentActionName ?? "No active action"}
              </CardTitle>
            </div>
            <div
              className="shrink-0 p-0 text-left"
              style={
                state.currentState.currentActionColor
                  ? {
                      color: state.currentState.currentActionColor
                    }
                  : undefined
              }
            >
              <p className="font-mono text-[clamp(2.3rem,11vw,4rem)] leading-none tracking-[-0.09em] text-foreground">
                {formatDuration(state.currentState.currentStartedAt)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="mt-4 p-0">
          <Field label="Current title">
            <Input
              className="h-auto rounded-[18px] border-border bg-white/5 px-4 py-3.5 text-[1.02rem] placeholder:text-muted/75 focus:border-primary/30 focus:bg-white/7 focus:ring-primary/20"
              placeholder="What are you doing?"
              value={state.titleDraft}
              onChange={(event) => state.setTitleDraft(event.target.value)}
            />
          </Field>
          {!state.currentState.currentActionName ? (
            <p className="mt-3 text-sm text-muted">Select an action to start the first tracked block.</p>
          ) : null}
        </CardContent>
      </Surface>

      <Surface className="border-none bg-transparent p-[4px_2px_0]">
        <CardHeader className="mb-[14px] gap-[2px] p-0 px-3 sm:px-4">
          <Eyebrow>Actions</Eyebrow>
          <CardTitle className="text-base font-semibold tracking-normal">{state.interactionHint}</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-2.5 sm:px-4 xl:grid-cols-3">
            {state.actions.map((action) => {
              const active = state.currentState.currentActionId === action.id;
              const Icon = getActionIcon(action.icon);

              return (
                <button
                  key={action.id}
                  className={cn(
                    "inline-flex min-h-[56px] w-full items-center justify-start gap-2 rounded-[18px] border px-4 py-3 text-left text-sm font-medium transition-all duration-150",
                    "hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55",
                    active ? "text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]" : "bg-transparent text-foreground",
                    (state.actionMode === "change" || state.actionMode === "remove") && "animate-pulse"
                  )}
                  onClick={() => void state.handleActionSelection(action)}
                  disabled={state.busy === "select-action" || state.busy === `delete-${action.id}`}
                  style={
                    {
                      borderColor: active ? `${action.color}cc` : `${action.color}59`,
                      backgroundColor: active ? `${action.color}db` : `${action.color}17`
                    } as CSSProperties
                  }
                >
                  {active ? <span className="size-1.5 rounded-full bg-white/90" aria-hidden="true" /> : null}
                  <Icon size={15} strokeWidth={2.2} />
                  <span className="truncate">{action.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-white/8 px-3 pt-3.5 sm:px-4">
            <div className="mb-2 flex items-center justify-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Edit modes
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "min-w-[104px] bg-white/6 px-[14px] py-[10px] text-[0.85rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                  state.actionMode === "create" &&
                    "border-primary/35 bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(238,243,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]"
                )}
                onClick={state.openCreateMode}
              >
                <Plus size={15} />
                Create
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "min-w-[104px] bg-white/6 px-[14px] py-[10px] text-[0.85rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                  state.actionMode === "change" &&
                    "border-primary/35 bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(238,243,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]"
                )}
                onClick={state.openChangeMode}
              >
                <Pencil size={15} />
                Change
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "min-w-[104px] bg-white/6 px-[14px] py-[10px] text-[0.85rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                  state.actionMode === "remove" &&
                    "border-destructive/35 bg-destructive/12 text-destructive-foreground shadow-[0_0_0_1px_rgba(255,244,243,0.05),inset_0_1px_0_rgba(255,255,255,0.06)]"
                )}
                onClick={state.openRemoveMode}
              >
                <Trash2 size={15} />
                Remove
              </Button>
            </div>

            {state.showActionForm ? (
              <>
                <Separator className="mt-3.5" />
                <form className="mt-3.5 space-y-4 px-0.5" onSubmit={state.handleActionSubmit}>
                  <div className="mb-2.5 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-semibold">
                        {state.editingActionId ? "Change action" : "Create action"}
                      </h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={state.resetActionEditor}>
                      Cancel
                    </Button>
                  </div>

                  <Field label="Name">
                    <Input
                      placeholder="Action name"
                      value={state.actionDraft.name}
                      onChange={(event) =>
                        state.setActionDraft((current) => ({
                          ...current,
                          name: event.target.value
                        }))
                      }
                    />
                  </Field>

                  <div className="grid gap-3 xl:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-[0.82rem] text-muted">Color</p>
                      <div className="flex flex-wrap gap-2">
                        {ACTION_COLORS.map((color) => (
                          <button
                            key={color}
                            className={cn(
                              "size-[26px] rounded-full border-2 transition-transform hover:-translate-y-0.5",
                              state.actionDraft.color === color
                                ? "border-white shadow-[0_0_0_2px_rgba(237,243,255,0.2)]"
                                : "border-transparent"
                            )}
                            type="button"
                            style={{ backgroundColor: color }}
                            onClick={() =>
                              state.setActionDraft((current) => ({
                                ...current,
                                color
                              }))
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[0.82rem] text-muted">Icon</p>
                      <div className="flex flex-wrap gap-2">
                        {["brain", "coffee", "briefcase", "users", "moon", "book", "dumbbell", "home", "pen", "flame"].map(
                          (iconName) => {
                            const Icon = getActionIcon(iconName);

                            return (
                              <button
                                key={iconName}
                                className={cn(
                                  "inline-flex size-[34px] items-center justify-center rounded-[10px] border bg-white/4 transition-all hover:-translate-y-0.5",
                                  state.actionDraft.icon === iconName
                                    ? "shadow-[0_0_0_2px_rgba(237,243,255,0.2)]"
                                    : "border-border text-foreground"
                                )}
                                type="button"
                                onClick={() =>
                                  state.setActionDraft((current) => ({
                                    ...current,
                                    icon: iconName
                                  }))
                                }
                              >
                                <Icon size={16} />
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={state.busy === "save-action"} className="px-3.5 py-2.5 text-[0.92rem]">
                    {state.editingActionId ? "Save action" : "Create action"}
                  </Button>
                </form>
              </>
            ) : null}
          </div>
        </CardContent>
      </Surface>
    </div>
  );
}
