import * as util from "util";

function callingLocation() {
	// stack[0] - message
	// stack[1] - `callingLocation`
	// stack[2] - function using callingLocation
	// stack[3] - actual location
	return (new Error().stack ?? "message\ncallingLocation\ncaller\n")
		.split("\n")[3]
		.trimStart();
}

const FAIL_NOW = Symbol();
const SKIP = Symbol();

export class Reporter<Impl = any> {
	impl;
	vtable;

	constructor({
		impl,
		...vtable
	}: {
		impl: Impl;
		testStarted(reporter: Reporter<Impl>, name: string, test: Test): void;
		testCompleted(
			reporter: Reporter<Impl>,
			name: string,
			test: Test,
			result: Result,
		): void;
	}) {
		this.impl = impl;
		this.vtable = vtable;
	}

	testStarted(this: Reporter, name: string, test: Test): void {
		this.vtable.testStarted(this, name, test);
	}

	testCompleted(
		this: Reporter,
		name: string,
		test: Test,
		result: Result,
	): void {
		this.vtable.testCompleted(this, name, test, result);
	}
}

export class Writer<Impl = any> {
	impl;
	data: string = "";
	write_fn;

	constructor(def: {
		impl: Impl;
		write: (writer: Writer<Impl>, data: string) => void;
	}) {
		this.impl = def.impl;
		this.write_fn = def.write;
	}

	write(this: Writer<Impl>, data: string): void {
		this.data += data;
	}

	flush(this: Writer<Impl>): void {
		const data = this.data;
		this.data = "";
		this.write_fn(this, data);
	}
}

/** Reports as tests start and then end.  Only failed tests print logs */
export class StartStopReporter {
	static indent = "    ";

	output;

	constructor(def: { output: Writer }) {
		this.output = def.output;
	}

	ancestors: { name: string; written: boolean }[] = [];
	current: { name: string; written: boolean } | null = null;

	static #SummaryReporterVTable = Object.freeze({
		reportTestStarted: (
			reporter: Reporter<StartStopReporter>,
			name: string,
			_test: Test,
		) => {
			return reporter.impl.reportTestStarted(name);
		},
		reportTestCompleted: (
			reporter: Reporter<StartStopReporter>,
			name: string,
			test: Test,
			result: Result,
		) => {
			return reporter.impl.reportTestCompleted(name, test, result);
		},
	});

	reportTestStarted(this: StartStopReporter, name: string) {
		if (this.current !== null) {
			this.ancestors.push(this.current);
		}
		this.current = { name, written: false };
	}

	reportTestCompleted(
		this: StartStopReporter,
		name: string,
		test: Test,
		result: Result,
	) {
		if (result.status === Status.Passed && this.ancestors.length > 0) {
			this.current = this.ancestors.pop() ?? null;
			return;
		}
		this.ancestors.forEach((ancestor, index) => {
			if (ancestor.written) return;
			this.output.write(StartStopReporter.indent.repeat(index));
			let prefix = "TEST";
			if (result.status === Status.Failed) {
				prefix = "\u001b[31mFAIL\u001b[39m";
			}
			this.output.write(`${prefix} ${ancestor.name}\n`);
			ancestor.written = true;
		});

		const indent = StartStopReporter.indent.repeat(this.ancestors.length);
		this.current = this.ancestors.pop() ?? null;

		let prefix = "";
		switch (result.status) {
			case Status.Failed: {
				prefix = "\u001b[31mFAIL\u001b[39m";
				break;
			}
			case Status.Passed: {
				prefix = "\u001b[32mPASS\u001b[39m";
				break;
			}
			case Status.Skipped: {
				prefix = "\u001b[33mSKIP\u001b[39m";
				break;
			}
			default:
				throw new Error(
					"reported test completed, but status is " +
						Status[result.status],
				);
		}

		this.output.write(`${indent}${prefix} ${name}\n`);
		if (this.current) {
			this.current.written = true;
		}

		if (result.status === Status.Failed) {
			const log_indent = indent + StartStopReporter.indent;
			test.logs.forEach(({ location, args }) => {
				this.output.write(`${log_indent}${location}: `);
				args.forEach((arg) => {
					const lines = arg.split("\n");
					this.output.write(lines[0] + "\n");
					lines
						.slice(1)
						.forEach((line) =>
							this.output.write(log_indent + line + "\n"),
						);
				});
			});
		}
		this.output.flush();
	}

	reporter(this: StartStopReporter): Reporter<StartStopReporter> {
		return new Reporter({
			impl: this,
			testStarted:
				StartStopReporter.#SummaryReporterVTable.reportTestStarted,
			testCompleted:
				StartStopReporter.#SummaryReporterVTable.reportTestCompleted,
		});
	}
}

export class ScheduledTest {
	name;
	fn;

	constructor({
		name,
		fn,
	}: {
		name: string;
		fn: (test: Test) => void | Promise<void>;
	}) {
		this.name = name;
		this.fn = fn;
	}
}

function stringifyArgs(args: any[]): string[] {
	return args.map((arg) => {
		if (typeof arg === "string") {
			return arg;
		}
		return util.inspect(arg, undefined, null, undefined);
	});
}

