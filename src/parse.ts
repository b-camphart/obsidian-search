import type obsidian from "obsidian";
import type * as filters from "./filters";
import * as parser from "./parser";

/**
 * @since 0.1.0
 *
 * Parses the provided query and returns a FileFilter that can be used to match files against.
 *
 * @param query The query to parse and turn into a {@link filters.FileFilter}
 * @param metadata MetadataCache provided by Obsidian's {@link App.metadataCache} property.
 * @param filter The filter to fallback to for an empty query.  Default behavior is to {@link EmtpyFilter}.
 * @returns
 */
export function parse(
	query: string,
	metadata: obsidian.MetadataCache,
	logger?: Console,
): filters.file.Filter | filters.file.Async {
	return new parser.Parser({ metadataCache: metadata }).filterFromQuery(query, logger);
}
