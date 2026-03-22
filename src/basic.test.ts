import * as vitest from "vitest";
import * as filters from "./filters";
import { Parser } from "./parser";

const file = filters.file;
const strings = filters.strings;
const async = filters.async;

vitest.describe("parsing", (test) => {
	const parser = new Parser({ metadataCache: { getFileCache: (f) => null } });

	test("single word", (t) => {
		t.expect(parser.filterFromQuery("work")).toEqual(file.content(strings.basic("work")));
	});
	test("two words", (t) => {
		t.expect(parser.filterFromQuery("work meeting")).toEqual(
			async.all(file.content(strings.basic("work")), file.content(strings.basic("meeting"))),
		);
	});

	vitest.describe("quote", (test) => {
		test("phrase", (t) => {
			t.expect(parser.filterFromQuery(`"work"`)).toEqual(
				file.content(strings.quoted("work")),
			);
		});
		test("phrase with space", (t) => {
			t.expect(parser.filterFromQuery(`"work meeting"`)).toEqual(
				file.content(strings.quoted("work meeting")),
			);
		});
		test("phrase with escaped quotes", (t) => {
			t.expect(parser.filterFromQuery(`"meeting for \\"work\\" and stuff"`)).toEqual(
				file.content(strings.quoted(`meeting for "work" and stuff`)),
			);
		});
		test("unclosed phrase", (t) => {
			t.expect(parser.filterFromQuery(`"meeting`)).toEqual(
				file.content(strings.quoted(`meeting`)),
			);
		});
		test("multiple phrases", (t) => {
			t.expect(parser.filterFromQuery(`"meeting" "work"`)).toEqual(
				async.all(
					file.content(strings.quoted("meeting")),
					file.content(strings.quoted("work")),
				),
			);
		});
		test("quote next to word without space", async (t) => {
			// edge case
			t.expect(parser.filterFromQuery(`word"phrase"`)).toEqual(
				file.content(strings.basic(`word"phrase"`)),
			);
		});
	});

	vitest.describe("regex", (test) => {
		test("regex", (t) => {
			t.expect(parser.filterFromQuery(`/work/`)).toEqual(file.content(strings.regex(/work/)));
		});
		test("regex with space", (t) => {
			t.expect(parser.filterFromQuery(`/work meeting/`)).toEqual(
				file.content(strings.regex(/work meeting/)),
			);
		});
		test("unclosed regex", (t) => {
			t.expect(parser.filterFromQuery(`/meeting`)).toEqual(
				file.content(strings.regex(/meeting/)),
			);
		});
		test("phrase with escaped slash", (t) => {
			t.expect(parser.filterFromQuery(`/with \\/regex\\/ found/`)).toEqual(
				file.content(strings.regex(/with \/regex\/ found/)),
			);
			t.expect(parser.filterFromQuery(`/with \\b special/`)).toEqual(
				file.content(strings.regex(/with \b special/)),
			);
			t.expect(parser.filterFromQuery(`/with \\\\b special/`)).toEqual(
				file.content(strings.regex(/with \\b special/)),
			);
		});
	});
});

vitest.describe("filtering", (test) => {
	test("two words", async (t) => {
		const filter = file
			.content(strings.basic("work"))
			.and(file.content(strings.basic("meeting")));

		t.expect(
			await filter.appliesTo({
				vault: {
					cachedRead: () => Promise.resolve("work meeting"),
				},
			} as any),
		).toBeTruthy();

		t.expect(
			await filter.appliesTo({
				vault: {
					cachedRead: () => Promise.resolve("work"),
				},
			} as any),
		).toEqual(false);
	});
});
