import { writable } from "svelte/store";

export interface DialogOptions {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    placeholder?: string;
    inputType?: string;
}

export type DialogState =
    | ({
          kind: "confirm";
          message: string;
          resolve: (value: boolean) => void;
      } & DialogOptions)
    | ({
          kind: "prompt";
          message: string;
          defaultValue: string;
          resolve: (value: string | null) => void;
      } & DialogOptions)
    | null;

export const dialogState = writable<DialogState>(null);

let current: DialogState = null;
dialogState.subscribe((v) => (current = v));

/** Dismiss a dialog that is still open when another one is requested. */
function dismissCurrent() {
    if (!current) return;
    if (current.kind === "confirm") current.resolve(false);
    else current.resolve(null);
}

/** Touch friendly replacement for window.confirm(). */
export function confirmDialog(message: string, options: DialogOptions = {}): Promise<boolean> {
    dismissCurrent();
    return new Promise((resolve) => {
        dialogState.set({ kind: "confirm", message, resolve, ...options });
    });
}

/** Touch friendly replacement for window.prompt(). Resolves null when cancelled. */
export function promptDialog(
    message: string,
    defaultValue = "",
    options: DialogOptions = {},
): Promise<string | null> {
    dismissCurrent();
    return new Promise((resolve) => {
        dialogState.set({ kind: "prompt", message, defaultValue, resolve, ...options });
    });
}

export function closeDialog(result: boolean | string | null) {
    const state = current;
    dialogState.set(null);
    if (!state) return;
    if (state.kind === "confirm") state.resolve(result === true);
    else state.resolve(typeof result === "string" ? result : null);
}
