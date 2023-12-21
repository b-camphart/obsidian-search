import { MetadataCache, TFile } from "obsidian";
import { FileFilter } from "src/filters/FileFilter";
import { StringChecker } from "../checkers/StringChecker";

export class FilePropertyFilter implements FileFilter {

    constructor(
        private readonly metadata: MetadataCache,

        private readonly property: StringChecker,
        private readonly value?: StringChecker,
    ) {}

    async appliesTo(file: TFile): Promise<boolean> {
        const properties = this.metadata.getFileCache(file)?.frontmatter
        if (properties == null) return false;

        const key = Object.keys(properties).find(key => this.property.matches(key))
        if (key == null) return false

        if (this.value == null) return true

        const value: string | undefined = properties[key]?.toString()
        if (value == null) return false

        return this.value.matches(value)
    }

}