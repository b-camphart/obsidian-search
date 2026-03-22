import { test } from "node:test";
import { expect } from "vitest";
import { NameFilter } from "./FileNameFilter";
import { basic } from "./strings";

test(`Filtering by File Name`, async () => {
	await test(`applies to a file with a matching basename`, (t) => {
		const file = { basename: "basename.md" };

		expect(new NameFilter({ matcher: basic("base") }).appliesTo(file)).toBe(true);
		expect(new NameFilter({ matcher: basic("md") }).appliesTo(file)).toBe(true);
		expect(new NameFilter({ matcher: basic("basename.md") }).appliesTo(file)).toBe(true);
	});

	await test(`does not apply to a file with a different basename`, (t) => {
		const file = { basename: "basename.md" };

		expect(new NameFilter({ matcher: basic("") }).appliesTo(file)).toBe(false);
		expect(new NameFilter({ matcher: basic("foo") }).appliesTo(file)).toBe(false);
	});
});
