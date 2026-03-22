import { fail } from "assert";
import { test } from "node:test";
import * as filters from "../filters";
import { FuzzyFileFilter } from "src/filters/FuzzyFileFilter";

test("quoted string filter", async () => {
	const filter = filters.file.fuzzy({ string: "work meeting", exact: true });

	function makeFile(def: {
		basename?: string;
		frontmatter?: Record<string, any>;
		content?: string;
	}) {
		const {
			basename = "",
			frontmatter,
			content = frontmatter
				? `
			---
			${Object.entries(frontmatter)
				.map(([key, value]) => {
					return `${key}: ${String(value)}`;
				})
				.join("\n")}
			---
			`
						.split("\n")
						.map((line) => line.trim())
						.filter(Boolean)
						.join("\n") + "\n"
				: "",
		} = def;
		return { basename, vault: { cachedRead: () => Promise.resolve(content) } };
	}

	function expect(file: ReturnType<typeof makeFile>) {
		return {
			async notToApply() {
				return test(`${JSON.stringify({ ...file, content: await file.vault.cachedRead() })})}`, async () => {
					if (await FuzzyFileFilter.appliesTo(filter.match, file)) {
						fail(`${filter.toQuery()} should NOT have applied`);
					}
				});
			},
			async toApply() {
				return test(`${JSON.stringify({ ...file, content: await file.vault.cachedRead() })})}`, async () => {
					if (!(await FuzzyFileFilter.appliesTo(filter.match, file))) {
						fail(`${filter.toQuery()} should have applied`);
					}
				});
			},
		};
	}

	await test("matches files with names containing the phrase", async () => {
		await expect(makeFile({ basename: "work meeting" })).toApply();
		await expect(makeFile({ basename: "work meetings" })).toApply();
		await expect(makeFile({ basename: "homework meeting" })).toApply();
		await expect(makeFile({ basename: "homework meetings" })).toApply();
	});

	await test("matches files containing the EXACT phrase in their content", async () => {
		await expect(makeFile({ frontmatter: { "work meeting": "" } })).toApply();
		await expect(makeFile({ frontmatter: { used_in: "work meeting" } })).toApply();
		await expect(makeFile({ content: "work meeting" })).toApply();
		await expect(makeFile({ content: "home work meeting" })).toApply();
		await expect(makeFile({ content: "work meeting with Gary" })).toApply();
	});

	await test("does not match files with quote embedded in content", async () => {
		await expect(makeFile({ frontmatter: { "work meetings": "" } })).notToApply();
		await expect(makeFile({ frontmatter: { used_in: "work meetings" } })).notToApply();
		await expect(makeFile({ content: "homework meeting" })).notToApply();
		await expect(makeFile({ content: "work meetings" })).notToApply();
	});

	await test("does not match files with names or content with too much whitespace", async () => {
		await expect(makeFile({ basename: "work  meeting.md" })).notToApply();
		await expect(makeFile({ content: "work\nmeeting" })).notToApply();
		await expect(makeFile({ content: "work  meeting" })).notToApply();
	});
});
