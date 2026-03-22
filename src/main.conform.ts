import { embedded } from "obsidian-test";
import { searchContract } from "./search.contract";
import { parse, search } from ".";
import { Match } from "./contract";
import { inspect } from "util";

embedded(async function (app) {
	await searchContract(app, {
		async findMatches(query, log) {
			let matches: Match[] = [];
			for await (const file of search(
				query,
				app,
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
					content: await app.vault.cachedRead(file),
				});
			}

			return matches;
		},
		explain(query) {
			const filter = parse(query, app.metadataCache);
			return filter.explanation();
		},
	});
});
