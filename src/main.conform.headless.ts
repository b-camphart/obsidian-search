import { inspect } from "node:util";
import type { Match } from "./contract";
import { search } from "./search";
import { searchContract } from "./search.contract";
import { layoutReady } from "./lib/obsidian";
import type { Vault } from "obsidian";

const HeadlessObsidianApp = {
	[Symbol.toStringTag]: "HeadlessObsidianApp",
	workspace: {
		layoutReady: true,
	},
	vault: {
		_filesByPath: new Map<string, { content: string; vault: Vault }>(),
		getFiles() {},
		getMarkdownFiles() {},
		create(path, data, options) {},
		delete(file, force) {},
		cachedRead(file) {},
	} satisfies Pick<Vault, "getFiles" | "getMarkdownFiles" | "create" | "delete" | "cachedRead">,
};

await searchContract(HeadlessObsidianApp, {
	async findMatches(query, log) {
		let matches: Match[] = [];
		for await (const file of search(
			query,
			HeadlessObsidianApp,
			log
				? {
						...console,
						log: (...data) => {
							log(
								data
									.map((item) => {
										if (typeof item === "string") return item;
										return inspect(item, { depth: null });
									})
									.join(" "),
							);
						},
						info(...data) {
							this.log(...data);
						},
						debug(...data) {
							this.log(...data);
						},
					}
				: undefined,
		)) {
			matches.push({
				file,
				content: await HeadlessObsidianApp.vault.cachedRead(file),
			});
		}

		return matches;
	},
	explain(query) {
		const filter = parse(query, HeadlessObsidianApp.metadataCache);
		return filter.explanation();
	},
});
