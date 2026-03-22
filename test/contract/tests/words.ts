import * as testing from "../../framework";
import { Files } from "../../testing/files";
import { Search } from "../../testing/search";

export default function <File>(t: testing.Test, files: Files<File>, search: Search) {
	t.test("word in body", async (t) => {
		const file_with_match = await files.createFile("test.md", "foo");
		t.after(() => files.deleteFile(file_with_match));

		const file_without_match = await files.createFile("test1.md");
		t.after(() => files.deleteFile(file_without_match));

		const matches = await search.searchFor("foo")

		if (!matches.some(match => match.name === "test.md")) {
			t.log("expected to find 'test.md' in matches", matches);
			t.fail();
		}
		if (matches.some(match => match.name === "test1.md")) {
			t.log("expected NOT to find 'test1.md' in matches", matches);
			t.fail();
		}
	})

	t.test("phrase in body", async (t) => {
		const file_with_match = await files.createFile("test.md", "foo bar");
		t.after(() => files.deleteFile(file_with_match));

		const file_without_match = await files.createFile("test1.md", "foo");
		t.after(() => files.deleteFile(file_without_match));

		const matches = await search.searchFor(`"foo bar"`)

		if (!matches.some(match => match.name === "test.md")) {
			t.failWith("expected to find 'test.md' in", matches)
		}
		if (matches.some(match => match.name === "test1.md")) {
			t.failWith("expected NOT to find 'test1.md' in", matches)
		}
	})

	t.test("unclosed phrase", async t => {
		const file_with_match = await files.createFile("test.md", "foo bar");
		t.after(() => files.deleteFile(file_with_match));

		const file_without_match = await files.createFile("test1.md", "foo");
		t.after(() => files.deleteFile(file_without_match));

		const matches = await search.searchFor(`"foo bar`)

		if (!matches.some(match => match.name === "test.md")) {
			t.failWith("expected to find 'test.md' in", matches)
		}
		if (matches.some(match => match.name === "test1.md")) {
			t.failWith("expected NOT to find 'test1.md' in", matches)
		}
	})

	t.test("phrase start next to word", async t => {
		const file_without_quotes = await files.createFile("test.md", `foo bar`);
		t.after(() => files.deleteFile(file_without_quotes))
		const file_with_quotes = await files.createFile("test1.md", `foo"bar"`);
		t.after(() => files.deleteFile(file_with_quotes))

		const query = `foo"bar"`
		t.log({ query })
		const matches = await search.searchFor(`foo"bar"`);
		t.log({ matches })

		t.log("without space before start of quote, query should be treated like a 'word'")
		if (matches.some(it => it.name === "test.md")) {
			t.failWith("should not have found file without exact match to query, but found: ", await files.readFile(file_without_quotes))
		}
		if (!matches.some(it => it.name === "test1.md")) {
			t.failWith("should have found file with exact match to query")
		}
	})
}
