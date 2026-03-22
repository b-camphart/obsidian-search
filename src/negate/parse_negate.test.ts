import { test } from "node:test";
import { Parser } from "src/parser";
import assert from "assert";
import * as filters from "src/filters";
import { inspect } from "util";

const metadataCache = {
	getFileCache: () => null,
};
const parser = new Parser({
	metadataCache,
});

test("Parsing a negated word", async (t) => {
	const filter = parser.filterFromQuery("-work");

	assert.deepEqual(filter, filters.async.negate(filters.file.fuzzy({ string: "work" })));
});

test("Parsing a negated phrase", async (t) => {
	const filter = parser.filterFromQuery(`-"work meeting"`);

	assert.deepEqual(
		filter,
		filters.async.negate(filters.file.fuzzy({ string: "work meeting", exact: true })),

		`expected ${inspect(filter)} to deeply equal ${inspect(
			filters.async.negate(filters.file.fuzzy({ string: "work meeting", exact: true })),
		)}`,
	);
});

test("Parsing partial negation", async () => {
	await test("first word", () => {
		assert.deepEqual(
			parser.filterFromQuery(`-work meeting`),
			filters.async.all(
				filters.async.negate(filters.file.fuzzy({ string: "work" })),
				filters.file.fuzzy({ string: "meeting" }),
			),
		);
	});
	await test("second word", () => {
		assert.deepEqual(
			parser.filterFromQuery(`work -meeting`),
			filters.async.all(
				filters.file.fuzzy({ string: "work" }),
				filters.async.negate(filters.file.fuzzy({ string: "meeting" })),
			),
		);
	});
});
