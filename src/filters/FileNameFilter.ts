import { TFile } from "obsidian";
import { FileFilter } from "src/filters/FileFilter";
import { StringChecker } from "../checkers/StringChecker";
import { matchAll } from "./MatchAllFilter";
import { or } from "./OrFilter";

export function file(checker: StringChecker): FileFilter<Pick<TFile, 'basename'>> {
    return new FileNameFilter(checker)
}

export class FileNameFilter implements FileFilter<Pick<TFile, 'basename'>> {

    constructor(private readonly checker: StringChecker) {}

    async appliesTo(file: Pick<TFile, 'basename'>): Promise<boolean> {
        return this.checker.matches(file.basename)
    }

    and<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<Pick<TFile, "basename"> & R> {
        return matchAll(this, filter as FileFilter)
    }

    or<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<Pick<TFile, "basename"> & R> {
        return or(this, filter as FileFilter)
    }

}