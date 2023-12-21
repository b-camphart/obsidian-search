import { TFile } from "obsidian";
import { StringChecker } from "src/checkers/StringChecker";
import { FileFilter } from "src/filters/FileFilter";

export function content(checker: StringChecker): FileFilter {
    return new FileContentFilter(checker)
}

export class FileContentFilter implements FileFilter {

    constructor(private readonly checker: StringChecker) {}

    async appliesTo(file: TFile): Promise<boolean> {
        const content = await file.vault.cachedRead(file)
        return this.checker.matches(content)
    }

}