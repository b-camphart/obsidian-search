import * as embedded from "../../embedded/testing"
import * as testing from "../../testing/framework"
import * as obsidian from "obsidian"

export default async function(t: testing.Suite, app: obsidian.App) {
	let taggedFile: obsidian.TFile = await embedded.createFile(app, "taggedFile.md", `---
tag: single-tag
tags:
  - tag2
  - tag3
  - #tag4
  - "#tag5"
---

#inline-tag
`)
	t.after(() => app.vault.delete(taggedFile, true))

	t.test(`CachedMetadata.tags only contains inline tags`, t => {
		const fileCache = app.metadataCache.getFileCache(taggedFile) ?? t.failNowWith("no file cache")
		t.log(fileCache.tags)

		if (!fileCache.tags?.some(it => it.tag === "#inline-tag")) {
			t.failWith("should have contained '#inline-tag'")
		}
		for (const tag of [
			"single-tag",
			"tag2",
			"tag3",
			"tag4",
			"tag5",
			"#tag5",
		]) {
			if (fileCache.tags?.some(it => it.tag === tag)) {
				t.failWith(`should not have contained ${tag}`)
			}
		}
	})

	t.test(`inline tags have hashes`, (t) => {
		const fileCache = app.metadataCache.getFileCache(taggedFile) ?? t.failNowWith("no file cache")

		t.log(fileCache.tags)
		if (!fileCache.tags?.some(it => it.tag === "#inline-tag")) {
			t.failNowWith("expected to contain '#inline-tag'");
		}
	})

	t.test(`single tag is standard string`, (t: testing.Test) => {
		const fileCache = app.metadataCache.getFileCache(taggedFile) ?? t.failNowWith("no file cache");
		const frontmatter = fileCache.frontmatter ?? t.failNowWith("frontmatter doesn't exist")

		if (!Object.hasOwn(frontmatter, "tag")) {
			t.failNowWith("frontmatter does not have 'tag' property")
		}
		if (frontmatter["tag"] !== "single-tag") {
			t.failNowWith(`frontmatter.tag = '${frontmatter.tag}', expected 'single-tag'`)
		}
	})

	t.test(`tag list is array of strings`, (t: testing.Test) => {
		const fileCache = app.metadataCache.getFileCache(taggedFile) ?? t.failNowWith("no file cache");
		const frontmatter = fileCache.frontmatter ?? t.failNowWith("frontmatter doesn't exist")

		t.log("frontmatter: ", frontmatter)
		if (!Object.hasOwn(frontmatter, "tags")) {
			t.failNowWith("frontmatter does not have 'tags' property")
		}
		if (!Array.isArray(frontmatter["tags"])) {
			t.failNowWith("frontmatter.tags is not an array")
		}
		const expected_tags = [
			"tag2",
			"tag3",
			null, // # prefix without surrounding quotes is invalid
			"#tag5"
		];
		for (let i = 0; i < expected_tags.length; i++) {
			if (frontmatter["tags"][i] !== expected_tags[i]) {
				t.failWith(`frontmatter.tags[${i}] = ${frontmatter["tags"][i]}, expected ${expected_tags[i]}`)
			}
		}
	})
}
