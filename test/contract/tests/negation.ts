import * as testing from "../../framework";
import type { Files } from "../../testing/files"
import type { Search } from "../../testing/search"

export default function testNegation<File>(run: testing.Test, obsidian: Files<File>, search: Search) {
	run.test("not word", async t => {
		const file = await obsidian.createFile("has word.md", "word");
		t.after(() => obsidian.deleteFile(file));

		const matches = await search.searchFor(`-word`)

		if (matches.some(it => it.name === "has word.md")) {
			t.failWith("file with word should NOT match because it was negated")
		}
	})
}
