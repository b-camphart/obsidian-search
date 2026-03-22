import * as testing from "../framework"
import * as obsidian from "../obsidian"


const tests = import.meta.glob<true, string, (t: testing.Suite, files: obsidian.Files<any>) => Promise<void>>("./**/test.*.ts", { eager: true, import: "default" })

export function allTests<F>(): Array<{ filename: string, run: (this: void, t: testing.Suite, files: obsidian.Files<F>) => Promise<void> }> {
	return Object.entries(tests).map(([filename, fn]) => ({ filename, run: fn }))
}

export async function runTests<File>(logger: testing.Logger, files: obsidian.Files<File>) {
	const tester = new testing.Suite(logger);

	for (const [filename, fn] of Object.entries(tests)) {
		await tester.suite(filename, run => fn(run, files));
	}

}
