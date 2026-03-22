import { type App } from "obsidian";
import { fileMatch, Search } from "./contract";
import { test } from "node:test";

import { wordSearchContract } from "./word/word.contract";
import { simpleQuotedPhraseSearchContract } from "./quote/quote.contract";
import { groupedQuerySearchContract } from "./group/group.contract";
import { negationSearchContract } from "./negate/negation.contract";
import { FileCreation, layoutReady } from "./lib/obsidian";
import { fileOperatorContract } from "./file/file.contract";
import { inspect } from "util";
import { orContract } from "./or/or.contract";
import { pathOperatorContract } from "./path/path.contract";
import { tagOperatorContract } from "./tag/tag.contract";
import { propertyNameContractTest } from "./property/property_name.contract";

// obsidian's built-in search adheres to this spec, and thus this library must too

export async function searchContract(app: App, search: Search) {
	await layoutReady(app);
	// ensure a clean environment
	await Promise.all(app.vault.getFiles().map(async (file) => app.vault.delete(file, true)));

	await test("Search contract", async (t) => {
		t.after(async () => {
			// give the vault a moment to finish deleting files
			await new Promise((resolve) => setTimeout(resolve, 250));
			const results = await Promise.allSettled(
				app.vault.getFiles().map(async (file) => app.vault.delete(file, true)),
			);
			for (const result of results) {
				if (result.status === "rejected") {
					t.diagnostic(`[Error] ${inspect(result.reason)}`);
				}
			}
		});

		const findMatches = search.findMatches.bind(search);

		const createFile = async (props: FileCreation, explanation?: string) =>
			await fileMatch(app, props, explanation);

		await test("Simple Search", async () => {
			await wordSearchContract(findMatches, createFile);
			await simpleQuotedPhraseSearchContract(findMatches, createFile);
		});
		await groupedQuerySearchContract(app, findMatches);
		await negationSearchContract(app, findMatches);
		await orContract(findMatches, createFile);

		await test("Operators", async () => {
			await test("file", () => fileOperatorContract(findMatches, createFile));
			await test("path", () => pathOperatorContract(findMatches, createFile));
			await test("tag", () => tagOperatorContract(findMatches, createFile));

			await test("property", async () => {
				await test("property name", () =>
					propertyNameContractTest(findMatches, createFile));
			});
		});
	});
}
