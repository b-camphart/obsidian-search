import type obsidian from "obsidian";
import type * as filters from "./filters";
import * as parse from "./parse";

/**
 * Filters the provided files matching the provided query, and yields them one at a time asynchronously.
 *
 * @example
 * ```typescript
 * for await (const file of filter("tag:meeting", app.metadataCache, myFiles)) {
 *     if (file.name === "test.md") break;
 * }
 * ```
 *
 */
export async function* filter(
	query: string,
	metadata_cache: obsidian.MetadataCache,
	files: Array<obsidian.TFile>,
	logger?: Console,
): AsyncGenerator<obsidian.TFile> {
	let parsed_filter: filters.file.Filter | filters.file.Async;
	try {
		parsed_filter = parse.parse(query, metadata_cache, logger);
	} catch (e) {
		(logger ?? console)?.error(e);
		return [];
	}

	logger?.log("filter", parsed_filter);

	for (const file of files) {
		if (await parsed_filter.appliesTo(file)) {
			logger?.log(`${file.path} applies to filter`);
			yield file;
		} else {
			logger?.log(`${file.path} does not apply to filter`);
		}
	}
}
