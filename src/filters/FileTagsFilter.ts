import { MetadataCache, TFile } from "obsidian";
import { StringChecker } from "src/checkers/StringChecker";
import { FileFilter } from "src/filters/FileFilter";

export class FileTagsFilter implements FileFilter {

    constructor(
        private readonly tagChecker: StringChecker,
        
        private readonly metadata: MetadataCache
    ) {}

    async appliesTo(file: TFile): Promise<boolean> {
        const tags = this.metadata.getFileCache(file)?.tags
        if (tags == null) return false;

        return tags.some(tag => this.tagChecker.matches(tag.tag))
    }

}