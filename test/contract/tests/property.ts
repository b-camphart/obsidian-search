import * as testing from "../../framework";
import { Frontmatter, type Files } from "../../testing/files"
import type { Search } from "../../testing/search"

export default async function testProperty<F>(
	t: testing.Test,
	files: Files<F>,
	search: Search,
) {

	async function propertyTest(t: testing.Test, query: string,
		expected: Array<Frontmatter>,
		unexpected: Array<Frontmatter>,
	) {
		t.log({ query });

		const expected_matches: Array<{ path: string, file: F }> = [];
		for (let i = 0; i < expected.length; i++) {
			const path = `expected ${i}.md`
			const file = await files.createFile(path, '', expected[i])
			expected_matches.push({ path, file });
			t.after(() => files.deleteFile(file));
		}
		const unexpected_matches: Array<{ path: string, file: F }> = [];
		for (let i = 0; i < unexpected.length; i++) {
			const path = `unexpected ${i}.md`
			const file = await files.createFile(path, '', unexpected[i])
			unexpected_matches.push({ path, file });
			t.after(() => files.deleteFile(file));
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
	}

	t.suite("[property]", async (t) => {
		t.test("[tags]", async (t) => {
			t.log("match files that have the 'tags' property");
			await propertyTest(t, "[tags]",
				/* should match */[
					new Frontmatter({ tags: ["foo"] }),
					new Frontmatter({ properties: { tags1: "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}),
				])
		})
		t.test("[aliases]", async (t) => {
			t.log("match files that have the 'aliases' property");
			await propertyTest(t, "[aliases]",
				/* should match */[
					new Frontmatter({ aliases: ["foo"] }),
					new Frontmatter({ properties: { aliases1: "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}),
				])
		})
		t.test("[cssclasses]", async (t) => {
			t.log("match files that have the 'cssclasses' property");
			await propertyTest(t, "[cssclasses]",
				/* should match */[
					new Frontmatter({ cssclasses: ["foo"] }),
					new Frontmatter({ properties: { cssclasses1: "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}),
				])
		})

		t.test("arbitrary property", async (t) => {
			t.log("match files that have property name containing 'prop'")
			await propertyTest(t, "[prop]",
				/* should match */[
					new Frontmatter({ properties: { prop: "" } }),
					new Frontmatter({ properties: { prop1: "" } }),
					new Frontmatter({ properties: { "some-prop": "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}),
				])
		})

		t.test("negated property name", async t => {
			t.log("match files that have property name NOT containing 'prop1'")
			await propertyTest(t, `[-prop1]`,
				/* should match */[
					new Frontmatter({ tags: ["foo"] }),
					new Frontmatter({ properties: { prop2: "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}), // file has no frontmatter, so check is skipped
					new Frontmatter({ properties: { prop1: "" } }),
					new Frontmatter({ properties: { prop11: "" } }),
				])
		})

		t.test("multiple property names", async t => {
			t.log("match files that have property name containing 'prop1 prop2'")
			await propertyTest(t, `[prop1 prop2]`,
				/* should match */[
					new Frontmatter({ properties: { "prop1 prop2": "" } }),
					new Frontmatter({ properties: { "prop1 prop22": "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}),
					new Frontmatter({ properties: { prop1: "" } }),
					new Frontmatter({ properties: { prop2: "" } }),
					new Frontmatter({ properties: { prop1: "", prop2: "" } }),
					new Frontmatter({ properties: { prop1: "", prop2: "", prop3: "" } }),
					new Frontmatter({ properties: { prop1: "", prop3: "" } }),
					new Frontmatter({ properties: { prop2: "", prop3: "" } }),
				])
		})

		t.test("first prop name negated", async t => {
			t.log("match files that have property name NOT containing 'prop1 prop2'")
			await propertyTest(t, `[-prop1 prop2]`,
				/* should match */[
					new Frontmatter({ properties: { prop1: "", prop2: "" } }),
					new Frontmatter({ properties: { prop2: "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}),
					new Frontmatter({ properties: { ["-prop1 prop2"]: "" } }),
					new Frontmatter({ properties: { ["prop1 prop2"]: "" } }),
					new Frontmatter({ properties: { prop1: "" } }),
					new Frontmatter({ properties: { ["-prop1"]: "" } }),
				])
			t.log("files without property 'prop1 prop2' should match")
		})

		t.test("second prop name negated", async t => {
			t.log("match files with property name containing 'prop1' (second negation breaks parser, so '-prop2' is ignored)")
			await propertyTest(t, `[prop1 -prop2]`,
				/* should match */[
					new Frontmatter({ properties: { prop1: "", prop2: "" } }),
					new Frontmatter({ properties: { prop1: "" } }),
					new Frontmatter({ properties: { prop11: "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}),
					new Frontmatter({ properties: { prop2: "" } }),
					new Frontmatter({ properties: { ["-prop2"]: "" } }),
					new Frontmatter({ properties: { ["prop1 -prop2"]: "" } }),
					new Frontmatter({ properties: { ["prop1 prop2"]: "" } }),
				])
		})

		t.test("grouped property name", async t => {
			t.log("match files that have property name containing '(prop1 prop2)'")
			await propertyTest(t, `[(prop1 prop2)]`,
				/* should match */[
					new Frontmatter({ properties: { "(prop1 prop2)": "" } }),
					new Frontmatter({ properties: { "(prop1 prop2))": "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}),
					new Frontmatter({ properties: { prop1: "" } }),
					new Frontmatter({ properties: { prop2: "" } }),
					new Frontmatter({ properties: { prop1: "", prop2: "" } }),
				])
		})

		t.test("negated grouped property name", async t => {
			t.log("match files that have property name NOT containing '(prop1 prop2)'")
			await propertyTest(t, `[-(prop1 prop2)]`,
				/* should match */[
					new Frontmatter({ properties: { prop1: "" } }),
					new Frontmatter({ properties: { prop2: "" } }),
					new Frontmatter({ properties: { prop1: "", prop2: "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}),
					new Frontmatter({ properties: { "(prop1 prop2)": "" } }),
				])
		})

		t.test("either property name", async t => {
			t.log("match files with property name containing 'prop1' or 'prop2'")
			await propertyTest(t, `[prop1 OR prop2]`,
				/* should match */[
					new Frontmatter({ properties: { prop1: "" } }),
					new Frontmatter({ properties: { prop2: "" } }),
					new Frontmatter({ properties: { prop1: "", prop2: "" } }),
				],
				/* should NOT match */[
					new Frontmatter({}),
					new Frontmatter({ properties: { prop3: "" } }),
				])
		})

		t.test("negated either property name", async t => {
			t.log("match files with property name NOT containing 'prop1' or containing 'prop2'")
			await propertyTest(t, `[-prop1 OR prop2]`,
				/* should match */[
					new Frontmatter({ properties: { prop2: "" } }),
					new Frontmatter({ properties: { prop1: "", prop2: "" } }), // OR containing prop2
					new Frontmatter({ properties: { prop1: "", prop22: "" } }), // OR containing prop2
					new Frontmatter({ properties: { prop3: "" } }), // does NOT contain prop1
				],
				/* should NOT match */[
					new Frontmatter({}), // no frontmatter is always a non-match
					new Frontmatter({ properties: { prop1: "" } }),
					new Frontmatter({ properties: { prop11: "" } }),
				])
		})

		t.test("either property name, but second is negated", async t => {
			t.log("match files with property name containing 'prop1' or NOT containing 'prop2'")
			await propertyTest(t, `[prop1 OR -prop2]`,
				/* should match */[
					new Frontmatter({ properties: { prop1: "" } }), // contains prop1
					new Frontmatter({ properties: { prop1: "", prop2: "" } }), // OR containing prop1
					new Frontmatter({ properties: { prop11: "", prop2: "" } }), // OR containing prop1
					new Frontmatter({ properties: { prop3: "" } }), // does NOT contain prop2
				],
				/* should NOT match */[
					new Frontmatter({}), // no frontmatter is always a non-match
					new Frontmatter({ properties: { prop2: "" } }),
					new Frontmatter({ properties: { prop22: "" } }),
				])
		})

		t.test("grouping after OR", async t => {
			t.log("match files with property name containing 'prop1' or containing '(prop2 prop3)'")
			await propertyTest(t, `[prop1 OR (prop2 prop3)]`,
				/* should match */[
					new Frontmatter({ properties: { prop1: "" } }), // contains prop1
					new Frontmatter({ properties: { "(prop2 prop3)": "" } }), // contains "(prop2 prop3)"
				],
				/* should NOT match */[
					new Frontmatter({}), // no frontmatter is always a non-match
					new Frontmatter({ properties: { prop2: "", prop3: "" } }), // group is not treated as AND
				])
		})
		t.test("either of three property names", async t => {
			t.log("match files with property name containing 'prop1', 'prop2' or 'prop3'")
			await propertyTest(t, `[prop1 OR prop2 OR prop3]`,
				/* should match */[
					new Frontmatter({ properties: { prop1: "" } }), // contains prop1
					new Frontmatter({ properties: { prop2: "" } }), // contains prop2
					new Frontmatter({ properties: { prop3: "" } }), // contains prop3
					new Frontmatter({ properties: { prop11: "" } }), // contains prop2
					new Frontmatter({ properties: { prop22: "" } }), // contains prop2
					new Frontmatter({ properties: { prop33: "" } }), // contains prop2
				],
				/* should NOT match */[
					new Frontmatter({}), // no frontmatter is always a non-match
				])
		})


	})

	t.suite("[property:value]", async (t) => {
		t.test("[aliases:Name]", async (t) => {
			const file = await files.createFile("test.md", "", new Frontmatter({
				aliases: [
					"Name"
				],
			}));
			t.after(() => files.deleteFile(file))

			const non_match = await files.createFile("test1.md", "", new Frontmatter({
				aliases: [
					"Other"
				],
			}));
			t.after(() => files.deleteFile(non_match));

			const matches = await search.searchFor("[aliases:Name]");

			if (!matches.some(it => it.name === "test.md")) {
				t.failWith("expected to find 'test.md' in", matches);
			}
			if (matches.some(it => it.name === "test1.md")) {
				t.failWith("expected NOT to find 'test1.md' in", matches);
			}
		})

		t.test("[aliases:value1 OR value2]", async t => {
			const match1 = await files.createFile("test.md", "", new Frontmatter({
				aliases: [
					"value1"
				]
			}))
			t.after(() => files.deleteFile(match1));

			const match2 = await files.createFile("test1.md", "", new Frontmatter({
				aliases: [
					"value2"
				]
			}))
			t.after(() => files.deleteFile(match2));

			const non_match = await files.createFile("test2.md", "", new Frontmatter({
				aliases: [
					"value3"
				]
			}))
			t.after(() => files.deleteFile(non_match));

			const matches = await search.searchFor("[aliases:value1 OR value2]");

			if (!matches.some(it => it.name === "test.md")) {
				t.failWith("expected to find test.md in", matches);
			}
			if (!matches.some(it => it.name === "test1.md")) {
				t.failWith("expected to find 'test1.md' in", matches);
			}
			if (matches.some(it => it.name === "test3.md")) {
				t.failWith("expected NOT to find 'test3.md' in", matches);
			}

		})

		const keywords = [
			`file`,
			`path`,
			`content`,
			`tag`,
			`ignore-case`,
			`match-case`,
			`block`,
			`line`,
			`section`,
			`task`,
			`task-todo`,
			`task-done`
		];
		t.suite("keyword as property name", async run => {
			for (const keyword of keywords) {
				run.suite(`keyword '${keyword}'`, async run => {
					for (const query of [
						`[${keyword}]`, `[${keyword}:]`, `[${keyword}:value]`
					]) {
						run.test(query, async t => {
							const file = await files.createFile("file.md", "", new Frontmatter({ properties: { [keyword]: "value" } }));
							t.after(() => files.deleteFile(file))

							const matches = await search.searchFor(query)
							t.log("matches:", matches)

							if (matches.length === 0) {
								t.failWith("should have found file with property")
							}
						})
					}
				})
			}
		})

		t.suite("keyword in property value", async t => {
			for (const keyword of keywords) {
				const query = `[prop:${keyword}]`
				t.test(query, async t => {
					const file1 = await files.createFile(`${keyword}.md`, "", new Frontmatter({ properties: { prop: `${keyword}` } }));
					t.after(() => files.deleteFile(file1))
					const file2 = await files.createFile(`${keyword}_value.md`, "", new Frontmatter({ properties: { prop: `${keyword}:value` } }));
					t.after(() => files.deleteFile(file2))
					const file3 = await files.createFile(`prop_${keyword}.md`, "", new Frontmatter({ properties: { [`prop:${keyword}`]: `value` } }));
					t.after(() => files.deleteFile(file3))

					const matches = await search.searchFor(query)
					t.log("matches:", matches)

					if (!matches.some(it => it.name === `${keyword}.md`)) {
						t.failWith("should have matched against file with keyword as the property value")
					}
					if (!matches.some(it => it.name === `${keyword}_value.md`)) {
						t.failWith("should have matched against file with keyword IN the property value")
					}
					if (matches.some(it => it.name === `prop_${keyword}.md`)) {
						t.failWith("should NOT have matched against file with keyword in property name\n" +
							"(first colon is treated as the delineation between prop name and value)")
					}
				})
				const query1 = `[prop:${keyword}:value]`
				t.test(query1, async t => {
					t.skip();

					const file1 = await files.createFile(`${keyword}.md`, "", new Frontmatter({ properties: { prop: `${keyword}` } }));
					t.after(() => files.deleteFile(file1))
					const file2 = await files.createFile(`${keyword}_value.md`, "", new Frontmatter({ properties: { prop: `${keyword}:value` } }));
					t.after(() => files.deleteFile(file2))
					const file3 = await files.createFile(`prop_${keyword}.md`, "", new Frontmatter({ properties: { [`prop:${keyword}`]: `value` } }));
					t.after(() => files.deleteFile(file3))

					const matches = await search.searchFor(query1)
					t.log("matches:", matches)

					if (!matches.some(it => it.name === `${keyword}.md`)) {
						t.failWith(`should have matched against file with just keyword in property value (colon makes search ambiguous)\n` +
							`expected file:`, await files.readFile(file1));
					}
					if (!matches.some(it => it.name === `${keyword}_value.md`)) {
						t.failWith(`should have matched against file with '${keyword}:value' IN the property value`)
					}
					if (matches.some(it => it.name === `prop_${keyword}.md`)) {
						t.failWith("should NOT have matched against file with keyword in property name\n" +
							"(first colon is treated as the delineation between prop name and value)")
					}
				})
			}
		})
	})

}

