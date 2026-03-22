import * as vitest from "vitest";
import * as filters from "./filters";
import { Parser } from "./parser";

const strings = filters.strings;

vitest.describe("parsing", (test) => {
	const parser = new Parser({ metadataCache: { getFileCache: (f) => null } });

	test("simple group", (t) => {
		t.expect(parser.filterFromQuery("(hello world)")).toEqual(
			filters.file
				.content(filters.strings.basic("hello"))
				.and(filters.file.content(filters.strings.basic("world"))),
		);
	});
	test("nested group", (t) => {
		t.expect(parser.filterFromQuery("((hello world))")).toEqual(
			filters.file
				.content(strings.basic("hello"))
				.and(filters.file.content(strings.basic("world"))),
		);
	});
	test("negated group", (t) => {
		t.expect(parser.filterFromQuery("-(hello world)")).toEqual(
			filters.file
				.content(strings.basic("hello"))
				.and(filters.file.content(strings.basic("world")))
				.negated(),
		);
	});
	test("group after OR", (t) => {
		t.expect(parser.filterFromQuery("word OR (other thing)")).toEqual(
			filters.file
				.content(strings.basic("word"))
				.or(
					filters.file
						.content(strings.basic("other"))
						.and(filters.file.content(strings.basic("thing"))),
				),
		);
	});
	test("group before OR", (t) => {
		t.expect(parser.filterFromQuery("(some thing) OR other")).toEqual(
			filters.file
				.content(strings.basic("some"))
				.and(filters.file.content(strings.basic("thing")))
				.or(filters.file.content(strings.basic("other"))),
		);
	});

	test("group containing negation", (t) => {
		t.expect(parser.filterFromQuery(`(-some thing)`)).toEqual(
			filters.file
				.content(strings.basic("some"))
				.negated()
				.and(filters.file.content(strings.basic("thing"))),
		);
	});
});
