import { test } from "node:test";
import { type App } from "obsidian";
import { doesNotMatch, exampleQuery, fileMatch, matches, type SearchFn } from "../contract";

export async function negationSearchContract(app: App, search: SearchFn) {
	await test("Negation", async () => {
		await test("Single Term Negation", async () => {
			await test("Negate a single word", async (t) => {
				await exampleQuery(search, `-work`, [
					matches("files that do NOT contain the word", [
						await fileMatch(app, { name: "meeting" }),
						await fileMatch(app, {
							content: "planning session",
						}),
						await fileMatch(app, { tags: ["personal"] }),
					]),
					doesNotMatch("files that contain the word anywhere", [
						await fileMatch(app, { name: "work" }),
						await fileMatch(app, { name: "work meeting" }),
						await fileMatch(app, {
							content: "deep work session",
						}),
						await fileMatch(app, {
							properties: { type: "work" },
						}),
					]),
				]);
			});

			await test("Negate a phrase", async (t) => {
				await exampleQuery(search, `-"work meeting"`, [
					matches("files that do NOT contain the phrase", [
						await fileMatch(app, { name: "work" }),
						await fileMatch(app, { name: "meeting notes" }),
						await fileMatch(app, {
							content: "meeting for work",
						}),
					]),
					doesNotMatch("files that contain the exact phrase", [
						await fileMatch(app, {
							name: "work meeting",
						}),
						await fileMatch(app, {
							content: "notes from the work meeting",
						}),
					]),
				]);
			});
		});

		await test("Partial Negation", async () => {
			await test("Negate first term", async (t) => {
				await exampleQuery(search, `-work meeting`, [
					matches("contains 'meeting' AND NOT 'work'", [
						await fileMatch(app, { name: "meeting notes" }),
						await fileMatch(app, {
							content: "team meeting agenda",
						}),
					]),
					doesNotMatch("contains 'work'", [
						await fileMatch(app, {
							name: "work meeting",
						}),
						await fileMatch(app, {
							content: "meeting about work",
						}),
						await fileMatch(app, {
							name: "work",
						}),
					]),
				]);
			});

			await test("Negate second term", async (t) => {
				await exampleQuery(search, `work -meeting`, [
					matches("contains 'work' AND NOT 'meeting'", [
						await fileMatch(app, { name: "deep work" }),
						await fileMatch(app, {
							content: "focused work session",
						}),
					]),
					doesNotMatch("contains 'meeting'", [
						await fileMatch(app, {
							name: "work meeting",
						}),
						await fileMatch(app, {
							content: "meeting about work",
						}),
						await fileMatch(app, {
							name: "meeting",
						}),
					]),
				]);
			});
		});

		await test("Group Negation", async () => {
			await test("Negate entire group", async (t) => {
				await exampleQuery(search, `-(work meeting)`, [
					matches("files that do NOT contain BOTH words", [
						// contains neither
						await fileMatch(app, { name: "play" }),
						await fileMatch(app, { content: "personal notes" }),
						await fileMatch(app, { tags: ["personal"] }),

						// contains only one (still valid)
						await fileMatch(app, { name: "work" }),
						await fileMatch(app, { name: "meeting" }),
						await fileMatch(app, {
							content: "notes from work",
						}),
					]),
					doesNotMatch("files containing BOTH words", [
						await fileMatch(app, {
							name: "work meeting",
						}),
						await fileMatch(app, {
							content: "meeting about work",
						}),
					]),
				]);
			});
		});
	});
}
