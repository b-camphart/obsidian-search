
import * as testing from "../../framework";
import type { Files } from "../../testing/files"
import type { Search } from "../../testing/search"

export default function testOr<File>(run: testing.Test, obsidian: Files<File>, search: Search) {
	run.test("basic usage", async t => {
		const match1 = await obsidian.createFile("match1.md", "value1")
		t.after(() => obsidian.deleteFile(match1))
		const match2 = await obsidian.createFile("match2.md", "value2")
		t.after(() => obsidian.deleteFile(match2))
		const non_match = await obsidian.createFile("non_match.md", "value3")
		t.after(() => obsidian.deleteFile(non_match))

		const query = "value1 OR value2"
		t.log("query:", query)
		const matches = await search.searchFor(query);
		t.log("matches:", matches)

		if (!matches.some(it => it.name === "match1.md")) {
			t.failWith("file containing `value1` not found")
		}
		if (!matches.some(it => it.name === "match2.md")) {
			t.failWith("file containing `value2` not found")
		}
		if (matches.some(it => it.name === "non_match.md")) {
			t.failWith("file not containing either value was found")
		}
	})

	run.test("lowercase 'or' is considered a regular word", async t => {
		const match1 = await obsidian.createFile("match1.md", "value1")
		t.after(() => obsidian.deleteFile(match1))
		const match2 = await obsidian.createFile("match2.md", "value2")
		t.after(() => obsidian.deleteFile(match2))
		const or_match = await obsidian.createFile("or_match.md", "or value2 value1")
		t.after(() => obsidian.deleteFile(or_match))

		const query = "value1 or value2"
		t.log("query:", query)
		const matches = await search.searchFor(query);
		t.log("matches:", matches)

		if (matches.some(it => it.name === "match1.md")) {
			t.failWith("file containing only `value1` should not have been found")
		}
		if (matches.some(it => it.name === "match2.md")) {
			t.failWith("file containing only `value2` should not have found")
		}
		if (!matches.some(it => it.name === "or_match.md")) {
			t.failWith("file containing all the words should have been included in match")
		}
	})

	run.test("OR by itself", async t => {
		const file_without_or = await obsidian.createFile("without.md", "")
		t.after(() => obsidian.deleteFile(file_without_or))
		const file_with_or = await obsidian.createFile("with.md", "OR")
		t.after(() => obsidian.deleteFile(file_with_or))

		const query = "OR"
		t.log({ query })
		const matches = await search.searchFor(query)
		t.log({ matches })

		if (matches.length > 0) {
			t.failWith("should not have found any matches")
		}
	})

	run.test("OR quoted", async t => {
		const file_without_or = await obsidian.createFile("without.md", "")
		t.after(() => obsidian.deleteFile(file_without_or))
		const file_with_or = await obsidian.createFile("with.md", "OR")
		t.after(() => obsidian.deleteFile(file_with_or))

		const query = `"OR"`
		t.log({ query })
		const matches = await search.searchFor(query)
		t.log({ matches })

		if (!matches.some(it => it.path === "with.md")) {
			t.failWith("should have matched file 'with.md' with content:: " + await obsidian.readFile(file_with_or))
		}
		if (matches.some(it => it.path === "without.md")) {
			t.failWith("should NOT have matched file 'without.md'")
		}
	})

	run.test("negated OR", async t => {
		const file_without_or = await obsidian.createFile("without.md", "")
		t.after(() => obsidian.deleteFile(file_without_or))
		const file_with_or = await obsidian.createFile("with.md", "OR")
		t.after(() => obsidian.deleteFile(file_with_or))

		const query = "-OR"
		t.log({ query })
		const matches = await search.searchFor(query)
		t.log({ matches })

		if (matches.length > 0) {
			t.failWith("should not have found any matches")
		}
	})
}
