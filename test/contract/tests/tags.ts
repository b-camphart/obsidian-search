import * as testing from "../../framework";
import { Frontmatter, type Files } from "../../testing/files"
import type { Search } from "../../testing/search"
import { trimIndent } from "src/lib/strings";

export default function <File>(run: testing.Test, obsidian: Files<File>, search: Search) {
	run.test("tags in body", async (t) => {
		const tagged = await obsidian.createFile("tagged.md", "#meeting");
		t.after(() => obsidian.deleteFile(tagged));

		const matches = await search.searchFor("tag:#meeting");

		if (!matches.some(it => it.name === "tagged.md")) {
			t.failWith("tagged.md has tag '#meeting' in body, but it was not found in", matches)
		}
	})

	run.test("prefixed tags in frontmatter", async (t) => {
		const tagged = await obsidian.createFile("tagged.md", "", new Frontmatter({
			tags: ["#meeting"]
		}));
		t.after(() => obsidian.deleteFile(tagged));
		const content = await obsidian.readFile(tagged);
		t.log("tagged.md", content)

		const matches = await search.searchFor("tag:#meeting");

		if (matches.some(it => it.name === "tagged.md")) {
			t.failWith("tags of a file do not have hashes at the start, so the following should NOT match", matches)
		}
	})

	run.test("raw tag in frontmatter", async (t) => {
		const tagged = await obsidian.createFile("tagged.md", "", new Frontmatter({
			tags: ["meeting"]
		}));
		t.after(() => obsidian.deleteFile(tagged));

		const matches = await search.searchFor("tag:#meeting");

		if (!matches.some(it => it.name === "tagged.md")) {
			t.failWith("tagged.md has tag 'meeting' in frontmatter, but it was not found in", matches)
		}
	})

	run.test("no hash after tag operator", async t => {
		const tagged = await obsidian.createFile("tagged.md", "", new Frontmatter({ tags: ["meeting"] }));
		t.after(() => obsidian.deleteFile(tagged));

		const matches = await search.searchFor("tag:meeting");

		if (!matches.some(it => it.name === "tagged.md")) {
			t.failWith("tagged.md has tag 'meeting' in frontmatter, but it was not found in", matches)
		}
	})

	run.test("tag in codeblock", async (t) => {
		const file = await obsidian.createFile("tagged in codeblock.md", trimIndent(`
			\`\`\`
			#meeting
			\`\`\`
		`));
		t.after(() => obsidian.deleteFile(file))

		const raw_matches = await search.searchFor("#meeting");
		const tag_matches = await search.searchFor("tag:#meeting");
		const no_hash = await search.searchFor("tag:meeting");

		if (!raw_matches.some(it => it.name === "tagged in codeblock.md")) {
			t.failWith("raw search for '#meeting' did not find file with '#meeting' in codeblock")
		}
		if (tag_matches.some(it => it.name === "tagged in codeblock.md")) {
			t.failWith("tag search for '#meeting' incorrectly matched file with '#meeting' in codeblock")
		}
		if (no_hash.some(it => it.name === "tagged in codeblock.md")) {
			t.failWith("tag search for '#meeting' incorrectly matched file with '#meeting' in codeblock")
		}
	})

	run.test("grouped tag query", async (t: testing.Test) => {
		const query = "tag:(meeting personal)";
		t.log("query:", query)
		const matches = await search.searchFor(query)
		t.log("matches:", matches)

		const expected_message = `Operator "tag" can only be followed by text`;
		const logged_error = t.logs.findLast(it => it.args.some(it => it.includes(expected_message)));
		if (!logged_error) {
			t.failNowWith("expected search to have logged an error")
		}
	})

	run.test("negated tag subquery", async (t: testing.Test) => {
		const query = "tag:-personal";
		t.log("query:", query)
		const matches = await search.searchFor(query)
		t.log("matches:", matches)

		const expected_message = `Operator "tag" can only be followed by text`;
		const logged_error = t.logs.findLast(it => it.args.some(it => it.includes(expected_message)));
		if (!logged_error) {
			t.failNowWith("expected search to have logged an error")
		}
	})

	run.test("operator in tag subquery", async (t: testing.Test) => {
		const query = "tag:match-case:word";
		t.log("query:", query)
		const matches = await search.searchFor(query)
		t.log("matches:", matches)

		const expected_message = `Operator "tag" can only be followed by text`;
		const logged_error = t.logs.findLast(it => it.args.some(it => it.includes(expected_message)));
		if (!logged_error) {
			t.failNowWith("expected search to have logged an error")
		}
	})

	run.test("phrase as tag subquery", async (t: testing.Test) => {
		const query = `tag:"some phrase"`;
		t.log("query:", query)
		const matches = await search.searchFor(query)
		t.log("matches:", matches)

		const expected_message = `Operator "tag" can only be followed by text`;
		const logged_error = t.logs.findLast(it => it.args.some(it => it.includes(expected_message)));
		if (!logged_error) {
			t.failNowWith("expected search to have logged an error")
		}
	})

	run.test("regex as tag subquery", async (t: testing.Test) => {
		const query = `tag:/some regex/`;
		t.log("query:", query)
		const matches = await search.searchFor(query)
		t.log("matches:", matches)

		const expected_message = `Operator "tag" can only be followed by text`;
		const logged_error = t.logs.findLast(it => it.args.some(it => it.includes(expected_message)));
		if (!logged_error) {
			t.failNowWith("expected search to have logged an error")
		}
	})



}
