import { test, TestContext } from "node:test";
import { SearchContract } from "../contract";
import { FileCreation } from "src/lib/obsidian";

export const pathOperatorContract: SearchContract = async (search, file) => {
	function queryExpectations(query: string) {
		return {
			async expectMatch(t: TestContext, creation: FileCreation) {
				const f = await file(creation);
				let setup;
				try {
					setup = await f.setup?.call(t);
				} catch (e) {
					throw new Error(`Failed to setup ${f.name}\n` + `Query: \`${query}\``, {
						cause: e,
					});
				}
				f.after?.call(t, setup);
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
			},
			async expectDoesNotMatch(t: TestContext, creation: FileCreation) {
				const f = await file(creation);
				let setup;
				try {
					setup = await f.setup?.call(t);
				} catch (e) {
					throw new Error(`Failed to setup ${f.name}\n` + `Query: \`${query}\``, {
						cause: e,
					});
				}
				f.after?.call(t, setup);
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
			},
		};
	}
	function testQuery(
		query: string,
		fn: (query: ReturnType<typeof queryExpectations>) => Promise<void>,
	) {
		return test(`Example: \x1b[34m\`${query}\`\x1b[0m`, async () =>
			fn(queryExpectations(query)));
	}
	function prepareQuery(query: string) {
		test(`\x1b[0mExample: \x1b[34m\`${query}\`\x1b[0m`);
		return queryExpectations(query);
	}
	function explain(explanation: string) {
		test(`\x1b[0m${explanation}`);
	}

	await test("Search for a Single Word", async () => {
		const query = prepareQuery(`path:work`);
		explain("Matches files where the word appears anywhere in the path");

		await test(`Includes:`, async () => {
			for (const [path, explanation] of [
				["work.md", "(file name)"],
				["notes/work.md", "(file name in path)"],
				["work/notes.md", "(parent folder)"],
				["homework/notes.md", "(substring match)"],
				["my-work/notes.md", "(substring with punctuation)"],
			]) {
				await test(`${path} ${explanation}`, async (t) => query.expectMatch(t, { path }));
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
			await test(`tags containing "work"`, async (t) => {
				for (const tags of [["work"]]) {
					await query.expectDoesNotMatch(t, { tags });
				}
			});
		});
	});

	await test("Case Sensitivity", async () => {
		await test(`Keyword is case-insensitive`, async () => {
			const query = prepareQuery(`PATH:work`);
			await test("`PATH:` works the same as `path:`", async (t) => {
				await query.expectMatch(t, { path: "work/meeting.md" });
				await query.expectDoesNotMatch(t, { content: "PATH:work" });
			});
		});
		await test(`Matching is case-insensitive`, async (t) => {
			const query = prepareQuery(`path:WORK`);
			await test("Matches:", async () => {
				for (const [path, explanation] of [
					["work/meeting.md", "(lowercase)"],
					["WORK/meeting.md", "(uppercase)"],
					["WoRk/meeting.md", "(mixed case)"],
				]) {
					await test(`${path} ${explanation}`, (t) => query.expectMatch(t, { path }));
				}
			});
		});
	});

	await test("Quoted Phrases", async () => {
		await test("Exact phrase matching", async () => {
			const query = prepareQuery(`path:"work meeting"`);
			explain("Matches the exact phrase as a substring of the full path");

			await test("Includes:", async () => {
				for (const [path, explanation] of [
					["work meeting.md", "file name"],
					["notes/work meeting.md", "within path"],
				]) {
					await test(`${path} (${explanation})`, (t) => query.expectMatch(t, { path }));
				}
			});
			await test("Does not include:", async () => {
				for (const [path, explanation] of [["work/meeting.md", "words separated by '/'"]]) {
					await test(`${path} (${explanation})`, (t) =>
						query.expectDoesNotMatch(t, { path }));
				}
			});
		});

		await test("Slashes are treated literally", async (t) => {
			const query = prepareQuery(`path:"work/"`);
			explain("Matches any path containing the exact substring `work/`");

			await test("Includes:", async () => {
				for (const [path, explanation] of [
					["work/notes.md", ""],
					["work/projects/todo.md", ""],
					["homework/notes.md", "(substring match)"],
				]) {
					await test(`${path} ${explanation}`, (t) => query.expectMatch(t, { path }));
				}
			});
			await test("Does not include:", async () => {
				for (const [path, explanation] of [["notes/work.md", "(missing trailing slash)"]]) {
					await test(`${path} ${explanation}`, (t) =>
						query.expectDoesNotMatch(t, { path }));
				}
			});
		});

		await test("Special characters", async (t) => {
			const query = prepareQuery(`path:"work (old)"`);
			await test("Matches phrases with special characters literally:", async () => {
				for (const [path, explanation] of [["work (old).md", ""]]) {
					await test(`${path} ${explanation}`, (t) => query.expectMatch(t, { path }));
				}
			});
		});

		await test("Case-insensitive matching", async (t) => {
			const query = prepareQuery(`path:"Work"`);
			await test("Matches regardless of casing:", async () => {
				for (const [path, explanation] of [
					["WORK/notes.md", ""],
					["work/notes.md", ""],
				]) {
					await test(`${path} ${explanation}`, (t) => query.expectMatch(t, { path }));
				}
			});
		});
	});

	await test("Negation", async () => {
		const negatedKeyword = prepareQuery(`-path:work`);
		const negatedSubquery = prepareQuery(`path:-work`);
		explain("Excludes files whose path contains the term.");
		await test("Includes:", async () => {
			for (const [path, explanation] of [["fun/play.md", ""]]) {
				await test(`${path} ${explanation}`, async (t) => {
					for (const query of [negatedKeyword, negatedSubquery]) {
						await query.expectMatch(t, { path });
					}
				});
			}
		});

		await test("Does not include:", async () => {
			for (const [path, explanation] of [
				["work/meeting.md", ""],
				["notes/work.md", ""],
			]) {
				await test(`${path} ${explanation}`, async (t) => {
					for (const query of [negatedKeyword, negatedSubquery]) {
						await query.expectDoesNotMatch(t, { path });
					}
				});
			}
		});
	});

	await test("Grouping", async () => {
		const query = prepareQuery(`path:(work meeting)`);
		explain("All terms inside the group must match the path");

		await test("Includes:", async () => {
			for (const [path, explanation] of [
				["work/meeting.md", ""],
				["notes/work meeting.md", ""],
			]) {
				await test(`${path} ${explanation}`, (t) => query.expectMatch(t, { path }));
			}
		});
		await test("Does not include:", async () => {
			for (const [path, explanation] of [
				["work/notes.md", '(missing "meeting")'],
				["meeting/notes.md", `(missing "work")`],
			]) {
				await test(`${path} ${explanation}`, (t) => query.expectDoesNotMatch(t, { path }));
			}
		});
	});

	await test("Regular Expressions", async () => {
		explain("Matches using a regular expression against the full path");
		await testQuery(`path:/^work/`, async (query) => {
			await test("Includes:", async () => {
				for (const [path, explanation] of [["work/notes.md", "(matches prefix)"]]) {
					await test(`${path} ${explanation}`, (t) => query.expectMatch(t, { path }));
				}
			});
			await test("Does not include:", async () => {
				for (const [path, explanation] of [["notes/work/notes.md", "(not at start)"]]) {
					await test(`${path} ${explanation}`, (t) =>
						query.expectDoesNotMatch(t, { path }));
				}
			});
		});

		await testQuery(`path:/[0-9]+/`, async (query) => {
			await test("Includes:", async () => {
				for (const [path, explanation] of [
					["2024/notes.md", ""],
					["notes-1.md", ""],
				]) {
					await test(`${path} ${explanation}`, (t) => query.expectMatch(t, { path }));
				}
			});
			await test("Does not include:", async () => {
				for (const [path, explanation] of [["work/notes.md", ""]]) {
					await test(`${path} ${explanation}`, (t) =>
						query.expectDoesNotMatch(t, { path }));
				}
			});
		});
	});

	await test("Empty Search", async () => {
		const query = prepareQuery(`path:`);
		await test("Matches nothing", async (t) => {
			// what would you EXPECT to match here?
			await query.expectDoesNotMatch(t, { path: "path.md" });
		});
	});

	await test("Combining Searches", async () => {
		await test("Multiple path filters", async () => {
			const query = prepareQuery(`path:work path:meeting`);
			explain("Both filters must match the path");

			await test("Includes:", async () => {
				for (const [path, explanation] of [
					["work/meeting.md", ""],
					["notes/work meeting.md", ""],
				]) {
					await test(`${path} ${explanation}`, (t) => query.expectMatch(t, { path }));
				}
			});
			await test("Does not include:", async () => {
				for (const [path, explanation] of [
					["work/notes.md", ""],
					["meeting/notes.md", ""],
				]) {
					await test(`${path} ${explanation}`, (t) =>
						query.expectDoesNotMatch(t, { path }));
				}
			});
		});

		await test("Mixing with general search", async () => {
			const query = prepareQuery(`path:work meeting`);
			explain("Combines path filtering with general search.");
			await test("Includes:", async () => {
				for (const [path, content, explanation] of [["work/notes.md", "meeting", ""]]) {
					await test(`${path} with content containing "meeting" ${explanation}`, (t) =>
						query.expectMatch(t, { path, content }));
				}
			});
			await test("Does not include:", async () => {
				for (const [path, content, explanation] of [["work/notes.md", "", ""]]) {
					await test(`${path} without "meeting" in content ${explanation}`, (t) =>
						query.expectDoesNotMatch(t, { path, content }));
				}
			});
		});
	});
};
