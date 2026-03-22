
import * as testing from "../../framework";
import type { Files } from "../../testing/files"
import type { Search } from "../../testing/search"

export default function testAnd<File>(run: testing.Test, obsidian: Files<File>, search: Search) {
	run.test("implicit", async t => {
		const file = await obsidian.createFile("test.md", `one two three`);
		t.after(() => obsidian.deleteFile(file))

		const file_with_only_one = await obsidian.createFile("test1.md", "one");
		t.after(() => obsidian.deleteFile(file_with_only_one))

		const query = "one three"
		t.log({ query })
		const matches = await search.searchFor(query)
		t.log({ matches })

		if (!matches.some(it => it.name === "test.md")) {
			t.failWith("expected to find 'test.md' in matches")
			t.log("    content:", await obsidian.readFile(file))
		}
		if (matches.some(it => it.name === "test1.md")) {
			t.failWith("'test1.md' only has 'one' in its body, but was in")
		}
	})

	run.test("explicit 'AND' is not recognized", async t => {
		const file = await obsidian.createFile("test.md", `one two three AND`);
		t.after(() => obsidian.deleteFile(file))

		const file_with_only_one = await obsidian.createFile("test1.md", "one three");
		t.after(() => obsidian.deleteFile(file_with_only_one))

		const query = "one AND three"
		t.log("query:", query)
		const matches = await search.searchFor(query)
		t.log("matches:", matches)

		if (!matches.some(it => it.name === "test.md")) {
			t.failWith(`file containing 'one', 'AND', and 'three' should have matched`)
		}
		if (matches.some(it => it.name === "test1.md")) {
			t.failWith(`file containing only 'one' and 'three' should NOT have matched`)
		}
	})
}
