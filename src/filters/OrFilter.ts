import { TFile } from "obsidian";
import { FileFilter } from "./FileFilter";
import { matchAll } from "./MatchAllFilter";

export function or<FilePart extends Partial<TFile>>(
    a: FileFilter<FilePart> | FileFilter<FilePart>[],
    b: FileFilter<FilePart> | FileFilter<FilePart>[]
): FileFilter<FilePart> {

    a = Array.isArray(a) ? matchAll(a) : a;
    b = Array.isArray(b) ? matchAll(b) : b;

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

}