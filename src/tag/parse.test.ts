import { test } from "node:test";
import { file, invalid } from "src/filters";
import { AsyncFileFilter, FileFilter } from "src/filters/FileFilter";
import { tag as makeTagFilter } from "src/filters/FileTagsFilter";
import { Parser } from "src/parser";

test("Parsing the 'tag:' operator", async () => {
	const metadataCache = { getFileCache: () => null };
	const parser = new Parser({ metadataCache });
	function expectParsed(query: string, expected: FileFilter | AsyncFileFilter) {
		return test(query, (t) => {
			t.assert.deepEqual(parser.filterFromQuery(query), expected);
		});
	}

	function tag(word: string) {
		return makeTagFilter(word, metadataCache);
	}

	await expectParsed(`tag:work`, tag("work"));
	await expectParsed(`tag:#work`, tag("work"));
	await expectParsed(`TAG:work`, tag("work"));
	await expectParsed(`tag:WORK`, tag("WORK"));
	await expectParsed(`tag:"work"`, invalid);
	await expectParsed(`-tag:work`, tag("work").negated());
	await expectParsed(`tag:-work`, invalid);
	await expectParsed(`tag:(work meeting)`, invalid);
	await expectParsed(`tag:/^work/`, invalid);
	await expectParsed(`tag:/[0-9]+/`, invalid);
	await expectParsed(`tag:`, tag(""));
	await expectParsed(`tag:work tag:meeting`, tag("work").and(tag("meeting")));
	await expectParsed(
		`tag:work meeting`,
		tag("work")
			.async()
			.and(file.fuzzy({ string: "meeting" })),
	);
});
