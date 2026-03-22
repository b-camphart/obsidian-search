import * as vitest from "vitest";
import * as filters from "./filters";
import { Parser } from "./parser";

const strings = filters.strings;
function filter(s: string) {
	return filters.file.content(strings.basic(s));
}

vitest.describe("parsing", (test) => {
	const parser = new Parser({ metadataCache: { getFileCache: (f) => null } });

	test("negating a word", (t) => {
		t.expect(parser.filterFromQuery("-word")).toEqual(filters.async.negate(filter("word")));
	});

	test("negating two words", (t) => {
		t.expect(parser.filterFromQuery("-word -other")).toEqual(
			filters.async.all(filter("word").negated(), filter("other").negated()),
		);
	});

	test("negating a phrase", (t) => {
		t.expect(parser.filterFromQuery(`-"some phrase"`)).toEqual(
			filters.async.negate(filters.file.content(strings.quoted("some phrase"))),
		);
	});

	test("negating a regex", (t) => {
		t.expect(parser.filterFromQuery(`-/some regex/`)).toEqual(
			filters.file.content(strings.regex(/some regex/)).negated(),
		);
	});
});
