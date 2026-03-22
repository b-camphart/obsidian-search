import test from "node:test";
import { embeddedTest } from "../../obsidian-test/src";
import { normalizePath } from "obsidian";
import { fail } from "assert";

embeddedTest(({ app }) => {
	test("I am running in obsidian", () => {
		console.log("output in obsidian");
	});
	test("Another test", async () => {
		console.log(normalizePath("./foo.md"));
	});
	test("A failing test", () => {
		fail("intentional failure");
	});
});
