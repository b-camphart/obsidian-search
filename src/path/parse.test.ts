import { test } from "node:test";
import { file, strings } from "src/filters";
import { AsyncFileFilter, FileFilter } from "src/filters/FileFilter";
import { path } from "src/filters/FilePathFilter";
import { Parser } from "src/parser";

test("Parsing 'path:' keyword", async () => {
	const parser = new Parser({ metadataCache: { getFileCache: () => null } });
	function expectParsed(query: string, expected: FileFilter | AsyncFileFilter) {
		return test(query, (t) => {
			t.assert.deepEqual(parser.filterFromQuery(query), expected);
		});
	}

	await expectParsed(`path:work`, path(strings.basic("work")));
	await expectParsed(`PATH:work`, path(strings.basic("work")));
	await expectParsed(`path:WORK`, path(strings.basic("WORK")));
	await expectParsed(`path:"work meeting"`, path(strings.quoted("work meeting")));
	await expectParsed(`path:"work/"`, path(strings.quoted("work/")));
	await expectParsed(`path:"work (old)"`, path(strings.quoted("work (old)")));
	await expectParsed(`path:"Work"`, path(strings.quoted("Work")));
	await expectParsed(`-path:work`, path(strings.basic("work")).negated());
	await expectParsed(`path:-work`, path(strings.basic("work").negated()));
	await expectParsed(
		`path:(work meeting)`,
		path(strings.basic("work").and(strings.basic("meeting"))),
	);
	await expectParsed(`path:/^work/`, path(strings.regex(/^work/)));
	await expectParsed(`path:/[0-9]+/`, path(strings.regex(/[0-9]+/)));
	await expectParsed(`path:`, path(strings.basic("")));
	await expectParsed(
		`path:work path:meeting`,
		path(strings.basic("work")).and(path(strings.basic("meeting"))),
	);
	await expectParsed(
		`path:work meeting`,
		path(strings.basic("work"))
			.async()
			.and(file.fuzzy({ string: "meeting" })),
	);
});
