import * as testing from "../../../test/framework";
import { Files } from "../../testing/files";
import { Search } from "../../testing/search";

type TestFn<File> = (this: void, t: testing.Test, files: Files<File>, search: Search) => Promise<void>

const all_tests = import.meta.glob<true, string, TestFn<any>>(["test/contract/tests/*.ts", "!test/contract/tests/index.ts"], { eager: true, import: "default" })

export function allTests<F>(): Array<{ filename: string, run: TestFn<F> }> {
	return Object.entries(all_tests).map(([filename, fn]) => ({ filename, run: fn }))
}

export async function runTests<File>(runner: testing.Runner, files: Files<File>, search: Search): Promise<boolean> {
	const result = await runner.run(t => {
		for (const [filename, fn] of Object.entries(all_tests)) {
			t.test(filename.slice(1), t => fn(t, files, search))
		}
	})

	return result.status === testing.Status.Passed;
}
