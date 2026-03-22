import * as vitest from "vitest";
import * as filters from "./filters";
import { Parser } from "./parser";

const strings = filters.strings;
const negate = filters.negate;
const path = filters.file.path;

vitest.describe("parsing", (test) => {
	const parser = new Parser({ metadataCache: { getFileCache: (f) => null } });

	test("simple", (t) => {
		t.expect(parser.filterFromQuery("path:word")).toEqual(path(strings.basic("word")));
	});

	test("negated", (t) => {
		t.expect(parser.filterFromQuery("-path:word")).toEqual(negate(path(strings.basic("word"))));
	});

	vitest.describe("subquery", (test) => {
		test("negated", (t) => {
			t.expect(parser.filterFromQuery("path:-word")).toEqual(
				path(negate(strings.basic("word"))),
			);
		});

		test("grouped", (t) => {
			t.expect(parser.filterFromQuery("path:(word other)")).toEqual(
				path(filters.all(strings.basic("word"), strings.basic("other"))),
			);
		});

		test("negated grouped subquery", (t) => {
			t.expect(parser.filterFromQuery("path:-(word other)")).toEqual(
				path(negate(filters.all(strings.basic("word"), strings.basic("other")))),
			);
		});

		for (const keyword of ["file", "path"]) {
			test(`nested "${keyword}" operator`, (t) => {
				t.expect(() => parser.filterFromQuery(`path:${keyword}:`)).toThrow(
					`Operator "${keyword}" cannot be nested within "path"`,
				);
			});
		}
	});

	test("within group", (t) => {
		t.expect(parser.filterFromQuery(`(path:word path:other)`)).toEqual(
			filters.all(path(strings.basic("word")), path(strings.basic("other"))),
		);
	});
});
