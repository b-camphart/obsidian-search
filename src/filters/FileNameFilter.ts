import type * as obsidian from "obsidian";
import { Filter } from "./Filter";
import type { FileFilter } from "./FileFilter";
import type { StringFilter } from "./strings";

export function file(checker: StringFilter): FileFilter {
	return new NameFilter({ matcher: checker });
}

export class NameFilter extends Filter<Pick<obsidian.TFile, "basename">> {
	name;

	constructor(def: { matcher: StringFilter }) {
		super();
		this.name = def.matcher;
	}

	static appliesTo(match: StringFilter, file: Pick<obsidian.TFile, "basename">): boolean {
		return match.appliesTo(file.basename);
	}
	override appliesTo(this: NameFilter, file: Pick<obsidian.TFile, "basename">): boolean {
		return NameFilter.appliesTo(this.name, file);
	}

	override toQuery(this: NameFilter): string {
		return `file:${this.name.toQuery()}`;
	}
}
