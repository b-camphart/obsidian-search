/// <reference types="vite/client" />
import { App, MetadataCache, TFile } from "obsidian";
import { FileFilter, isFileFilter } from "./filters/FileFilter";
import { matchAll } from "./filters/MatchAllFilter";
import { Parser } from "./parsers/Parser";
import { DefaultParser } from "./parsers/DefaultParser";
import util from "util";

let debug: typeof console.log = () => {};
export function traceParsing() {
    debug = console.log;
}
export function hideParseingTrace() {
    debug = () => {};
}

export function parse(query: string, metadata: MetadataCache): FileFilter {
    query = query.trim();

    const filters: FileFilter[] = [];

    let parser: Parser = new DefaultParser(metadata);
    for (const char of query) {
        if (import.meta.env.MODE === "development") {
            debug("=== PARSING CHAR: ", char, " ===");
            debug(util.inspect(parser, { showHidden: true, depth: null }));
        }
        const nextParser = parser.parse(char);
        if (nextParser == null) {
            const checker = parser.end();
            if (isFileFilter(checker)) {
                filters.push(checker);
            }
            parser = new DefaultParser(metadata);
        } else {
            parser = nextParser;
        }
        if (import.meta.env.MODE === "development") {
            debug("=== END CHAR PARSING ===");
        }
    }

    const checker = parser.end();
    if (isFileFilter(checker)) {
        filters.push(checker);
    }

    return matchAll(filters);
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