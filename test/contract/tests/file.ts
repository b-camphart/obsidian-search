import * as testing from "../../framework";
import type { Files } from "../../testing/files"
import type { Search } from "../../testing/search"

export default function testFileOperator<File>(
	t: testing.Test,
	files: Files<File>,
	search: Search,
) {
	t.test("file keyword", async t => {
		const query = "file:test";
		const matching_files = [
			{ path: "dir/test.md", content: "" },
		];
		const non_matching_files = [
			{ path: "test/foo.md", content: "" },
		]
		for (const { path, content } of [...matching_files, ...non_matching_files]) {
			const file = await files.createFile(path, content);
			t.after(() => files.deleteFile(file));
		}

		t.log({ query })
		const matches = await search.searchFor(query)
		t.log({ matches })

		for (const { path, } of matching_files) {
			if (!matches.some(it => it.path === path)) {
				t.failWith(`expected to match file with path "${path}"`)
			}
		}

		for (const { path, } of non_matching_files) {
			if (matches.some(it => it.path === path)) {
				t.failWith(`expected NOT to have matched file with path "${path}"`)
			}
		}
	})

	t.test("nesting operator within operator", async (t: testing.Test) => {
		const query = "file:file:"
		const file_list = [
			{ path: "file.md", content: "" },
		];
		for (const { path, content } of file_list) {
			const file = await files.createFile(path, content);
			t.after(() => files.deleteFile(file))
		}

		t.log({ query })
		const matches = await search.searchFor(query)
		const expected_message = `Operator "file" cannot be nested within "file"`
		const logged_err = t.logs.findLast(it => it.args.some(it => it.includes(expected_message)));
		t.log({ matches })

		if (matches.length !== 0) {
			t.failWith("should not have found any matches")
		}
		if (!logged_err) {
			t.failNowWith("should have logged an error")
		}

	})

	t.test("file keyword with additional query", async t => {
		const query = "file:test something";
		const matching_files = [
			{ path: "dir/test.md", content: "something" },
		];
		const non_matching_files = [
			{ path: "dir1/test.md", content: "" },
			{ path: "test/foo.md", content: "" },
		]
		for (const { path, content } of [...matching_files, ...non_matching_files]) {
			const file = await files.createFile(path, content);
			t.after(() => files.deleteFile(file));
		}

		t.log({ query })
		const matches = await search.searchFor(query)
		t.log({ matches })

		for (const { path, content } of matching_files) {
			if (!matches.some(it => it.path === path)) {
				t.failWith(`expected to match file with path "${path}" and content: ${content}`)
			}
		}

		for (const { path, content } of non_matching_files) {
			if (matches.some(it => it.path === path)) {
				t.failWith(`expected NOT to have matched file with path "${path}" and content: ${content}`)
			}
		}
	})

	t.test("negate within subquery", async t => {
		const test_file = await files.createFile("test.md");
		t.after(() => files.deleteFile(test_file))

		const other_file = await files.createFile("other.md");
		t.after(() => files.deleteFile(other_file))

		const query = `file:-test`;
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
		const query = `file:(some thing)`;
		// group is treated almost like a phrase.  The space does not end the subquery like `file:some thing` would
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
		const query = `file:-(some thing)`;
		// group is treated almost like a phrase.  The space does not end the subquery like `file:some thing` would
		const matching_files = [
			{ path: "some/thing.md", content: '' },
			{ path: "thing/some.md", content: '' },
			{ path: "some.md", content: '' },
			{ path: "thing.md", content: '' },
			{ path: "(some.md", content: 'thing)' },
		]
		const non_matching_files = [
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
