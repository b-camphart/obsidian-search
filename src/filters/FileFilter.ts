import type { TFile } from "obsidian";

export function isFileFilter(obj: any): obj is FileFilter {
    return (
        obj != null &&
        typeof obj === "object" &&
        "appliesTo" in obj &&
        typeof obj.appliesTo === "function"
    );
}

export interface FileFilter<FilePart extends Partial<TFile> = TFile> {
    appliesTo(file: FilePart): Promise<boolean>;

    and<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<FilePart & R>
    or<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<FilePart & R>
}
