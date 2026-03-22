import assert from "assert";
import { test } from "node:test";

import { Parser } from "src/parser";
import * as filters from "src/filters";

test("Parsing file operator", async () => {
	const parser = new Parser({ metadataCache: { getFileCache: () => null } });

	await test(`single word`, () => {
		assert.deepEqual(
			parser.filterFromQuery("file:work"),
			filters.file.name(filters.strings.basic("work")),
		);
	});

	await test("phrase", () => {
		assert.deepEqual(
			parser.filterFromQuery(`file:"work meeting"`),
			filters.file.name(filters.strings.quoted("work meeting")),
		);
	});

	await test("regex", () => {
		assert.deepEqual(
			parser.filterFromQuery(`file:/[0-9]+/`),
			filters.file.name(filters.strings.regex(/[0-9]+/)),
		);
	});

	await test("negated word", () => {
		assert.deepEqual(
			parser.filterFromQuery(`file:-work`),
			filters.file.name(filters.negate(filters.strings.basic("work"))),
		);
	});

	await test("negated", () => {
		assert.deepEqual(
			parser.filterFromQuery(`-file:work`),
			filters.negate(filters.file.name(filters.strings.basic("work"))),
		);
	});

	await test("group", () => {
		assert.deepEqual(
			parser.filterFromQuery(`file:(work meeting)`),
			filters.file.name(filters.strings.basic("work").and(filters.strings.basic("meeting"))),
		);
	});
});
