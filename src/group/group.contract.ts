import { test } from "node:test";
import { type App } from "obsidian";
import {
	doesNotMatch,
	exampleQuery,
	fileMatch,
	matches,
	matchFile,
	type SearchFn,
} from "../contract";

export async function groupedQuerySearchContract(app: App, search: SearchFn) {
	await test("Grouping", async () => {
		await test("Basic Grouping", async () => {
			await test("Search for two words", async (t) => {
				await exampleQuery(search, `work meeting`, [
					matches("files with BOTH words", [
						await fileMatch(app, { name: "work meeting" }),
						await fileMatch(app, { name: "meetings for work" }),
						await fileMatch(app, {
							content: "work meetings are hard",
						}),
						await fileMatch(app, {
							properties: { work: "", meeting: "" },
						}),
						await fileMatch(app, {
							properties: { work: "meeting" },
						}),
						await fileMatch(app, {
							properties: { "work meeting": "" },
						}),
						await fileMatch(app, {
							properties: { type: "work meeting" },
						}),
						await fileMatch(app, {
							properties: { used_in: "work", type: "meeting" },
						}),
						await fileMatch(app, { tags: ["work", "meeting"] }),
					]),
					doesNotMatch("files with only one, or no words", [
						await fileMatch(app, { name: "play" }),
						await fileMatch(app, { name: "work" }),
						await fileMatch(app, { name: "meeting" }),
					]),
				]);
			});
			await test("Search for three words", async (t) => {
				await exampleQuery(search, `work meeting notes`, [
					matches("files with ALL three words", [
						await fileMatch(app, { name: "work meeting notes" }),
						await fileMatch(app, {
							content: "notes from the work meeting",
						}),
						await fileMatch(app, {
							properties: { work: "", meeting: "", notes: "" },
						}),
						await fileMatch(app, {
							tags: ["work", "meeting", "notes"],
						}),
					]),
					doesNotMatch("files missing one or more words", [
						await fileMatch(app, { name: "work meeting" }),
						await fileMatch(app, { name: "meeting notes" }),
						await fileMatch(app, { name: "work notes" }),
					]),
				]);
			});
		});
		await test("Parenthesis Grouping", async () => {
			await test("Search with grouped terms", async (t) => {
				await exampleQuery(search, `(work meeting) notes`, [
					matches("files containing grouped AND additional term", [
						await fileMatch(app, {
							content: "notes from the work meeting",
						}),
						await fileMatch(app, {
							name: "work meeting notes",
						}),
					]),
					doesNotMatch("files missing grouped terms", [
						await fileMatch(app, {
							content: "work notes only",
						}),
						await fileMatch(app, {
							content: "meeting notes only",
						}),
					]),
				]);
			});
		});

		await test("Edge Cases", async () => {
			await test("Word directly followed by quote (no separating space)", async (t) => {
				await exampleQuery(search, `work"meeting"`, [
					matches("files with the exact term", [
						await matchFile(
							app,
							{
								name: `work"meeting"`,
							},
							{
								catch(e) {
									if (
										e instanceof Error &&
										e.message.includes("File name cannot contain")
									) {
										return e;
									}
								},
							},
						),
						await fileMatch(app, {
							content: `discussion about work"meeting"`,
						}),
					]),
					doesNotMatch("files with the individual words", [
						await fileMatch(app, { name: "work meeting" }),
						await fileMatch(app, { name: "work" }),
						await fileMatch(app, { name: "meeting" }),
					]),
				]);
			});
		});
	});
}
