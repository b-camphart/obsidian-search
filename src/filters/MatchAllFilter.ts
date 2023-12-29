import { TFile } from "obsidian";
import { FileFilter } from "./FileFilter";
import { or } from "./OrFilter";

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
    if (filters.length === 0) return MatchNone as FileFilter<FilePart>;
    return MatchAllFilter.flattened(filters);
}

const MatchNone: FileFilter = {
    async appliesTo(file) {
        return false;
    },
    and(filter) {
        return filter;
    },
    or(filter) {
        return filter;
    },
};

export class MatchAllFilter<FilePart extends Partial<TFile> = TFile>
    implements FileFilter<FilePart>
{
    static flattened<FilePart extends Partial<TFile>>(
        filters: readonly FileFilter<FilePart>[],
    ) {
        if (!filters.some((filter) => filter instanceof MatchAllFilter)) {
            return new MatchAllFilter(filters);
        }
        return new MatchAllFilter(
            filters.flatMap((filter) => {
                if (filter instanceof MatchAllFilter) {
                    return filter.filters;
                }
                return [filter]
            }),
        );
    }

    constructor(private readonly filters: readonly FileFilter<FilePart>[]) {}

    async appliesTo(file: FilePart): Promise<boolean> {
        return Promise.all(
            this.filters.map((filter) => filter.appliesTo(file)),
        ).then((all) => all.every((it) => it));
    }

    and<R extends Partial<TFile>>(
        filter: FileFilter<R>,
    ): FileFilter<FilePart & R> {
        if (filter instanceof MatchAllFilter) {
            return new MatchAllFilter(this.filters.concat(filter.filters));
        }
        return new MatchAllFilter(
            (this.filters as FileFilter<FilePart & R>[]).concat(filter),
        );
    }

    or<R extends Partial<TFile>>(
        filter: FileFilter<R>,
    ): FileFilter<FilePart & R> {
        return or(this, filter as any);
    }
}
