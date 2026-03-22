/* *
 * The public API of the library.
 */
import type * as obsidian from "obsidian";
export { search } from "./search";
export { filter } from "./filter";
export { parse } from "./parse";

export function searchable(app: obsidian.App) {
	return {
		search(query: string): AsyncGenerator<obsidian.TFile> {
			return search(query, app);
		},
		filter(query: string, files: Array<obsidian.TFile>): AsyncGenerator<obsidian.TFile> {
			return filter(query, app.metadataCache, files);
		},
	};
}
