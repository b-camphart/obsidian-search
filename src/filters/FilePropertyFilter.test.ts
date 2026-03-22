import { describe, it, expect } from "vitest";
import { property, propertyName } from "./FilePropertyFilter";
import { basic } from "./strings";
import { TFile } from "obsidian";

describe(`Filter by property`, () => {
	it(`does not match files without frontmatter`, async () => {
		const filter = property(propertyName(basic("prop")), {
			getFileCache: () => null,
		});

		expect.soft(filter.appliesTo(null as unknown as TFile)).toBeFalsy();
		expect.soft(filter.appliesTo({} as unknown as TFile)).toBeFalsy();
		expect.soft(filter.appliesTo({ frontmatter: {} })).toBeFalsy();
	});

	it(`matches files with just the matching property name`, () => {
		const filter = property(propertyName(basic("prop")), {
			getFileCache: () => ({ prop: null }),
		});

		expect(filter.appliesTo({})).toBeTruthy();
	});

	it(`does not match files without matching property name`, () => {
		const filter = property(propertyName(basic("prop")), {
			getFileCache: () => {},
		});

		expect(filter.appliesTo({ frontmatter: { prop: null } })).toBeFalsy();
	});

	it(`matches files with matching property name and value`, () => {
		const filter = property(propertyName(basic("prop")), {
			getFileCache: () => null,
		});

		expect(filter.appliesTo({ frontmatter: { prop: "" } })).toBeTruthy();
	});

	it(`does not match files with matching property name, but not value`, () => {
		const filter = property(propertyName(basic("prop")), {
			getFileCache: () => null,
		});

		expect(filter.appliesTo({ frontmatter: { prop: "" } })).toBeFalsy();
	});

	it(`does not match files with matching value, but not property name`, () => {
		const filter = property(propertyName(basic("prop")), {
			getFileCache: () => null,
		});

		expect(filter.appliesTo({ frontmatter: { prop: "" } })).toBeFalsy();
	});

	it(`matches files that have property value or other value`, () => {
		const filter = property(propertyName(basic("prop")), {
			getFileCache: () => null,
		});

		expect(filter.appliesTo({ frontmatter: { prop: "value1" } })).toBeTruthy();
		expect(filter.appliesTo({ frontmatter: { prop: "value2" } })).toBeTruthy();
		expect(filter.appliesTo({ frontmatter: { prop: "value3" } })).toBeFalsy();
	});
});