export class Test {
	status: Status = Status.Running;
	logs: Array<{ location: string; args: string[] }> = [];
	cleanup_fns: Array<(test: Test) => any> = [];

	reporter: Reporter;

	constructor({ reporter }: { reporter: Reporter }) {
		this.reporter = reporter;
	}

	children: Array<ScheduledTest> = [];

	run(this: Test, name: string, fn: (test: Test) => void | Promise<void>) {
		this.children.push(new ScheduledTest({ name, fn }));
	}
	test(this: Test, name: string, fn: (test: Test) => void | Promise<void>) {
		this.run(name, fn);
	}
	suite(this: Test, name: string, fn: (test: Test) => void | Promise<void>) {
		this.run(name, fn);
	}

	skip(this: Test): never {
		if (this.status >= Status.Skipped) {
			throw new Error(
				"cannot skip a test that has already finished.  Did you call 'skip' in an 'after' call?",
			);
		}
		this.status = Status.Skipped;
		throw SKIP;
	}

	fail(this: Test) {
		this.status = Status.Failed;
	}

	failNow(this: Test): never {
		this.fail();
		throw FAIL_NOW;
	}

	failWith(this: Test, ...args: any[]) {
		this.logs.push({
			location: callingLocation(),
			args: stringifyArgs(args),
		});
		this.fail();
	}

	failNowWith(this: Test, ...args: any[]): never {
		this.logs.push({
			location: callingLocation(),
			args: stringifyArgs(args),
		});
		this.failNow();
	}

	log(this: Test, ...args: any[]) {
		this.logs.push({
			location: callingLocation(),
			args: stringifyArgs(args),
		});
	}

	after(this: Test, fn: (test: Test) => any) {
		this.cleanup_fns.push(fn);
	}
}

class Result {
	status;
	children: Result[];

	constructor({ status, children }: { status: Status; children?: Result[] }) {
		this.status = status;
		this.children = children ?? [];
	}

	#summary: null | { skipped: number; passed: number; failed: number } = null;
	childrenSummary(
		this: Result,
	): null | { skipped: number; passed: number; failed: number } {
		if (this.children.length === 0) return null;
		if (this.#summary !== null) return this.#summary;
		this.#summary = { skipped: 0, passed: 0, failed: 0 };
		for (const child of this.children) {
			const child_summary = child.childrenSummary();
			if (child_summary === null) {
				switch (child.status) {
					case Status.Skipped: {
						this.#summary.skipped += 1;
						break;
					}
					case Status.Passed: {
						this.#summary.passed += 1;
						break;
					}
					case Status.Failed: {
						this.#summary.failed += 1;
						break;
					}
				}
			} else {
				this.#summary.skipped += child_summary.skipped ?? 0;
				this.#summary.passed += child_summary.passed ?? 0;
				this.#summary.failed += child_summary.failed ?? 0;
			}
		}
		return this.#summary;
	}
}
export type { Result };

export class Runner {
	reporter: Reporter;

	constructor({ reporter }: { reporter?: Reporter }) {
		this.reporter =
			reporter ??
			new Reporter({
				impl: null,
				testStarted: () => {},
				testCompleted: () => {},
			});
	}

	async run(
		this: Runner,
		fn: (test: Test) => void | Promise<void>,
	): Promise<Result> {
		return runTest(new Test({ reporter: this.reporter }), fn);
	}
}

async function runTests(
	reporter: Reporter,
	scheduled: ScheduledTest[],
): Promise<Result[]> {
	const results: Result[] = [];
	for (const task of scheduled) {
		results.push(await run(reporter, task.name, task.fn));
	}
	return results;
}

async function run(
	reporter: Reporter,
	name: string,
	fn: (test: Test) => void | Promise<void>,
): Promise<Result> {
	const test = new Test({ reporter });
	reporter.testStarted(name, test);

	const result = await runTest(test, fn);

	reporter.testCompleted(name, test, result);

	return result;
}

async function runTest(
	test: Test,
	fn: (test: Test) => void | Promise<void>,
): Promise<Result> {
	const log = console.log;
	console.log = (...args) => test.log(...args);
	try {
		await fn(test);
	} catch (e) {
		if (e !== SKIP && e !== FAIL_NOW) {
			test.logs.push({ location: "", args: stringifyArgs([e]) });
			test.status = Status.Failed;
		}
	} finally {
		console.log = log;
	}
	if (test.status !== Status.Failed && test.status !== Status.Skipped) {
		test.status = Status.Passed;
	}

	const result = new Result({
		status: test.status,
		children: await runTests(test.reporter, test.children),
	});

	if (result.children.some((it) => it.status === Status.Failed)) {
		result.status = test.status = Status.Failed;
	}

	for (const cleanup of test.cleanup_fns) {
		try {
			await cleanup(test);
		} catch (e) {
			if (e !== SKIP && e !== FAIL_NOW) {
				test.logs.push({ location: "AFTER", args: stringifyArgs([e]) });
			}
		}
	}

	return result;
}

export enum Status {
	Running,

	Skipped,
	Passed,
	Failed,
}
