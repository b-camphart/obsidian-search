import { test } from "node:test";
import { doesNotMatch, exampleQuery, matches, SearchContract } from "../contract";

export const orContract: SearchContract = async (search, file) => {
	await test("Matches files containing either term", async () => {
		await exampleQuery(search, `work OR play`, [
			matches("file names containing either term", [
				await file({ name: "work" }),
				await file({ name: "play" }),
				await file({ name: "working" }),
				await file({ name: "playground" }),
			]),

			matches("file content containing either term", [
				await file({ content: "work" }),
				await file({ content: "play" }),
				await file({ content: "we met at work" }),
				await file({ content: "time to play outside" }),
			]),

			matches("file content containing both terms", [
				await file({ content: "work then play" }),
				await file({ content: "we play after work" }),
			]),

			matches("property names containing either term", [
				await file({ properties: { work: "" } }),
				await file({ properties: { play: "" } }),
			]),

			matches("property values containing either term", [
				await file({ properties: { used_in: "work" } }),
				await file({ properties: { used_in: "play" } }),
			]),

			matches("tags containing either term", [
				await file({ tags: ["work"] }),
				await file({ tags: ["play"] }),
			]),

			doesNotMatch("files containing neither term", [
				await file({ content: "rest" }),
				await file({ content: "vacation time" }),
				await file({ name: "meeting notes" }),
			]),
		]);
	});

	await test("OR works with quoted phrases", async () => {
		await exampleQuery(search, `"work meeting" OR play`, [
			matches("files matching the quoted phrase", [
				await file({ content: "work meeting" }),
				await file({ content: "home work meeting" }),
			]),

			matches("files matching the second term", [await file({ content: "play outside" })]),

			doesNotMatch("files matching neither", [
				await file({ content: "team meeting" }),
				await file({ content: "homework assignment" }),
			]),
		]);
	});

	await test("OR is case-sensitive", async () => {
		await exampleQuery(search, `work or play`, [
			matches("files with the fully query", [await file({ content: "work or play" })]),

			doesNotMatch("files with just one or the other", [
				await file({ name: "work" }),
				await file({ name: "play" }),
			]),
		]);
	});

	await test("OR has lower precedence than implicit AND", async (t) => {
		// `fun work OR play` parses as `(fun AND work) OR play`
		await exampleQuery(search, `fun work OR play`, [
			matches("file content containing 'fun' AND 'work'", [
				await file({ content: "fun work" }),
				await file({ content: "this is fun work indeed" }),
			]),
			matches("file content containing only 'play' (no 'fun' required)", [
				await file({ content: "play" }),
				await file({ content: "let's go play outside" }),
			]),
			doesNotMatch("file content with 'fun' but neither 'work' nor 'play'", [
				await file({ content: "fun times" }),
			]),
			doesNotMatch("file content with 'work' but not 'fun', and not 'play'", [
				await file({ content: "work is hard" }),
			]),
		]);

		// `work OR play meeting` parses as `work OR (play AND meeting)`
		await exampleQuery(search, `work OR play meeting`, [
			matches("file content containing only 'work' (no 'meeting' required)", [
				await file({ content: "work" }),
				await file({ content: "we met at work" }),
			]),
			matches("file content containing both 'play' AND 'meeting'", [
				await file({ content: "play meeting" }),
				await file({ content: "our play meeting was fun" }),
				await file({ content: "meeting about play" }),
			]),
			doesNotMatch("file content with 'play' but not 'meeting'", [
				await file({ content: "play" }),
				await file({ content: "let's go play outside" }),
			]),
			doesNotMatch("file content with 'meeting' but not 'play' or 'work'", [
				await file({ content: "meeting notes" }),
			]),
		]);
	});

	await test("Edge case: duplicate matches should still return once", async () => {
		await exampleQuery(search, `work OR work`, [
			matches("files containing the term", [
				await file({ content: "work" }),
				await file({ name: "work log" }),
			]),

			doesNotMatch("files without the term", [await file({ content: "play" })]),
		]);
	});

	await test("Edge case: missing right-hand term", async () => {
		await exampleQuery(search, `work OR`, [
			matches("files containing the first term", [
				await file({ content: "work" }),
				await file({ name: "work log" }),
			]),

			doesNotMatch("files without the term", [await file({ content: "play" })]),
		]);
	});
};
