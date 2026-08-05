import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function formatSize(bytes: number): string {
    if (!bytes) return "0 B";
    if (bytes >= 1024 * 1024 * 1024)
        return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
    if (bytes >= 1024 * 1024)
        return (bytes / 1024 / 1024).toFixed(1) + " MB";
    return (bytes / 1024).toFixed(0) + " KB";
}
