import { test } from "node:test";
import { doesNotMatch, exampleQuery, matches, SearchContract } from "../contract";

export const wordSearchContract: SearchContract = async (search, file) => {
	await test("Search for a single word", async (t) => {
		await exampleQuery(search, `work`, [
			matches("files containing the word", [
				await file({ name: "work" }),
				await file({ name: "works" }),
				await file({ name: "work meeting" }),
				await file({ name: "homework" }),
				await file({ content: "work" }),
				await file({ content: "works" }),
				await file({ content: "homework" }),
				await file({ properties: { work: "" } }),
				await file({ properties: { works: "" } }),
				await file({ properties: { homework: "" } }),
				await file({ properties: { used_in: "work" } }),
				await file({ properties: { used_in: "works" } }),
				await file({ properties: { used_in: "homework" } }),
				await file({ tags: ["work"] }),
				await file({ tags: ["works"] }),
				await file({ tags: ["homework"] }),
				await file({ tags: ["homework", "Q4"] }),
			]),
			doesNotMatch("based on folder names", [await file({ path: "work/meeting.md" })]),
		]);
	});
};
