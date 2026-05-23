import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import type { EndlessTimerState } from "@/components/endless-timer/use-endless-timer-state";

export function EndlessTimerDialogs({ state }: { state: EndlessTimerState }) {
  return (
    <>
      <AlertDialog
        open={state.actionDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            state.setActionDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove action?</AlertDialogTitle>
            <AlertDialogDescription>
              {state.actionDeleteTarget
                ? `Remove "${state.actionDeleteTarget.name}"? History records will stay saved with their snapped action data.`
                : "History records will stay saved with their snapped action data."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={state.busy === `delete-action-${state.actionDeleteTarget?.id ?? ""}`}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={state.busy === `delete-action-${state.actionDeleteTarget?.id ?? ""}`}
              onClick={() => void state.confirmDeleteAction()}
            >
              Remove action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={state.historyDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            state.setHistoryDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove timer entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {state.historyDeleteTarget
                ? `Remove the "${state.historyDeleteTarget.actionName}" timer entry from the timeline? This cannot be undone.`
                : "This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={state.busy === `delete-history-${state.historyDeleteTarget?.id ?? ""}`}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={state.busy === `delete-history-${state.historyDeleteTarget?.id ?? ""}`}
              onClick={() => void state.confirmDeleteHistoryEvent()}
            >
              Remove entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
