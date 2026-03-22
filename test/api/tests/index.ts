
import * as testing from "../../framework";
import type * as obsidian from "obsidian"

type TestFn = (this: void, t: testing.Test, app: obsidian.App) => Promise<void>

const all_tests = import.meta.glob<true, string, TestFn>(["./*.ts", "!./index.ts"], { eager: true, import: "default" })

export function allTests(): Array<{ filename: string, run: TestFn }> {
	return Object.entries(all_tests).map(([filename, fn]) => ({ filename, run: fn }))
}

export async function runTests(runner: testing.Runner, app: obsidian.App): Promise<boolean> {
	const result = await runner.run(t => {
		for (const [filename, fn] of Object.entries(all_tests)) {
			t.test(filename.slice(1), t => fn(t, app))
		}
	})

	return result.status === testing.Status.Passed;
}
