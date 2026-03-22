import * as vitest from "vitest";

import * as testing from "./framework";
import { inspect } from "util";

class TestOrderReporter {
	order: Array<{ name: string, report: "started" | "completed" }> = [];

	static #reporter = {
		testStarted: (reporter: testing.Reporter<TestOrderReporter>, name: string, test: testing.Test): void => {
			reporter.impl.order.push({ name, report: "started" });
		},
		testCompleted: (reporter: testing.Reporter<TestOrderReporter>, name: string, test: testing.Test): void => {
			reporter.impl.order.push({ name, report: "completed" });
		}
	}

	reporter(this: TestOrderReporter): testing.Reporter<TestOrderReporter> {
		return new testing.Reporter({
			impl: this,
			testStarted: TestOrderReporter.#reporter.testStarted,
			testCompleted: TestOrderReporter.#reporter.testCompleted,
		})
	}
}

vitest.describe("tests are executed in order", (test) => {
	test("single test", async (t) => {
		const order_reporter = new TestOrderReporter();
		const runner = new testing.Runner({
			reporter: order_reporter.reporter(),
		})
		await runner.run((t) => {
			// pass
		});

		t.expect(order_reporter.order).toEqual([])
	})

	test("nested test", async (t) => {
		const order_reporter = new TestOrderReporter();
		const runner = new testing.Runner({
			reporter: order_reporter.reporter(),
		})
		await runner.run((t) => {
			t.run("top-level test", t => { });
		});

		t.expect(order_reporter.order).toEqual([
			{ name: "top-level test", report: "started" },
			{ name: "top-level test", report: "completed" },
		])
	})

	test("async tests", async t => {
		const order_reporter = new TestOrderReporter();
		const runner = new testing.Runner({
			reporter: order_reporter.reporter(),
		})
		await runner.run((t) => {
			t.run("async test", async t => {

			});
			t.run("sync test", t => {

			});
		});

		t.onTestFailed(() => {
			console.log(order_reporter.order)
		})

		const async_test_start_index = order_reporter.order.findIndex(it => it.name === "async test" && it.report === "started");
		const async_test_end_index = order_reporter.order.findIndex(it => it.name === "async test" && it.report === "completed");
		const sync_test_start_index = order_reporter.order.findIndex(it => it.name === "sync test" && it.report === "started");
		const sync_test_end_index = order_reporter.order.findIndex(it => it.name === "sync test" && it.report === "completed");

		for (const index of [
			async_test_start_index,
			async_test_end_index,
			sync_test_start_index,
			sync_test_end_index
		]) {
			t.expect(index).toBeGreaterThanOrEqual(0);
			t.expect(index).toBeLessThan(order_reporter.order.length);
		}
	})

	test("nested async tests", async t => {
		const order_reporter = new TestOrderReporter();
		const runner = new testing.Runner({
			reporter: order_reporter.reporter(),
		})
		await runner.run((t) => {
			t.run("async test", async t => {
				t.run("async child of async", async () => { })
				t.run("sync child of async", () => { })
			});
			t.run("sync test", t => {
				t.run("async child of sync", async () => { })
				t.run("sync child of sync", () => { })
			});
		});

		t.expect(order_reporter.order).toEqual([
			{ name: "async test", report: "started" },

			{ name: "async child of async", report: "started" },
			{ name: "async child of async", report: "completed" },
			{ name: "sync child of async", report: "started" },
			{ name: "sync child of async", report: "completed" },

			{ name: "async test", report: "completed" },


			{ name: "sync test", report: "started" },

			{ name: "async child of sync", report: "started" },
			{ name: "async child of sync", report: "completed" },
			{ name: "sync child of sync", report: "started" },
			{ name: "sync child of sync", report: "completed" },

			{ name: "sync test", report: "completed" },
		])
	})
})

vitest.describe("skipping tests", test => {
	test("nested async tests", async t => {
		const runner = new testing.Runner({})
		const results = await runner.run((t) => {
			t.run("async test", async t => {
				t.run("async child of async", async t => {
					t.skip();
				})
				t.run("sync child of async", () => { })
			});
			t.run("sync test", t => {
				t.run("async child of sync", async () => { })
				t.run("sync child of sync", t => {
					t.skip();
				})
			});
		});

		t.onTestFailed(() => console.log(inspect(results, false, 4, true)))
		t.expect(results.childrenSummary()).toEqual({ skipped: 2, passed: 2, failed: 0 });
		t.expect(results.children[0].childrenSummary()).toEqual({ skipped: 1, passed: 1, failed: 0 });
		t.expect(results.children[0].children[0].childrenSummary()).toBeNull()
		t.expect(results.children[0].children[1].childrenSummary()).toBeNull()
		t.expect(results.children[1].childrenSummary()).toEqual({ skipped: 1, passed: 1, failed: 0 });
		t.expect(results.children[1].children[0].childrenSummary()).toBeNull()
		t.expect(results.children[1].children[1].childrenSummary()).toBeNull()
	})
})
