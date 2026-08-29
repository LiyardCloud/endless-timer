export type SetBusy = (busy: string | null) => void;
export type SetError = (message: string | null) => void;

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
