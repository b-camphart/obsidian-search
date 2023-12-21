import { TFile } from "obsidian";
import { FileFilter } from "src/filters/FileFilter";
import { StringChecker } from "../checkers/StringChecker";

export function file(checker: StringChecker): FileFilter<Pick<TFile, 'basename'>> {
    return new FileNameFilter(checker)
}

export class FileNameFilter implements FileFilter<Pick<TFile, 'basename'>> {

    constructor(private readonly checker: StringChecker) {}

    async appliesTo(file: Pick<TFile, 'basename'>): Promise<boolean> {
        return this.checker.matches(file.basename)
    }

}