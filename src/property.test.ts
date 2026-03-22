import * as vitest from "vitest";
import * as filters from "./filters";
import { Parser } from "./parser";
import { inspect } from "util";
import type { FrontMatterCache } from "obsidian";

const strings = filters.strings;
function name(string_filter: filters.strings.Filter) {
	return filters.file.propertyName(string_filter);
}

vitest.describe("parsing", () => {
	const parser = new Parser({ metadataCache: { getFileCache: () => null } });
	function property(name_filter: filters.file.Frontmatter) {
		return filters.file.property(name_filter, parser.metadataCache);
	}

	vitest.describe("property name", (test) => {
		for (const { query, expected } of [
			{ query: "[prop]", expected: property(name(strings.basic("prop"))) },
			{ query: "[-prop]", expected: property(name(strings.basic("prop")).negated()) },
			// these are weird and are defined this way to match obsidian's behavior
			// - this first one treats "prop1 prop2" as a single property name
			{ query: "[prop1 prop2]", expected: property(name(strings.basic("prop1 prop2"))) },
			// - this second one sees the negation, breaks at the space, and thus is able to separate the match into two
			//   separate matchers, the first of which is negated (what we'd kind of expect)
			{
				query: "[-prop1 prop2]",
				expected: property(
					name(filters.any(strings.basic("prop1").negated(), strings.basic("prop2"))),
				),
			},
			// - this third one actually breaks at the negation symbol and just fails out of the parsing, resulting in
			//   just a single match against the first property name
			{ query: "[prop1 -prop2]", expected: property(name(strings.basic("prop1"))) },
			// grouping doesn't seem to work in the property name
			{ query: "[(prop1 prop2)]", expected: property(name(strings.basic("(prop1 prop2)"))) },
			{
				query: "[-(prop1 prop2)]",
				expected: property(name(strings.basic("(prop1 prop2)").negated())),
			},
			{
				query: "[prop1 OR prop2]",
				expected: property(
					name(filters.any(strings.basic("prop1"), strings.basic("prop2"))),
				),
			},
			{
				query: "[-prop1 OR prop2]",
				expected: property(
					name(filters.any(strings.basic("prop1").negated(), strings.basic("prop2"))),
				),
			},
			{
				query: "[prop1 OR -prop2]",
				expected: property(
					name(filters.any(strings.basic("prop1"), strings.basic("prop2").negated())),
				),
			},
			{
				query: "[prop1 OR prop2 OR prop3]",
				expected: property(
					filters.any(
						name(strings.basic("prop1")),
						name(strings.basic("prop2")),
						name(strings.basic("prop3")),
					),
				),
			},
			{
				query: "[prop1 OR -(prop2 OR prop3)]",
				expected: property(
					filters.any(
						name(strings.basic("prop1")),
						name(strings.basic("(prop2 OR prop3)").negated()),
					),
				),
			},
		]) {
			test(query, (t) => t.expect(parser.filterFromQuery(query), query).toEqual(expected));
		}
	});
});

vitest.describe("filtering", (test) => {
	vitest.describe("property name", (test) => {
		function propertyNameTest(
			filter: filters.file.Frontmatter,
			expected: {
				should_match: Array<FrontMatterCache>;
				should_not_match: Array<FrontMatterCache>;
			},
		) {
			test(filter.toQuery(), (t) => {
				for (const match of expected.should_match) {
					t.expect
						.soft(filter.appliesTo(match?.frontmatter ?? {}), inspect(match))
						.toBe(true);
				}
				for (const match of expected.should_not_match) {
					t.expect
						.soft(filter.appliesTo(match?.frontmatter ?? {}), inspect(match))
						.toBeFalsy();
				}
			});
		}

		propertyNameTest(name(strings.basic("tags")), {
			should_match: [{ tags: ["foo"] }, { tags1: "" }],
			should_not_match: [{}],
		});
		propertyNameTest(name(strings.basic("aliases")), {
			should_match: [{ aliases: ["foo"] }, { aliases1: "" }],
			should_not_match: [{}],
		});
		propertyNameTest(name(strings.basic("cssclasses")), {
			should_match: [{ cssclasses: ["foo"] }, { cssclasses1: "" }],
			should_not_match: [{}],
		});
		propertyNameTest(name(strings.basic("arbitrary_prop")), {
			should_match: [
				{ arbitrary_prop: "" },
				{ arbitrary_prop1: "" },
				{ an_arbitrary_prop: "" },
			],
			should_not_match: [{}],
		});
		propertyNameTest(name(strings.basic("prop1").negated()), {
			should_match: [{ tags: ["foo"] }, { prop2: "" }],
			should_not_match: [{ prop1: "" }, { prop11: "" }],
		});
		// to reflect the weirdness above, let's make sure a property name with a space in it is just treated like any
		// other property name
		propertyNameTest(name(strings.basic("prop1 prop2")), {
			should_match: [{ "prop1 prop2": "" }, { "prop1 prop22": "" }],
			should_not_match: [
				{ prop1: "" },
				{ prop2: "" },
				{ prop1: "", prop2: "" },
				{ prop1: "", prop2: "", prop3: "" },
				{ prop1: "", prop3: "" },
				{ prop2: "", prop3: "" },
			],
		});
		propertyNameTest(name(filters.any(strings.basic("prop1"), strings.basic("prop2"))), {
			should_match: [{ prop1: "" }, { prop2: "" }, { prop1: "", prop2: "" }],
			should_not_match: [{}, { prop3: "" }],
		});
		propertyNameTest(
			name(filters.any(strings.basic("prop1").negated(), strings.basic("prop2"))),
			{
				should_match: [
					{ prop2: "" },
					{ prop1: "", prop2: "" },
					{ prop1: "", prop22: "" },
					{ prop3: "" },
				],
				should_not_match: [{}, { prop1: "" }, { prop11: "" }],
			},
		);
		propertyNameTest(
			name(filters.any(strings.basic("prop1"), strings.basic("prop2").negated())),
			{
				should_match: [
					{ prop1: "" },
					{ prop1: "", prop2: "" },
					{ prop11: "", prop2: "" },
					{ prop3: "" },
				],
				should_not_match: [{}, { prop2: "" }, { prop22: "" }],
			},
		);
		propertyNameTest(
			name(
				filters.any(strings.basic("prop1"), strings.basic("prop2"), strings.basic("prop3")),
			),
			{
				should_match: [
					{ prop1: "" },
					{ prop2: "" },
					{ prop3: "" },
					{ prop11: "" },
					{ prop22: "" },
					{ prop33: "" },
				],
				should_not_match: [{}, { prop4: "" }],
			},
		);
	});
});
