import { TFile } from "obsidian";
import { FileFilter } from "./FileFilter";

export function matchAll<FilePart extends Partial<TFile>>(
    filters: readonly FileFilter<FilePart>[],
): FileFilter<FilePart>;
export function matchAll<FilePart extends Partial<TFile>>(
    ...filters: readonly FileFilter<FilePart>[]
): FileFilter<FilePart>;
export function matchAll<FilePart extends Partial<TFile>>(
    ...filters:
        | readonly FileFilter<FilePart>[]
        | [readonly FileFilter<FilePart>[]]
): FileFilter<FilePart> {
    if (filters.length === 1) {
        if (Array.isArray(filters[0])) {
            return combine(filters[0]);
        }
    }
    return combine(filters as FileFilter<FilePart>[]);
}

function combine<FilePart extends Partial<TFile>>(
    filters: readonly FileFilter<FilePart>[],
): FileFilter<FilePart> {
    if (filters.length === 1) return filters[0];
    return new MatchAllFilter(filters);
}

export class MatchAllFilter<FilePart extends Partial<TFile> = TFile>
    implements FileFilter<FilePart>
{
    constructor(private readonly filters: readonly FileFilter<FilePart>[]) {}

    async appliesTo(file: FilePart): Promise<boolean> {
        return Promise.all(
            this.filters.map((filter) => filter.appliesTo(file)),
        ).then((all) => all.every((it) => it));
    }
}
