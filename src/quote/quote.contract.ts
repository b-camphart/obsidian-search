import { test } from "node:test";
import { doesNotMatch, exampleQuery, matches, SearchContract } from "../contract";
import { join } from "path";

export const simpleQuotedPhraseSearchContract: SearchContract = async (search, file) => {
	await test("Quoted Word Search", async () => {
		await test("Search for an exact word using quotes", async (t) => {
			await exampleQuery(search, `"work"`, [
				matches("file names containing the word", [
					await file({ name: "work" }),
					await file({ name: "homework" }),
					await file({ name: "working" }),
				]),
				matches("file content containing the EXACT word", [
					await file({ content: "work" }),
					await file({ content: "we met at work" }),
					await file({ content: "work is my life" }),
					await file({ content: "I go to work so I can afford to play" }),
					await file({ content: "work-o-holic" }, "hyphen acts as word separator"),
					await file({ content: "work'd" }, "apostraphe acts as word separator"),
				]),
				doesNotMatch("file content with the word embedded", [
					await file({ content: "homework" }),
					await file({ content: "working" }),
					await file({ content: "networking" }),
				]),
				doesNotMatch("folder names", [
					await file({ path: join("some", "work", "meetings.md") }),
				]),
			]);
		});
	});

	await test("Quoted Phrase Search", async () => {
		await test("Search for an exact phrase using quotes", async (t) => {
			await exampleQuery(search, `"work meeting"`, [
				matches("file names containing the phrase", [
					await file({ name: "work meeting" }),
					await file({ name: "work meetings" }),
					await file({ name: "homework meetings" }),
				]),
				matches("file content containing the EXACT phrase", [
					await file({ content: "work meeting" }),
					await file({ content: "home work meeting" }),
					// property names
					await file({
						properties: { "work meeting": "" },
					}),
					await file({
						properties: { "home work meeting": "" },
					}),
					// property values
					await file({
						properties: { used_in: "work meeting" },
					}),
					await file({
						properties: { used_in: "home work meeting" },
					}),
				]),
				doesNotMatch("file content with the phrase embedded", [
					await file({ content: "work meetings" }),
					await file({ content: "homework meeting" }),
					// property names
					await file({
						properties: { "work meetings": "" },
					}),
					await file({
						properties: { "homework meeting": "" },
					}),
					// property values
					await file({
						properties: { used_in: "work meetings" },
					}),
					await file({
						properties: { used_in: "homework meeting" },
					}),
				]),
				doesNotMatch("partial or reordered phrases", [
					await file({ name: "meeting work" }),
					await file({ name: "work  meeting" }),
					await file({ content: "work  meeting" }),
					await file({ content: "work\nmeeting" }),
					await file({ content: "work weekly meeting" }),
					await file({ content: "meeting work" }),
				]),
				doesNotMatch("based on folder names", [
					await file({ path: "work/meeting notes.md" }),
				]),
			]);
		});
		await test("Search for a tag (tags cannot contain spaces)", async (t) => {
			await exampleQuery(search, `"work_meeting"`, [
				matches("files with tags containing the phrase", [
					await file({ tags: ["work_meeting"] }),
				]),
				doesNotMatch("files without tags containing the phrase", [
					await file({ tags: [] }),
					await file({ tags: ["work"] }),
					await file({ tags: ["meeting"] }),
				]),
				doesNotMatch("files without the EXACT tag", [
					await file({ tags: ["work_meetings"] }),
				]),
			]);
		});

		await test("Search for a phrase with quotation marks", async (t) => {
			await exampleQuery(search, `"he said \\"yes,\\" and left`, [
				matches("file content with the exact phrase", [
					await file({
						content: `"he said "yes," and left`,
					}),
					await file({
						properties: { [`"he said "yes," and left`]: "" },
					}),
					await file({
						properties: { quote: `"he said "yes," and left` },
					}),
				]),
				doesNotMatch("files without the escaped quotes", [
					await file({
						content: `"he said yes, and left`,
					}),
				]),
			]);
		});

		await test("Edge case: missing the closing quote", async (t) => {
			await exampleQuery(search, `"work meeting`, [
				matches("file names containing the phrase", [
					await file({ name: "work meeting" }),
					await file({ name: "work meetings" }),
					await file({ name: "homework meetings" }),
				]),
				matches("file content containing the EXACT phrase", [
					await file({ content: "work meeting" }),
					await file({ content: "home work meeting" }),
					// property names
					await file({
						properties: { "work meeting": "" },
					}),
					await file({
						properties: { "home work meeting": "" },
					}),
					// property values
					await file({
						properties: { used_in: "work meeting" },
					}),
					await file({
						properties: { used_in: "home work meeting" },
					}),
				]),
				doesNotMatch("file content with the phrase embedded", [
					await file({ content: "work meetings" }),
					await file({ content: "homework meeting" }),
					// property names
					await file({
						properties: { "work meetings": "" },
					}),
					await file({
						properties: { "homework meeting": "" },
					}),
					// property values
					await file({
						properties: { used_in: "work meetings" },
					}),
					await file({
						properties: { used_in: "homework meeting" },
					}),
				]),
				doesNotMatch("partial or reordered phrases", [
					await file({ name: "meeting work" }),
					await file({ content: "work weekly meeting" }),
					await file({ content: "meeting work" }),
				]),
				doesNotMatch("based on folder names", [
					await file({ path: "work/meeting notes.md" }),
				]),
			]);
		});
	});
};
