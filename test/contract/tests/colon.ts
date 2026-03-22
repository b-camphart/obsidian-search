import * as testing from "../../framework";
import type { Files } from "../../testing/files"
import type { Search } from "../../testing/search"

export default function testFileOperator<File>(
	t: testing.Test,
	files: Files<File>,
	search: Search,
) {
	t.test("non-keyword", async t => {
		const file = await files.createFile("test.md", `keyword:foo`)
		t.after(() => files.deleteFile(file))

		const query = "keyword:foo";
		t.log({ query })
		const matches = await search.searchFor(query);
		const expected_message = `Operator "keyword" not recognized`;
		const logged_err = t.logs.findLast(it => it.args.some(it => it.includes(expected_message)));
		t.log({ matches });

		if (!logged_err) {
			t.failWith("should have logged an error")
		}

		if (matches.length !== 0) {
			t.failWith("should not have found any matches")
		}
	})
}
