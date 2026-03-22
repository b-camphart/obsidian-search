import { test } from "node:test";
import { Parser } from "src/parser";
import assert from "assert";
import * as filters from "src/filters";

test("Parsing a single word", async (t) => {
	const metadataCache = {
		getFileCache: () => null,
	};

	const filter = new Parser({
		metadataCache,
	}).filterFromQuery("work");

	assert.deepEqual(filter, filters.file.fuzzy({ string: "work" }));
});
