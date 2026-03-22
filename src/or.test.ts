import * as vitest from "vitest";
import * as filters from "./filters";
import { Parser } from "./parser";

const strings = filters.strings;
function basic(s: string) {
	return filters.file.content(strings.basic(s));
}

vitest.describe("parsing", (test) => {
	const parser = new Parser({ metadataCache: { getFileCache: (f) => null } });

	test("OR between two words", (t) => {
		t.expect(parser.filterFromQuery(`word OR other`)).toEqual(
			filters.async.any(basic("word"), basic("other")),
		);
	});
	test("OR on its own", (t) => {
		t.expect(parser.filterFromQuery(`OR`)).toEqual(filters.invalid);
	});
	test("negated OR", (t) => {
		t.expect(parser.filterFromQuery("-OR")).toEqual(filters.invalid);
	});
	test("negated OR between two words", (t) => {
		t.expect(parser.filterFromQuery(`word -OR other`)).toEqual(filters.invalid);
	});
	test("chained OR", (t) => {
		t.expect(parser.filterFromQuery(`word OR other OR third`)).toEqual(
			filters.async.any(basic("word"), basic("other"), basic("third")),
		);
	});
});
