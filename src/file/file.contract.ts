import { test } from "node:test";
import { doesNotMatch, exampleQuery, matches, SearchContract } from "../contract";
import { randomInt } from "crypto";

export const fileOperatorContract: SearchContract = async (search, file) => {
	await test("Search for a single word", async (t) => {
		await exampleQuery(search, `file:work`, [
			matches("files with names containing the word", [
				await file({ name: "work" }),
				await file({ name: "works" }),
				await file({ name: "work meeting" }),
				await file({ name: "homework" }),
			]),
			doesNotMatch("file content, properties, or tags", [
				await file({ content: "work" }),
				await file({ properties: { work: "" } }),
				await file({ properties: { used_in: "work" } }),
				await file({ tags: ["work"] }),
			]),
			doesNotMatch("folder names", [await file({ path: "work/meeting.md" })]),
		]);
	});

	await test("Search for a phrase", async (t) => {
		await exampleQuery(search, `file:"work meeting"`, [
			matches("files with names containing the phrase", [
				await file({ name: "work meeting" }),
				await file({ name: "work meetings" }),
				await file({ name: "homework meetings" }),
			]),
			doesNotMatch("files with the phrase only in content or metadata", [
				await file({ content: "work meeting" }),
				await file({ properties: { "work meeting": "" } }),
				await file({ properties: { used_in: "work meeting" } }),
				await file({ tags: ["work_meeting"] }),
			]),
			doesNotMatch("files with reordered or partial phrases", [
				await file({ name: "meeting work" }),
				await file({ name: "work  meeting" }),
			]),
		]);
	});

	await test("Search for a regex", async (t) => {
		await exampleQuery(search, `file:/[0-9]+/`, [
			matches("files with numbers in the name", [
				await file({ name: "meeting1" }),
				await file({ name: "notes-2024" }),
				await file({ name: "Q4-summary" }),
			]),
			doesNotMatch("files without numbers in the name", [
				await file({ name: "work meeting" }),
				await file({
					content: "2024 planning",
					name: Array.from({ length: 6 }, () => randomInt(10, 16).toString(16)).join(""),
				}),
				await file({
					properties: { year: 2024 },
					name: Array.from({ length: 6 }, () => randomInt(10, 16).toString(16)).join(""),
				}),
			]),
		]);
	});

	await test("Search for a negated word", async (t) => {
		await exampleQuery(search, `file:-work`, [
			matches("files whose names do not contain the word", [
				await file({ name: "meeting" }),
				await file({ name: "notes" }),
			]),
			doesNotMatch("files whose names contain the word", [
				await file({ name: "work" }),
				await file({ name: "work meeting" }),
				await file({ name: "homework" }),
			]),
		]);
	});

	await test("Negate the search for a word", async (t) => {
		await exampleQuery(search, `-file:work`, [
			matches("files whose names do not contain the word", [
				await file({ name: "meeting" }),
				await file({ name: "notes" }),
			]),
			doesNotMatch("files whose names contain the word", [
				await file({ name: "work" }),
				await file({ name: "work meeting" }),
				await file({ name: "homework" }),
			]),
		]);
	});

	await test("Search for a group", async (t) => {
		await exampleQuery(search, `file:(work meeting)`, [
			matches("files with both words contained", [
				await file({ name: "work meeting" }),
				await file({ name: "work meeting" }),
				await file({ name: "jan 16 work meeting" }),
				await file({ name: "work meeting with Gary" }),
			]),
			doesNotMatch("files with only one word in the name", [
				await file({ name: "meeting" }),
				await file({ name: "work notes" }),
				await file({ name: "team meeting" }),
			]),
			doesNotMatch("files without the grouped words", [
				await file({ name: "notes" }),
				await file({ name: "planning" }),
			]),
			doesNotMatch("content", [
				await file({ name: "work", content: "meeting" }),
				await file({ content: "work meeting notes" }),
			]),
		]);
	});
};
