import { describe, expect, it } from "vitest";
import { PathFilter } from "./FilePathFilter";
import { basic } from "./strings";

describe(`Filtering by File Path`, () => {
	it(`applies to a file with a matching path`, async () => {
		const filter = new PathFilter({ path: basic("path/to/file.md") });

		expect(filter.appliesTo({ path: "path" })).toBeTruthy();
		expect(filter.appliesTo({ path: "to" })).toBeTruthy();
		expect(filter.appliesTo({ path: "file" })).toBeTruthy();
		expect(filter.appliesTo({ path: "md" })).toBeTruthy();
		expect(filter.appliesTo({ path: "to/file.md" })).toBeTruthy();
		expect(filter.appliesTo({ path: "path/to" })).toBeTruthy();
	});

	it(`does not apply to a file with a different path`, async () => {
		const filter = new PathFilter({ path: basic("path/to/file.md") });

		expect(filter.appliesTo({ path: "" })).toBeFalsy();
	});
});
