import * as obsidian from "obsidian";

import * as testing from "../../framework"
import * as embedded from "../../embedded/testing";

export default async function(t: testing.Test, app: obsidian.App) {
	const fileWithoutProperties = await embedded.createFile(app, "fileWithoutProps.md", "");
	t.after(() => app.vault.delete(fileWithoutProperties, true));

	const fileWithProperties = await embedded.createFile(app, "fileWithProps.md", `---
prop1: default-string-value
prop2: "explicit string"
prop3: 3
prop4: "3"
prop5: true
prop6: false
prop7: 
  - array-val-1
  - array-val-2
  - nested:
    - nested-val-1
---
`);
	t.after(() => app.vault.delete(fileWithProperties, true));

	t.test("default property value", t => {
		const cache = app.metadataCache.getFileCache(fileWithProperties);

		if (cache!.frontmatter!.prop1 !== "default-string-value") {
			t.fail();
		}
	})

	t.test("explicit string value", t => {
		const cache = app.metadataCache.getFileCache(fileWithProperties);

		if (cache!.frontmatter!.prop2 !== "explicit string") {
			t.fail();
		}
	})

	t.test(`number value`, (t) => {
		const cache = app.metadataCache.getFileCache(fileWithProperties)

		if (cache!.frontmatter!.prop3 !== 3) {
			t.fail()
		}
	})

	t.test(`true boolean value`, (t) => {
		const cache = app.metadataCache.getFileCache(fileWithProperties)

		if (cache!.frontmatter!.prop5 !== true) {
			t.fail();
		}
	})

	t.test(`false boolean value`, (t) => {
		const cache = app.metadataCache.getFileCache(fileWithProperties)

		if (cache!.frontmatter!.prop6 !== false) {
			t.fail();
		}
	})

	t.test(`array value`, (t: testing.Test) => {
		const cache = app.metadataCache.getFileCache(fileWithProperties) ?? t.failNow();

		if (!Array.isArray(cache.frontmatter?.prop7)) {
			t.failNowWith("prop7 is not an array");
		}
		if (cache.frontmatter.prop7[0] !== "array-val-1") {
			t.failNowWith("prop7[0] != 'array-val-1'");
		}
		if (cache.frontmatter.prop7[1] !== "array-val-2") {
			t.failNowWith("prop7[1] != 'array-val-2'");
		}
		if (typeof cache.frontmatter.prop7[2] !== "object") {
			t.failNowWith("prop7[2] is not an object");
		}
		if (!Array.isArray(cache.frontmatter.prop7[2].nested)) {
			t.failNowWith("prop7[2].nested is not an array");
		}
		if (cache.frontmatter.prop7[2].nested[0] !== "nested-val-1") {
			t.failNowWith("prop7[2].nested[0] != 'nested-val-1'");
		}
	})

	t.test("file without properties still has cache", t => {
		const cache = app.metadataCache.getFileCache(fileWithoutProperties) ?? t.failNow();
		t.log(cache);
		if (cache.frontmatter) {
			t.failWith("file without frontmatter should not have frontmatter property")
		}
		if (cache.tags) {
			t.failWith("file without frontmatter should not have tags property")
		}
	})
}
