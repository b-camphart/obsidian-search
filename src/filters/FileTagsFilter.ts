import { CachedMetadata, FrontMatterCache, MetadataCache, TFile, TagCache } from "obsidian";
import { StringChecker } from "src/checkers/StringChecker";
import { FileFilter } from "src/filters/FileFilter";

type TagProperty = string | string[]

interface Metadata {
    /**
     * @see {@link CachedMetadata.tags}
     */
    tags?: Omit<TagCache, 'position'>[];
    /**
     * @see {@link CachedMetadata.frontmatter}
     */
    frontmatter?: Partial<FrontMatterCache> & { tag?: TagProperty, tags?: TagProperty };
}

export interface MetadataRepository {
    /**
     * @see {@link MetadataCache.getFileCache}
     */
    getFileCache(file: TFile): Metadata | null
}

export interface MetadataFilter {
    appliesTo(metadata: Metadata | null): boolean;
}

export class MetadataTagFilter implements MetadataFilter {

    constructor(
        private readonly checker: StringChecker
    ){}

    appliesTo(metadata: Metadata | null): boolean {
        const tags = metadata?.tags
        if (tags != null) {
            if (tags.some(tag => this.checker.matches(`#${tag.tag}`))) {
                return true
            }
        }

        const frontmatter = metadata?.frontmatter
        if (frontmatter == null) return false;
        if (this.checkTags(frontmatter.tag)) {
            return true
        }
        if (this.checkTags(frontmatter.tags))  {
            return true
        }

        return false;
    }

    private checkTags(tags?: TagProperty) {
        if (tags == null) {
            return false;
        }
        if (typeof tags === "string") {
            const match = this.checker.matches(tags)
            return match
        }
        if (Array.isArray(tags)) {
            const match = tags.some(tag => this.checker.matches(tag))
            return match
        }
    }

}

export class FileTagsFilter implements FileFilter {

    private readonly metadataFilter: MetadataFilter;

    constructor(
        tagChecker: StringChecker,
        
        private readonly metadata: MetadataRepository
    ) {
        this.metadataFilter = new MetadataTagFilter(tagChecker)
    }

    async appliesTo(file: TFile): Promise<boolean> {
        const cache = this.metadata.getFileCache(file)
        return this.metadataFilter.appliesTo(cache)
    }
}