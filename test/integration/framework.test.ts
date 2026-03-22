
import { describe } from "vitest"
import * as framework from "./framework";

describe("suite", test => {
	test("multiple tests", async t => {
		let logs: Array<any[]> = [];
		const suite = new framework.Suite({
			log(...data) { logs.push(data) },
			warn(...data) { logs.push(data) },
			error(...data) { logs.push(data) },
		});
		suite.test("one", () => { });
		suite.test("two", () => { });
		suite.test("three", () => { });

		await suite.run();

		t.expect(logs).toEqual([
			["TEST", "one"],
			["PASS", "one"],
			["TEST", "two"],
			["PASS", "two"],
			["TEST", "three"],
			["PASS", "three"],
		])
	})
	test("child suite", async t => {
		let logs: Array<string> = [];
		const suite = new framework.Suite({
			log(...data) { logs.push(data.join(" ")) },
			warn(...data) { logs.push(data.join(" ")) },
			error(...data) { logs.push(data.join(" ")) },
		});

		await suite.suite("nested", async run => {
			run.test("one", () => { });
			run.test("two", () => { });
		})

		t.expect(logs).toEqual([
			"TEST nested",
			"    TEST one",
			"    PASS one",
			"    TEST two",
			"    PASS two",
			"PASS nested",
		])
	})

	test("nested suites", async t => {
		let logs: Array<string> = [];
		const suite = new framework.Suite({
			log(...data) { logs.push(data.join(" ")) },
			warn(...data) { logs.push(data.join(" ")) },
			error(...data) { logs.push(data.join(" ")) },
		});

		await suite.suite("child", async run => {
			await run.suite("nested one", async run => {
				run.test("one", () => { });
				run.test("two", () => { });
			})
			await run.suite("nested two", async run => {
				run.test("three", () => { });
				run.test("four", () => { });
			})
		})

		t.onTestFailed(() => console.log(logs))

		t.expect(logs).toEqual([
			"TEST child",
			"    TEST nested one",
			"        TEST one",
			"        PASS one",
			"        TEST two",
			"        PASS two",
			"    PASS nested one",
			"    TEST nested two",
			"        TEST three",
			"        PASS three",
			"        TEST four",
			"        PASS four",
			"    PASS nested two",
			"PASS child"
		]);
	})
})
