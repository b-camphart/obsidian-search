import type obsidian from "obsidian";
import { filter } from "./filter";

/**
 * Searches for files matching the provided query, and yields them one at a time asynchronously.
 *
 * @example
 * ```typescript
 * for await (const file of search("tag:meeting", app)) {
 *     if (file.name === "test.md") break;
 * }
 * ```
 *
 */
export function search(
	query: string,
	app: obsidian.App,
	logger?: Console,
): AsyncGenerator<obsidian.TFile> {
	const allFiles = app.vault.getMarkdownFiles();
	return filter(query, app.metadataCache, allFiles, logger);
}
