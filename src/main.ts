/// <reference types="vite/client" />
import { App, MetadataCache, TFile } from "obsidian";
import { FileFilter } from "./filters/FileFilter";
import { AlwaysMatch } from "src/filters";

let debug: typeof console.log = () => {};
export function traceParsing() {
	debug = console.log;
}
export function hideParseingTrace() {
	debug = () => {};
}

/**
 * @since 0.1.1
 *
 * Never matches against a file.  Always defers to whatever filter it's combined with.
 */
export const EmtpyFilter: FileFilter = {
	async appliesTo(file) {
		return false;
	},
	and(filter) {
		return filter;
	},
	or(filter) {
		return filter;
	},
};

export * from "src/filters";
