import { TFile } from "obsidian";
import { StringChecker } from "src/checkers/StringChecker";
import { FileFilter } from "src/filters/FileFilter";
import { matchAll } from "./MatchAllFilter";
import { or } from "./OrFilter";

export function content(checker: StringChecker): FileFilter {
    return new FileContentFilter(checker)
}

export class FileContentFilter implements FileFilter {

    constructor(private readonly checker: StringChecker) {}

    async appliesTo(file: TFile): Promise<boolean> {
        const content = await file.vault.cachedRead(file)
        return this.checker.matches(content)
    }

    and<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<TFile & R> {
        return matchAll<TFile>(this, filter as FileFilter)
    }

    or<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<TFile & R> {
        return or<TFile>(this, filter as FileFilter)
    }


}