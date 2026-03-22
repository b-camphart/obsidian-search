import assert from "assert";
import { test } from "node:test";
import { async, file } from "src/filters";
import { AsyncFileFilter, FileFilter } from "src/filters/FileFilter";
import { Parser } from "src/parser";
import { testLogger } from "src/testLogger";

await test("Parsing OR keyword", async () => {
	const parser = new Parser({ metadataCache: { getFileCache: () => null } });

	function testQuery(
		query: string,
		expectedFilter: AsyncFileFilter | FileFilter,
		options?: { log?: boolean } = {},
	) {
		const { log = false } = options;
		return test(query, (t) => {
			assert.deepEqual(
				parser.filterFromQuery(query, log ? testLogger(t) : undefined),
				expectedFilter,
			);
		});
	}

	for (const first of [
		{ type: "word", query: `work`, filter: file.fuzzy({ string: "work" }) },
		{
			type: "phrase",
			query: `"work meeting"`,
			filter: file.fuzzy({ string: "work meeting", exact: true }),
		},
		{ type: "regex", query: `/[0-9]/`, filter: file.fuzzy({ regex: /[0-9]/ }) },
	]) {
		for (const second of [
			{ type: "word", query: `play`, filter: file.fuzzy({ string: "play" }) },
			{
				type: "phrase",
				query: `"group outing"`,
				filter: file.fuzzy({ string: "group outing", exact: true }),
			},
			{ type: "regex", query: `/[a-zA-Z]/`, filter: file.fuzzy({ regex: /[a-zA-Z]/ }) },
		]) {
			await test(`${first.type} OR ${second.type}`, async () => {
				await testQuery(
					`${first.query} OR ${second.query}`,
					async.any(first.filter, second.filter),
				);
			});
		}
	}

	await test("case sensitivity", async () => {
		await testQuery(
			`work or play`,
			async.all(
				file.fuzzy({ string: "work" }),
				file.fuzzy({ string: "or" }),
				file.fuzzy({ string: "play" }),
			),
		);
	});

	await test("OR has lower precedence than implicit AND", async () => {
		await testQuery(
			`fun work OR play`,
			async.any(
				async.all(file.fuzzy({ string: "fun" }), file.fuzzy({ string: "work" })),
				file.fuzzy({ string: "play" }),
			),
		);
		await testQuery(
			`work OR play meeting`,
			async.any(
				file.fuzzy({ string: "work" }),
				async.all(file.fuzzy({ string: "play" }), file.fuzzy({ string: "meeting" })),
			),
		);
	});

	await test("incomplete query", async () => {
		await testQuery(`work OR`, file.fuzzy({ string: "work" }), { log: true });
	});
});
