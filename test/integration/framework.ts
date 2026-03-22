const FAIL_NOW = Symbol();

export type Logger = Pick<Console, "error" | "warn" | "log">;

export class Suite {
	constructor(
		public logger: Pick<Console, "error" | "warn" | "log">,
		public parent: Suite | null = null,
	) { }

	#tests: Array<{ test: Test, fn: (t: Test) => (void | Promise<void>) }> = [];

	test(name: string, fn: (t: Test) => void | Promise<void>) {
		if (this.#ran) {
			this.logger.warn("already ran test suite, but trying to add", name, "test");
			return;
		}
		const nested = new Test(name, this);
		this.#tests.push({ test: nested, fn });
	}

	async suite(name: string, fn: (s: Suite) => Promise<void>) {
		if (this.#ran) {
			this.logger.warn("already ran test suite, but trying to add", name, "suite");
			return;
		}
		const err = new Error();
		const nested = new Suite({
			log: (...data) => this.logger.log("   ", ...data),
			warn: (...data) => this.logger.warn("   ", ...data),
			error: (...data) => this.logger.error("   ", ...data),
		}, this);

		this.logger.log("TEST", name);

		try {
			await fn(nested);
		} catch (cause) {
			err.cause = cause;
			this.logger.error("Failed to init suite", err);
		}

		await nested.run();

		if (nested.failed()) {
			this.logger.log("FAIL", name);
			this.fail();
		} else {
			this.logger.log("PASS", name);
		}
	}

	#ran = false;
	async run(this: Suite) {
		this.#ran = true;
		for (const { test, fn } of this.#tests) {
			this.logger.log("TEST", test.name);

			const { log } = console;

			try {
				console.log = (...args) => Test.addLog(test, ...args);
				await fn(test);
			} catch (err) {
				test.fail();
				if (err !== FAIL_NOW) {
					Test.addLog(test, err)
				}
			} finally {
				console.log = log;
				let failed_during_test = test.failed();
				if (failed_during_test) {
					this.logger.log("FAIL", test.name)
					for (const { location, args } of test.logs()) {
						this.logger.log(location, ...args);
					}
				} else {
					this.logger.log("PASS", test.name)
				}
				test.cleanup()
				this.#cleanupTest(test)
			}
		}

		for (const cleanup of this.#after_all_fns) {
			try {
				await cleanup(this);
			} catch (err) {
				this.fail();
				this.logger.error("Suite failed during cleanup", err);
			}
		}
	}

	#after_all_fns: Array<(s: Suite) => any> = [];
	afterAll<R>(this: Suite, fn: (s: Suite) => R | Promise<R>) {
		this.#after_all_fns.push(fn);
	}

	/** alias for afterAll */
	after<R>(this: Suite, fn: (s: Suite) => R | Promise<R>) {
		this.afterAll(fn);
	}

	#after_each_fns: Array<(t: Test) => any> = [];
	afterEach<R>(this: Suite, fn: (t: Test) => R | Promise<R>) {
		this.#after_each_fns.push(fn);
	}

	async #cleanupTest(this: Suite, test: Test) {
		for (const cleanup of this.#after_each_fns) {
			try {
				await cleanup(test);
			} catch (err) {
				test.fail();
				this.logger.error(test.name, "failed during cleanup", err);
			}
		}
		if (this.parent !== null) {
			this.parent.#cleanupTest(test);
		}
	}

	#failed = false;
	fail(this: Suite) {
		this.#failed = true;
		this.parent?.fail();
	}

	failed(this: Suite): boolean {
		return this.#failed;
	}

}

export { Suite as T }

class Test {
	constructor(
		public name: string,
		public parent: Suite,
	) { }

	get logger() {
		return this.parent.logger
	}

	#after_fns: Array<(t: Test) => any> = [];
	after<R>(this: Test, fn: (t: Test) => R | Promise<R>) {
		this.#after_fns.push(fn);
	}

	async cleanup(this: Test) {
		for (const cleanup of this.#after_fns) {
			try {
				await cleanup(this);
			} catch (err) {
				this.fail();
				this.logger.error(this.name, "failed during cleanup", err);
			}
		}
	}

	#failed = false;
	fail(this: Test) {
		this.#failed = true;
		this.parent.fail();
	}
	failed(this: Test): boolean {
		return this.#failed;
	}
	/** equivelant to calling `log(...args)` and then `fail()` */
	failWith(this: Test, ...args: any[]) {
		const location = new Error().stack!.split("\n")[2];
		this.#logs.push({ location, args });
		this.fail();
	}

	failNow(this: Test): never {
		this.fail();
		throw FAIL_NOW;
	}

	#logs: Array<{ location: string, args: any[] }> = [];
	log(this: Test, ...args: any[]) {
		const location = new Error().stack!.split("\n")[2];
		this.#logs.push({ location, args });
	}
	static addLog(this: typeof Test, test: Test, ...args: any[]) {
		test.#logs.push({ location: "", args })
	}
	logs(this: Test): ReadonlyArray<{ location: string, args: any[] }> {
		return this.#logs;
	}
}
