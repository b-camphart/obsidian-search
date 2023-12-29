import { TFile } from "obsidian";
import { FileFilter } from "./FileFilter";
import { matchAll } from "./MatchAllFilter";
import { or } from "./OrFilter";

export function negate<FilePart extends Partial<TFile>>(
    filter: FileFilter<FilePart>,
): FileFilter<FilePart>;
export function negate<FilePart extends Partial<TFile>>(
    filters: FileFilter<FilePart>[],
): FileFilter<FilePart>;
export function negate<FilePart extends Partial<TFile>>(
    filters: FileFilter<FilePart> | FileFilter<FilePart>[],
): FileFilter<FilePart> {
    if (Array.isArray(filters)) {
        return negateSingle(matchAll(filters));
    }
    return negateSingle(filters);
}

function negateSingle<FilePart extends Partial<TFile>>(filter: FileFilter<FilePart>): FileFilter<FilePart> {
    if (filter instanceof Negation) return filter.negate();
    return new Negation(filter)
}

export class Negation<FilePart extends Partial<TFile> = TFile>
    implements FileFilter<FilePart>
{
    constructor(private readonly negated: FileFilter<FilePart>) {}

    async appliesTo(file: FilePart): Promise<boolean> {
        return !this.negated.appliesTo(file);
    }

    negate(): FileFilter<FilePart> { return this.negated }

    and<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<FilePart & R> {
        return matchAll(this, filter as any)
    }

    or<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<FilePart & R> {
        return or(this, filter as any)
    }
}
