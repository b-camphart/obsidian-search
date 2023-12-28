import {
    CachedMetadata,
    MetadataCache,
    TFile,
} from "obsidian";
import { FileFilter } from "src/filters/FileFilter";
import { StringChecker } from "../checkers/StringChecker";

export interface Metadata extends Pick<MetadataCache, "getFileCache"> {
    getFileCache(file: TFile): null | Pick<CachedMetadata, "frontmatter">;
}

export class MetatdataPropertyFilter {

    constructor(
        private property: StringChecker,
        private value?: StringChecker,
    ) {}

    appliesTo(metadata: Pick<CachedMetadata, 'frontmatter'> | null): boolean {
        const properties = metadata?.frontmatter
        if (properties == null) return false;
        const keys = Object.keys(properties).filter((key) =>
            this.property.matches(key),
        );
        if (keys.length === 0) return false;

        if (this.value == null) return true;
        
        return keys.some((key) => {
            const value: string | undefined = properties[key]?.toString();
            if (value == null) return false;

            return this.value!.matches(value);
        });
    }

}

export class FilePropertyFilter implements FileFilter {

    private readonly metadataFilter: MetatdataPropertyFilter;

    constructor(
        private readonly metadata: Metadata,

        property: StringChecker,
        value?: StringChecker,
    ) {
        this.metadataFilter = new MetatdataPropertyFilter(property, value)
    }

    async appliesTo(file: TFile): Promise<boolean> {
        const cache = this.metadata.getFileCache(file)
        return this.metadataFilter.appliesTo(cache)
    }
}
