import * as testing from "../../framework";
import type { Files } from "../../testing/files"
import type { Search } from "../../testing/search"

export default function testFileOperator<File>(
	t: testing.Test,
	files: Files<File>,
	search: Search,
) {
	async function pathTest(t: testing.Test, query: string,
		expected: Array<{ path: string, content?: string }>,
		unexpected: Array<{ path: string, content?: string }>,
	) {
		t.log({ query });

		const expected_matches: Array<{ path: string, file: File }> = [];
		for (let i = 0; i < expected.length; i++) {
			const { path, content } = expected[i];
			const file = await files.createFile(path, content)
			t.after(() => files.deleteFile(file));
			expected_matches.push({ path, file });
		}
		const unexpected_matches: Array<{ path: string, file: File }> = [];
		for (let i = 0; i < unexpected.length; i++) {
			const { path, content } = unexpected[i];
			const file = await files.createFile(path, content)
			t.after(() => files.deleteFile(file));
			unexpected_matches.push({ path, file });
		}

		const matches = await search.searchFor(query);
		t.log({ matches })

		for (const { path, file } of expected_matches) {
			if (!matches.some(it => it.path === path)) {
				t.failWith(`did not find ${path} in matches`)
				t.log("    content:", await files.readFile(file))
			}
		}

		for (const { path } of unexpected_matches) {
			if (matches.some(it => it.path === path)) {
				t.failWith(`expected NOT to find ${path} in matches`)
			}
		}
		return matches;
	}
	t.test("path keyword", async t => {
		await pathTest(t, "path:test",
			// expected matches
			[
				{ path: "dir/test.md" },
				{ path: "dir/test1.md" },
				{ path: "test/foo.md" },
				{ path: "test1/foo.md" },
			],
			// unexpected matches
			[
				{ path: "dir/tes.md" },
			]);
	})

	t.test("nesting operator within operator", async (t: testing.Test) => {
		await pathTest(t, "path:path:",
			// expected matches
			[],
			// unexpected matches
			[
				{ path: "path.md" },
				{ path: "path/path.md" },
			]);

		const expected_message = `Operator "path" cannot be nested within "path"`
		const logged_err = t.logs.findLast(it => it.args.some(it => it.includes(expected_message)));

		if (!logged_err) {
			t.failNowWith("should have logged an error")
		}
	})

	t.test("path keyword with additional query", async t => {
		await pathTest(t, "path:test something",
			// expected matches
			[
				{ path: "dir/test.md", content: "something" },
				{ path: "dir/tested.md", content: "something" },
				{ path: "test/foo.md", content: "something" },
				{ path: "testing/foo.md", content: "something" },
			],
			// unexpected matches
			[
				{ path: "dir/test1.md", content: "" },
				{ path: "dir/test2.md", content: "" },
				{ path: "test1/foo.md", content: "" },
				{ path: "test2/foo.md", content: "" },
				{ path: "tes/foo.md", content: "something" },
			]);
	})

	t.test("negate within subquery", async t => {
		const test_file = await files.createFile("test.md");
		t.after(() => files.deleteFile(test_file))

		const other_file = await files.createFile("other.md");
		t.after(() => files.deleteFile(other_file))

		const query = `path:-test`;
		t.log({ query });
		const matches = await search.searchFor(query);
		t.log({ matches })

		if (!matches.some(it => it.name === "other.md")) {
			t.failWith(`expected to find file "other.md"`)
		}
		if (matches.some(it => it.name === "test.md")) {
			t.failWith(`should NOT have matched "test.md"`)
		}
	})

	t.test("group within subquery", async t => {
		const query = `path:(some thing)`;
		// behaves like an AND.  Files with both "some" and "thing" are included in the results
		const matching_files = [
			{ path: "(some thing).md", content: '' },
			{ path: "some/thing.md", content: '' },
			{ path: "thing/some.md", content: '' },
		];
		const non_matching_files = [
			{ path: "some.md", content: '' },
			{ path: "thing.md", content: '' },
			{ path: "(some.md", content: 'thing)' },
		]
		for (const { path, content } of [...non_matching_files, ...matching_files]) {
			const file = await files.createFile(path, content);
			t.after(() => files.deleteFile(file))
		}

		t.log({ query });
		const matches = await search.searchFor(query);
		t.log({ matches })

		for (const { path, content } of matching_files) {
			if (!matches.some(it => it.path === path)) {
				t.failWith(`expected to match file with path "${path}" and content: ${content}`)
			}
		}

		for (const { path, content } of non_matching_files) {
			if (matches.some(it => it.path === path)) {
				t.failWith(`expected NOT have matched file with path "${path}" and content: ${content}`)
			}
		}
	})

	t.test("negated group within subquery", async t => {
		const query = `path:-(some thing)`;
		const matching_files = [
			{ path: "some.md", content: '' },
			{ path: "thing.md", content: '' },
			{ path: "(some.md", content: 'thing)' },
		]
		const non_matching_files = [
			{ path: "some/thing.md", content: '' },
			{ path: "thing/some.md", content: '' },
			{ path: "(some thing).md", content: '' },
		];
		for (const { path, content } of [...matching_files, ...non_matching_files]) {
			const file = await files.createFile(path, content);
			t.after(() => files.deleteFile(file))
		}

		t.log({ query });
		const matches = await search.searchFor(query);
		t.log({ matches })

		for (const { path, content } of matching_files) {
			if (!matches.some(it => it.path === path)) {
				t.failWith(`expected to match file with path "${path}" and content: ${content}`)
			}
		}

		for (const { path, content } of non_matching_files) {
			if (matches.some(it => it.path === path)) {
				t.failWith(`expected NOT have matched file with path "${path}" and content: ${content}`)
			}
		}
	})

	t.test("path:", async t => {
		const matching_file = await files.createFile("dir/test.md");
		t.after(() => files.deleteFile(matching_file));

		const file_in_dir = await files.createFile("test/foo.md");
		t.after(() => files.deleteFile(file_in_dir));

		const matches = await search.searchFor("path:test")

		if (!matches.some(match => match.name === "test.md")) {
			t.failWith("did not match file name")
		}
		if (!matches.some(match => match.name === "foo.md")) {
			t.failWith("did not match directory name")
		}
	})
}
