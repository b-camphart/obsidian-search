import { describe } from "vitest";
import { trimIndent } from "../../src/lib/strings";

describe("trimIndent", (test) => {
	test("empty string", (t) => t.expect(trimIndent("")).toEqual(""));
	test("no new lines", (t) => t.expect(trimIndent("something")).toEqual("something"));
	test("indented line", (t) => {
		t.expect(trimIndent(" something")).toEqual("something");
		t.expect(trimIndent("\tsomething")).toEqual("something");
		t.expect(trimIndent("\t\t\t\tsomething")).toEqual("something");
		t.expect(trimIndent(" \t  \t\t\t something")).toEqual("something");
	});
	test("empty first line", (t) => {
		t.expect(trimIndent("\nsomething")).toEqual("something");
		t.expect(trimIndent("\n\n\nsomething")).toEqual("something");
		t.expect(trimIndent("\n\n\tsomething")).toEqual("something");
		t.expect(trimIndent("\nsomething")).toEqual("something");
	});
	test("tabbed lines", (t) => {
		t.expect(trimIndent(`\n\t first\n\t second`)).toEqual(`first\nsecond`);
		t.expect(trimIndent(`\n\t first\n\t  second`)).toEqual(`first\n second`);
	});
});
