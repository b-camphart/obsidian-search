import type * as obsidian from "obsidian";
import { Filter } from "./Filter";
import type { StringFilter } from "./strings";
import type { FileFilter } from "./FileFilter";

export class PropertyNameFilter extends Filter<obsidian.FrontMatterCache> {
	matcher;

	constructor(def: { matcher: StringFilter }) {
		super();
		this.matcher = def.matcher;
	}

	static appliesTo(match: StringFilter, frontmatter: obsidian.FrontMatterCache): boolean {
		for (const key of Object.keys(frontmatter)) {
			if (match.appliesTo(key)) return true;
		}
		return false;
	}
	override appliesTo(this: PropertyNameFilter, frontmatter: obsidian.FrontMatterCache): boolean {
		return PropertyNameFilter.appliesTo(this.matcher, frontmatter);
	}

	override toQuery(this: PropertyNameFilter): string {
		return `[${this.matcher.toQuery()}]`;
	}
}

export type FrontmatterFilter = Filter<obsidian.FrontMatterCache>;

export function propertyName(matcher: StringFilter): FrontmatterFilter {
	return new PropertyNameFilter({ matcher });
}

export function property(
	prop_matcher: FrontmatterFilter,
	metadataCache: Pick<obsidian.MetadataCache, "getFileCache">,
): FileFilter {
	return new PropertyFilter({
		property: prop_matcher,
		value: null,
		metadataCache,
	});
}

export function propertyValue(
	prop_matcher: FrontmatterFilter,
	value_matcher: StringFilter,
	metadataCache: Pick<obsidian.MetadataCache, "getFileCache">,
): FileFilter {
	return new PropertyFilter({
		property: prop_matcher,
		value: value_matcher,
		metadataCache,
	});
}

export class PropertyValueFilter {
	match;
	metadataCache;

	constructor(def: {
		match: StringFilter;
		metadataCache: Pick<obsidian.MetadataCache, "getFileCache">;
	}) {
		this.match = def.match;
		this.metadataCache = def.metadataCache;
	}

	static appliesTo(match: StringFilter, frontmatter: obsidian.FrontMatterCache) {
		for (const value of Object.values(frontmatter)) {
			if (typeof value === "string" && match.appliesTo(value)) {
				return true;
			}
		}

		return false;
	}
	appliesTo(this: PropertyValueFilter, file: obsidian.TFile) {
		return PropertyValueFilter.appliesTo(
			this.match,
			this.metadataCache.getFileCache(file)?.frontmatter ?? {},
		);
	}
}

export class PropertyFilter extends Filter<obsidian.TFile> {
	name;
	value;
	matadataCache;

	constructor(def: {
		property: FrontmatterFilter;
		value: StringFilter | null;
		metadataCache: Pick<obsidian.MetadataCache, "getFileCache">;
	}) {
		super();
		this.name = def.property;
		this.value = def.value;
		this.matadataCache = def.metadataCache;
	}

	override appliesTo(this: PropertyFilter, file: obsidian.TFile): boolean {
		const metadata = this.matadataCache.getFileCache(file) ?? {};
		return this.appliesToFrontmatter(metadata.frontmatter);
	}

	override toQuery(this: PropertyFilter): string {
		let suffix = "";
		if (this.value !== null) {
			suffix = ":" + this.value.toQuery();
		}
		return `[${this.name.toQuery()}${suffix}]`;
	}

	appliesToFrontmatter(this: PropertyFilter, frontmatter: obsidian.FrontMatterCache | undefined) {
		if (!frontmatter) return false;

		return this.name.appliesTo(frontmatter);
	}
}
