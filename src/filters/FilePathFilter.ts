import type * as obsidian from "obsidian";
import type { FileFilter } from "./FileFilter";
import { type StringFilter } from "./strings";
import { Filter } from "./Filter";

export function path(matcher: StringFilter): FileFilter {
	return new PathFilter({ path: matcher });
}

export class PathFilter extends Filter<Pick<obsidian.TFile, "path">> {
	path: StringFilter;

	constructor(def: Pick<PathFilter, "path">) {
		super();
		this.path = def.path;
	}

	override appliesTo(this: PathFilter, file: Pick<obsidian.TFile, "path">): boolean {
		return this.path.appliesTo(file.path);
	}

	override toQuery(this: PathFilter): string {
		return `path:${this.path.toQuery()}`;
	}
}
