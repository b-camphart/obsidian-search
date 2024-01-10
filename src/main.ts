/// <reference types="vite/client" />
import { App, MetadataCache, TFile } from "obsidian";
import { FileFilter, isFileFilter } from "./filters/FileFilter";
import { Parser } from "./parsers/Parser";
import { DefaultParser } from "./parsers/DefaultParser";
import util from "util";

let debug: typeof console.log = () => { };
export function traceParsing() {
    debug = console.log;
}
export function hideParseingTrace() {
    debug = () => { };
}

/**
 * @since 0.1.1
 * 
 * Never matches against a file.  Always defers to whatever filter it's combined with.
 */
export const EmtpyFilter: FileFilter = {
    async appliesTo(file) {
        return false
    },
    and(filter) {
        return filter
    },
    or(filter) {
        return filter
    },
}

/**
 * @since 0.1.0
 * 
 * Parses the provided query and returns a FileFilter that can be used to match files against.
 * 
 * @param query The query to parse and turn into a {@link FileFilter}
 * @param metadata MetadataCache provided by Obsidian's {@link App.metadataCache} property.
 * @param filter The filter to fallback to for an empty query.  Default behavior is to {@link EmtpyFilter}.
 * @returns 
 */
export function parse(query: string, metadata: MetadataCache, filter: FileFilter = EmtpyFilter): FileFilter {
    query = query.trim();

    let parser: Parser = new DefaultParser(metadata);
    for (const char of query) {
        if (import.meta.env.MODE === "test") {
            debug("=== PARSING CHAR: ", char, " ===");
        }
        const nextParser = parser.parse(char);
        if (nextParser == null) {
            const checker = parser.end(filter);
            if (isFileFilter(checker)) {
                filter = checker
            }
            parser = new DefaultParser(metadata);
        } else {
            parser = nextParser;
        }
        if (import.meta.env.MODE === "test") {
            debug("--- after: ")
            debug(util.inspect(parser, { showHidden: true, depth: null }));
            debug("=== END CHAR PARSING ===");
        }
    }

    const checker = parser.end(filter);
    if (isFileFilter(checker)) {
        return checker
    }

    return filter
}

export async function* search(query: string, app: App): AsyncGenerator<TFile> {
    const allFiles = app.vault.getMarkdownFiles();

    const filter = parse(query, app.metadataCache);
    for (const file of allFiles) {
        if (await filter.appliesTo(file)) {
            yield file;
        }
    }
}

export * from 'src/filters'