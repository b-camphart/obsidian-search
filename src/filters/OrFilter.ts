import { TFile } from "obsidian";
import { FileFilter } from "./FileFilter";
import { matchAll } from "./MatchAllFilter";

export function or<FilePart extends Partial<TFile>>(
    a: FileFilter<FilePart> | readonly FileFilter<FilePart>[],
    b: FileFilter<FilePart> | readonly FileFilter<FilePart>[]
): FileFilter<FilePart> {

    a = Array.isArray(a) ? matchAll(a) : (a as FileFilter<FilePart>);
    b = Array.isArray(b) ? matchAll(b) : (b as FileFilter<FilePart>);

    return new OrFilter(a, b)

}

export class OrFilter<FilePart extends Partial<TFile> = TFile> implements FileFilter<FilePart> {

    constructor(
        private readonly a: FileFilter<FilePart>,
        private readonly b: FileFilter<FilePart>
    ) {}

    async appliesTo(file: FilePart): Promise<boolean> {
        return await this.a.appliesTo(file) || await this.b.appliesTo(file)
    }

    and<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<FilePart & R> {
        return matchAll(this, filter as any)
    }

    or<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<FilePart & R> {
        return or(this, filter as any)
    }

}