import { test } from "node:test";
import { Parser } from "src/parser";
import assert from "assert";
import * as filters from "src/filters";

test("Parsing two grouped words", async () => {
	const metadataCache = {
		getFileCache: () => null,
	};

	const filter = new Parser({
		metadataCache,
	}).filterFromQuery("work meeting");

	assert.deepEqual(
		filter,
		filters.async.all(
			filters.file.fuzzy({ string: "work" }),
			filters.file.fuzzy({ string: "meeting" }),
		),
	);
});

test("Parsing three grouped words", async () => {
	const metadataCache = {
		getFileCache: () => null,
	};

	const filter = new Parser({
		metadataCache,
	}).filterFromQuery("work meeting notes");

	assert.deepEqual(
		filter,
		filters.async.all(
			filters.file.fuzzy({ string: "work" }),
			filters.file.fuzzy({ string: "meeting" }),
			filters.file.fuzzy({ string: "notes" }),
		),
	);
});

test("Parsing group in parenthesis", async (t) => {
	const metadataCache = {
		getFileCache: () => null,
	};

	const filter = new Parser({
		metadataCache,
	}).filterFromQuery("(work meeting) notes");

	assert.deepEqual(
		filter,
		filters.async.all(
			filters.async.all(
				filters.file.fuzzy({ string: "work" }),
				filters.file.fuzzy({ string: "meeting" }),
			),
			filters.file.fuzzy({ string: "notes" }),
		),
	);
});

test("Parsing word and quote with no space (edge case)", () => {
	const metadataCache = {
		getFileCache: () => null,
	};

	const filter = new Parser({
		metadataCache,
	}).filterFromQuery(`work"meeting"`);

	assert.deepEqual(filter, filters.file.fuzzy({ string: `work"meeting"` }));
});
