import * as vitest from "vitest";
import * as filters from "./filters";
import { Parser } from "./parser";

const strings = filters.strings;

const file = filters.file.name;
const negate = filters.negate;

vitest.describe("parsing", (test) => {
	const parser = new Parser({ metadataCache: { getFileCache: (f) => null } });

	test("simple", (t) => {
		t.expect(parser.filterFromQuery("file:word")).toEqual(file(strings.basic("word")));
	});

	test("negated", (t) => {
		t.expect(parser.filterFromQuery("-file:word")).toEqual(negate(file(strings.basic("word"))));
	});

	vitest.describe("subquery", (test) => {
		test("negated", (t) => {
			t.expect(parser.filterFromQuery("file:-word")).toEqual(
				file(negate(strings.basic("word"))),
			);
		});

		test("grouped", (t) => {
			t.expect(parser.filterFromQuery("file:(word other)")).toEqual(
				file(strings.basic("(word other)")),
			);
		});

		test("nested", (t) => {
			t.expect(() => parser.filterFromQuery("file:file:")).toThrow(
				`Operator "file" cannot be nested within "file"`,
			);
		});
	});

	test("within group", (t) => {
		t.expect(parser.filterFromQuery(`(file:word file:other)`)).toEqual(
			filters.all(file(strings.basic("word")), file(strings.basic("other"))),
		);
	});
});

vitest.describe("filtering", (test) => {
	test("mulitple matchers", (t) => {
		const filter = file(strings.basic("(some thing)"));
		t.expect(filter.appliesTo({ basename: "(some thing).md" } as any)).toBe(true);
		/*
		const matching_files = [
			{ path: "(some thing).md", content: '' },
		];
		const non_matching_files = [
			{ path: "some/thing.md", content: '' },
			{ path: "thing/some.md", content: '' },
			{ path: "some.md", content: '' },
			{ path: "thing.md", content: '' },
			{ path: "(some.md", content: 'thing)' },
		]
		*/
	});
});
