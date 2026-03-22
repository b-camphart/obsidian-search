
import * as testing from "../framework";
import { Files } from "../obsidian"

export default function testBasics<File>(
	t: testing.T,
	files: Files<File>,
) {

	t.test("word in body", async (t) => {
		const file_with_match = await files.createFile("test.md", "foo");
		t.after(() => files.deleteFile(file_with_match));

		const file_without_match = await files.createFile("test1.md");
		t.after(() => files.deleteFile(file_without_match));

		const matches = await files.searchFor("foo")

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

		const matches = await files.searchFor(`"foo bar"`)

		if (!matches.some(match => match.name === "test.md")) {
			t.failWith("expected to find 'test.md' in", matches)
		}
		if (matches.some(match => match.name === "test1.md")) {
			t.failWith("expected NOT to find 'test1.md' in", matches)
		}
	})
}
