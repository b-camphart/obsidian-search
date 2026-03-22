import type { TFile } from "obsidian";
import type { AsyncFileFilter } from "./FileFilter";
import { AsyncFilter } from "./Filter";
import { StringFilter } from "./strings";

export function content(matcher: StringFilter): AsyncFileFilter {
	return new ContentFilter({ matcher });
}

export class ContentFilter extends AsyncFilter<TFile> {
	content;

	constructor(def: { matcher: StringFilter }) {
		super();
		this.content = def.matcher;
	}

	static async appliesTo(match: StringFilter, file: TFile): Promise<boolean> {
		return match.appliesTo(await file.vault.cachedRead(file));
	}
	override async appliesTo(this: ContentFilter, file: TFile): Promise<boolean> {
		return ContentFilter.appliesTo(this.content, file);
	}

	override toQuery(this: ContentFilter): string {
		return `content:${this.content.toQuery()}`;
	}
}
