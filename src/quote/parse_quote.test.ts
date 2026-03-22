import { test } from "node:test";
import { Parser } from "src/parser";
import assert from "assert";
import * as filters from "src/filters";

const parser = new Parser({ metadataCache: { getFileCache: () => null } });

test("Parsing a quote", async () => {
	const filter = parser.filterFromQuery(`"hello world"`);

	assert.deepEqual(filter, filters.file.fuzzy({ string: "hello world", exact: true }));
});

test("Parsing an escaped quote", async () => {
	const filter = parser.filterFromQuery(`"he said \\"yes,\\" and left"`);

	assert.deepEqual(
		filter,
		filters.file.fuzzy({ string: `he said "yes," and left`, exact: true }),
	);
});

test("Parsing an unclosed quote", async () => {
	const filter = parser.filterFromQuery(`"hello world`);

	assert.deepEqual(filter, filters.file.fuzzy({ string: `hello world`, exact: true }));
});
