import { test, type TestContext } from "node:test";
import type { SearchContract } from "../contract";
import type { FileCreation } from "src/lib/obsidian";

export const tagOperatorContract: SearchContract = async (search, file) => {
	function queryExpectations(...queries: [string, ...string[]]) {
		return {
			get query() {
				return queries[0];
			},
			async expectMatch(t: TestContext, creation: FileCreation) {
				const f = await file(creation);
				let setup;
				try {
					setup = await f.setup?.call(t);
				} catch (e) {
					throw new Error(
						`Failed to setup ${f.name}\n` +
							`Query: ${queries.map((query) => `\`${query}\``).join(", ")}`,
						{
							cause: e,
						},
					);
				}
				f.after?.call(t, setup);
				for (const query of queries) {
					const messages: string[] = [];
					if (
						!f.check.call(
							t,
							await search(query, (message) => messages.push(...message.split("\n"))),
							// @ts-ignore
							setup,
						)
					) {
						throw new Error(
							`expected to find ${f.name}\n` +
								`Query: \`${query}\`\n` +
								messages.join("\n"),
						);
					}
				}
			},
			async expectDoesNotMatch(t: TestContext, creation: FileCreation) {
				const f = await file(creation);
				let setup;
				try {
					setup = await f.setup?.call(t);
				} catch (e) {
					throw new Error(
						`Failed to setup ${f.name}\n` +
							`Query: ${queries.map((query) => `\`${query}\``).join(", ")}`,
						{
							cause: e,
						},
					);
				}
				f.after?.call(t, setup);
				for (const query of queries) {
					const messages: string[] = [];
					if (
						f.check.call(
							t,
							await search(query, (message) => messages.push(...message.split("\n"))),
							// @ts-ignore
							setup,
						)
					) {
						throw new Error(
							`expected NOT to find ${f.name}\n` +
								`Query: \`${query}\`\n` +
								messages.join("\n"),
						);
					}
				}
			},
		};
	}
	function testQuery(
		query: string,
		fn: (this: TestContext, query: ReturnType<typeof queryExpectations>) => Promise<void>,
	) {
		return test(`Example: \x1b[34m\`${query}\`\x1b[0m`, async (t) =>
			fn.call(t, queryExpectations(query)));
	}
	function prepareQuery(...queries: [string, ...string[]]) {
		const name =
			`\x1b[0mExample: ` + queries.map((it) => `\x1b[34m\`${it}\`\x1b[0m`).join(" or ");
		test(name);
		return queryExpectations(...queries);
	}
	function explain(explanation: string) {
		test(`\x1b[0m${explanation}`);
	}

	await test("Search for a Single Word", async () => {
		const query = prepareQuery(`tag:work`, `tag:#work`);
		explain("Matches files where the word appears as a tag");

		await test(`Includes:`, async () => {
			for (const [tag, explanation] of [
				["work", ""],
				["work/stuff", ""],
			]) {
				await test(`${tag} ${explanation}`, async (t) =>
					query.expectMatch(t, { tags: [tag] }));
			}
		});
		await test(`Does not include:`, async () => {
			await test(`content containing "work"`, async (t) => {
				for (const content of ["work", "path:work"]) {
					await query.expectDoesNotMatch(t, { content });
				}
			});
			await test(`properties containing "work"`, async (t) => {
				for (const properties of [{ work: "meeting" }, { used_in: "work" }]) {
					await query.expectDoesNotMatch(t, { properties });
				}
			});
			await test(`nested tags`, async () => {
				for (const [tag, explanation] of [["notes/work", ""]]) {
					await test(`${tag} ${explanation}`, async (t) =>
						query.expectDoesNotMatch(t, { tags: [tag] }));
				}
			});
		});
	});

	await test("Case Sensitivity", async () => {
		await test(`Keyword is case-insensitive`, async () => {
			const query = prepareQuery(`TAG:work`);
			await test("`TAG:` works the same as `tag:`", async (t) => {
				await query.expectMatch(t, { tags: ["work"] });
			});
		});
		await test(`Matching is case-insensitive`, async (t) => {
			const query = prepareQuery(`tag:WORK`);
			await test("Matches:", async () => {
				for (const [tag, explanation] of [
					["work", "(lowercase)"],
					["WORK", "(uppercase)"],
					["Work", "(mixed case)"],
				]) {
					await test(`${tag} ${explanation}`, (t) =>
						query.expectMatch(t, { tags: [tag] }));
				}
			});
		});
	});

	await test("Negation", async () => {
		const query = prepareQuery(`-tag:work`);
		explain("Excludes files whose tags contain the term.");
		await test("Includes:", async () => {
			for (const [tag, explanation] of [
				["fun/play", ""],
				["", "(empty tag)"],
				["notes/work", "(nested tag does not normally match)"],
			]) {
				await test(`${tag} ${explanation}`, async (t) => {
					await query.expectMatch(t, { tags: [tag] });
				});
			}
		});

		await test("Does not include:", async () => {
			for (const [tag, explanation] of [
				["work", ""],
				["work/meeting", ""],
			]) {
				await test(`${tag} ${explanation}`, async (t) => {
					await query.expectDoesNotMatch(t, { tags: [tag] });
				});
			}
		});
	});

	await test("Can only be followed by text", async () => {
		await test("Illegal searches", async () => {
			await test("Quoted Phrase", async (t) => {
				const query = prepareQuery(`tag:"work"`);
				await query.expectDoesNotMatch(t, { tags: ["work"] });
			});
			await test("Regular Expressions", async (t) => {
				const query = prepareQuery(`tag:/work/`);
				await query.expectDoesNotMatch(t, { tags: ["work"] });
			});
			await test("Negated Subquery", async (t) => {
				const query = prepareQuery(`tag:-word`);
				await query.expectDoesNotMatch(t, {});
				await query.expectDoesNotMatch(t, { tags: [] });
				await query.expectDoesNotMatch(t, { tags: ["play"] });
			});
			await test("Grouping", async (t) => {
				const query = prepareQuery(`tag:(work meeting)`);
				await query.expectDoesNotMatch(t, { tags: ["work", "meeting"] });
			});
		});
	});

	await test("Empty Search", async () => {
		const query = prepareQuery(`tag:`);
		await test("Matches nothing", async (t) => {
			await query.expectDoesNotMatch(t, {});
			await query.expectDoesNotMatch(t, { tags: [] });
		});
	});

	await test("Combining Searches", async () => {
		await test("Multiple tag filters", async () => {
			const query = prepareQuery(`tag:work tag:meeting`);
			explain("The file must contain both tags");

			await test("Includes:", async () => {
				for (const [tags, explanation] of [[["work", "meeting"] as const, ""] as const]) {
					await test(`${tags.join(", ")} ${explanation}`, (t) =>
						query.expectMatch(t, { tags }));
				}
			});
			await test("Does not include:", async () => {
				for (const [tags, explanation] of [
					[["work"], ""],
					[["meeting"], ""],
				] as [string[], string][]) {
					await test(`${tags.join(", ")} ${explanation}`, (t) =>
						query.expectDoesNotMatch(t, { tags }));
				}
			});
		});

		await test("Mixing with general search", async () => {
			const query = prepareQuery(`tag:work meeting`);
			explain("Combines tag filtering with general search.");
			await test("Includes:", async () => {
				for (const [tag, content, explanation] of [["work", "meeting", ""]]) {
					await test(`tags(${tag}) with content containing "meeting" ${explanation}`, (t) =>
						query.expectMatch(t, { tags: [tag], content }));
				}
			});
			await test("Does not include:", async () => {
				for (const [tag, content, explanation] of [
					["work", "", `without "meeting" in content`],
					["", "meeting", `with "meeting" in content, but no matching tag`],
				]) {
					await test(`tags(${tag}) ${explanation}`, (t) =>
						query.expectDoesNotMatch(t, { tags: [tag], content }));
				}
			});
		});
	});
};
