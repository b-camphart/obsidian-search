import type * as obsidian from "obsidian";
import type { FileFilter } from "./FileFilter";
import type { StringFilter } from "./strings";
import { Filter } from "./Filter";

export function tag(
	word: string,
	metadataCache: Pick<obsidian.MetadataCache, "getFileCache">,
): FileFilter {
	return new TagFilter({ word, metadataCache });
}

export class TagFilter extends Filter<obsidian.TFile> {
	word;
	#metadataCache: Pick<obsidian.MetadataCache, "getFileCache">;

	constructor(def: {
		word: string;
		metadataCache: Pick<obsidian.MetadataCache, "getFileCache">;
	}) {
		super();
		this.word = def.word;
		this.#metadataCache = def.metadataCache;
	}

	override appliesTo(this: TagFilter, file: obsidian.TFile): boolean {
		const metadata = this.#metadataCache.getFileCache(file);
		if (!metadata) return false;
		// prefer frontmatter tags
		{
			const frontmatter = metadata.frontmatter ?? {};
			const tags: unknown = frontmatter.tags;
			if (Array.isArray(tags)) {
				if (
					tags.some(
						(it) =>
							typeof it === "string" &&
							it.toLowerCase().startsWith(this.word.toLowerCase()),
					)
				) {
					return true;
				}
			}
		}

		// check inline tags
		const tags = metadata.tags;
		if (!tags) return false;
		return tags.some((it) => it.tag.toLowerCase().startsWith(this.word.toLowerCase()));
	}

	override toQuery(this: TagFilter): string {
		return `tag:${this.word}`;
	}
}

type TagProperty = string | (string | null)[];

interface Metadata {
	/**
	 * @see {@link obsidian.CachedMetadata.tags}
	 */
	tags?: Omit<obsidian.TagCache, "position">[];
	/**
	 * @see {@link obsidian.CachedMetadata.frontmatter}
	 */
	frontmatter?: Partial<obsidian.FrontMatterCache> & { tag?: TagProperty; tags?: TagProperty };
}

export interface MetadataRepository {
	/**
	 * @see {@link obsidian.MetadataCache.getFileCache}
	 */
	getFileCache(file: obsidian.TFile): Metadata | null;
}

export interface MetadataFilter {
	appliesTo(metadata: Metadata | null): boolean;
}

export class MetadataTagFilter implements MetadataFilter {
	constructor(private readonly checker: StringFilter) {}

	appliesTo(metadata: Metadata | null): boolean {
		const tags = metadata?.tags;
		if (tags != null) {
			if (tags.some((tag) => this.checker.appliesTo(`#${tag.tag}`))) {
				return true;
			}
		}

		const frontmatter = metadata?.frontmatter;
		if (frontmatter == null) return false;
		if (this.checkTags(frontmatter.tag)) {
			return true;
		}
		if (this.checkTags(frontmatter.tags)) {
			return true;
		}

		return false;
	}

	private checkTags(tags?: TagProperty) {
		if (tags == null) {
			return false;
		}
		if (typeof tags === "string") {
			const match = this.checker.appliesTo(tags);
			return match;
		}
		if (Array.isArray(tags)) {
			const match = tags.some((tag) => tag != null && this.checker.matches(tag));
			return match;
		}
	}
}
