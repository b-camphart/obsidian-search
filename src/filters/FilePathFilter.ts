import { TFile } from "obsidian";
import { StringChecker } from "src/checkers/StringChecker";
import { FileFilter } from "src/filters/FileFilter";
import { matchAll } from "./MatchAllFilter";

export function path(checker: StringChecker): FileFilter<Pick<TFile, 'path'>> {
    return new FilePathFilter(checker)
}

export class FilePathFilter implements FileFilter<Pick<TFile, 'path'>> {

    constructor(private readonly checker: StringChecker) {}

    async appliesTo(file: Pick<TFile, 'path'>): Promise<boolean> {
        return this.checker.matches(file.path)
    }

    and<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<Pick<TFile, "path"> & R> {        
        return matchAll(this, filter as FileFilter)
    }

    or<R extends Partial<TFile>>(filter: FileFilter<R>): FileFilter<Pick<TFile, "path"> & R> {
        return matchAll(this, filter as FileFilter)
    }

}