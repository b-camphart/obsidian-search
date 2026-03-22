import * as vitest from "vitest";
import * as filters from "./filters";
import { Parser } from "./parser";
import type * as obsidian from "obsidian";
import { StringFilter } from "./filters/strings";

const strings = filters.strings;

vitest.describe("parsing", (test) => {
	const parser = new Parser({ metadataCache: { getFileCache: (f) => null } });

	const tag = (matcher: StringFilter) => {
		return filters.file.tag(matcher, parser.metadataCache);
	};

	test("simple", (t) => {
		t.expect(parser.filterFromQuery("tag:word")).toEqual(tag(strings.basic("word")));
	});

	test("with hash", (t) => {
		t.expect(parser.filterFromQuery("tag:#word"), "should ignore '#' prefix").toEqual(
			tag(strings.basic("word")),
		);
	});

	test("negated", (t) => {
		t.expect(parser.filterFromQuery("-tag:word")).toEqual(
			filters.negate(tag(strings.basic("word"))),
		);
	});

	vitest.describe("subquery", (test) => {
		const expected_message = `Operator "tag" can only be followed by text`;
		for (const { name, query } of [
			{ name: "negated", query: `tag:-word` },
			{ name: "grouped", query: `tag:(some group)` },
			{ name: "phrase", query: `tag:"some phrase"` },
			{ name: "regex", query: `tag:/some regex/` },
		]) {
			test(name, (t) => {
				t.expect(() => parser.filterFromQuery(query)).toThrow(expected_message);
			});
		}
	});

	test("within group", (t) => {
		t.expect(parser.filterFromQuery(`(tag:word tag:other)`)).toEqual(
			filters.all(tag(strings.basic("word")), tag(strings.basic("other"))),
		);
	});
});

vitest.describe("filtering", (test) => {
	const file: obsidian.TFile = {} as any;

	test("no available cache", (t) => {
		const cache = null;
		const filter = new filters.file.Tags({
			matcher: strings.basic(""),
			metadataCache: { getFileCache: (f) => cache },
		});
		t.expect(filter.appliesTo(file)).toBeFalsy();
	});

	test("tag matches in frontmatter", (t) => {
		const cache = {
			frontmatter: {
				tags: ["foo"],
			},
		};
		const filter = new filters.file.Tags({
			matcher: strings.basic("foo"),
			metadataCache: { getFileCache: (f) => cache },
		});
		t.expect(filter.appliesTo(file)).toBeTruthy();
	});

	test("tag in inline tags", (t) => {
		const cache = {
			tags: [
				{
					tag: "foo",
					position: {
						start: {
							offset: 0,
							line: 0,
							col: 0,
						},
						end: {
							offset: 0,
							line: 0,
							col: 0,
						},
					},
				},
			],
		};
		const filter = new filters.file.Tags({
			matcher: strings.basic("foo"),
			metadataCache: { getFileCache: (f) => cache },
		});
		t.expect(filter.appliesTo(file)).toBeTruthy();
	});
});
