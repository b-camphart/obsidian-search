import { TFile, type App } from "obsidian";
import { TestContext, test } from "node:test";
import { createTempFile, FileCreation } from "./lib/obsidian";
import { inspect } from "util";
import { filesystemIsCaseSensitive } from "./lib/os";

export type Search = {
	findMatches(query: string, log?: TestContext["diagnostic"]): Promise<Array<Match>>;
	explain(query: string): Promise<string>;
};

export type SearchFn = (query: string, log?: TestContext["diagnostic"]) => Promise<Array<Match>>;
export type Match = {
	file: {
		name: string;
		path: string;
	};
	content: string;
};

export type SearchContract = (
	search: SearchFn,
	file: (props: FileCreation, explanation?: string) => Promise<QueryRuleExpectation<unknown>>,
) => Promise<void>;

export function searchContractTest(name: string, contract: SearchContract) {
	const combo: SearchContract = async (search, file) => {
		await test(name, () => contract(search, file));
	};

	return combo;
}

class Skip {
	reason: unknown;
	constructor(reason: unknown) {
		this.reason = reason;
	}
}
type Continued<T> = T extends Skip ? never : T;

export async function exampleQuery(search: SearchFn, query: string, rules: QueryRule[]) {
	const queryStack = (new Error().stack ?? "").split("\n").slice(2).join("\n");

	await test(`Example: \x1b[34m\`${query}\`\x1b[0m`, async (t) => {
		for (const rule of rules) {
			await test(rule.name, async () => {
				for (const testCase of rule.cases) {
					await test(testCase.name, async (t) => {
						let setup;
						try {
							setup = await testCase.setup?.call(t);
						} catch (e) {
							throw new Error(`Failed during setup\n` + `Query: ${query}`, {
								cause: e,
							});
						}
						if (setup instanceof Skip) {
							t.skip(String(setup.reason));
							return;
						}
						testCase.after?.call(t, setup);
						const messages: string[] = [];
						const matches = await search(query, (message) => {
							messages.push(...message.split("\n"));
						});
						if (!testCase.check.call(t, matches, setup)) {
							const failure = new Error(
								[
									`\`${query}\` ${rule.name}\n  ${testCase.name}`,
									"",
									`Query: \x1b[34m\`${query}\`\x1b[0m`,
									"  " + messages.join("\n  "),
									testCase.failureMessage,
								].join("\n"),
							);
							failure.stack = failure.message + "\n" + queryStack;

							throw failure;
						}
					});
				}
			});
		}
	});
}

type QueryRule = {
	name: string;
	cases: Array<QueryRuleTestCase<unknown>>;
	location: string;
};

export function matches(name: string, expected: Array<QueryRuleExpectation>): QueryRule {
	const location = (new Error().stack ?? "").split("\n")[3];

	return {
		name: `matches ${name}`,
		location,
		cases: expected.map((expectation) => {
			return {
				name: `matches ${expectation.name}`,
				failureMessage: `expected to find ${expectation.name}`,
				check: expectation.check,
				setup: "setup" in expectation ? expectation.setup : undefined,
				after: expectation.after,
			};
		}),
	};
}

export function doesNotMatch(name: string, expected: Array<QueryRuleExpectation>): QueryRule {
	const location = (new Error().stack ?? "").split("\n")[3];
	return {
		location,
		name: `does not match ${name}`,
		cases: expected.map((expectation): QueryRuleTestCase => {
			const name = `does not match ${expectation.name}`;
			const failureMessage = `expected not to find ${expectation.name}`;
			if (expectation.setup) {
				return {
					name,
					failureMessage,
					setup: expectation.setup,
					check: function (matches, prep) {
						return !expectation.check.call(this, matches, prep);
					},
					after: expectation.after,
				};
			} else {
				return {
					name,
					failureMessage,
					check: function (this: TestContext, matches: Match[]) {
						return !expectation.check.call(this, matches);
					},
					after: expectation.after,
				};
			}
		}),
	};
}

type QueryRuleTestCase<T = void> = {
	name: string;
	failureMessage: string;
} & (
	| {
			setup?: undefined;
			check(this: TestContext, matches: Match[]): boolean;
			after?(this: TestContext): void;
	  }
	| {
			setup(this: TestContext): T;
			check(this: TestContext, matches: Match[], prep: Continued<Awaited<T>>): boolean;
			after?(this: TestContext, prep: Awaited<T>): void;
	  }
);

type QueryRuleExpectation<T = void> = {
	name: string;
} & (
	| {
			setup?: undefined;
			check(this: TestContext, matches: Match[]): boolean;
			after?(this: TestContext): void;
	  }
	| {
			setup(this: TestContext): T;
			check(this: TestContext, matches: Match[], prep: Continued<Awaited<T>>): boolean;
			after?(this: TestContext, prep: Continued<Awaited<T>>): void;
	  }
);

export function matchFile(
	app: App,
	creation: FileCreation,
	options: {
		/** explain why this file is being tested */
		because?: string;
		/** what to do if the file fails to be created */
		catch?: (this: TestContext, e: unknown) => unknown;
	} = {},
): QueryRuleExpectation<Promise<TFile | Skip>> {
	const { because: explanation = "" } = options;

	return {
		name: `a file with ` + inspect(creation) + (explanation ? `, because ${explanation}` : ""),
		setup: async function () {
			return await createTempFile(app, creation).catch((e) => {
				/*
				if (e instanceof Error) {
					if (e.message.includes("File already exists")) {
						if (creation.path || creation.name) {
							const existing = app.vault.getFileByPath(
								creation.path || creation.name + ".md",
							);
							if (existing) {
								return existing;
							}
						}
					}
				}*/
				const caught = options.catch?.call(this, e);
				if (caught instanceof TFile) {
					return caught;
				}
				if (caught) {
					return new Skip(caught);
				}
				// if we couldn't find the existing file, just throw
				throw e;
			});
		},
		check: (matches: Match[], file): boolean => {
			let match: Match | null = null;
			if (filesystemIsCaseSensitive()) {
				match = matches.find((it) => it.file.path === file.path) ?? null;
			} else {
				match =
					matches.find((it) => it.file.path.toLowerCase() === file.path.toLowerCase()) ??
					null;
			}
			return match != null;
		},
		after: function (file) {
			this.after(() => {
				app.vault.delete(file, true);
			});
		},
	};
}

export async function fileMatch(
	app: App,
	creation: FileCreation,
	explanation?: string,
): Promise<QueryRuleExpectation<Promise<TFile>>> {
	return {
		name: `a file with ` + inspect(creation) + (explanation ? `, because ${explanation}` : ""),
		setup: async () => {
			return await createTempFile(app, creation);
			/*.catch((e) => {
				if (e instanceof Error) {
					if (e.message.includes("File already exists")) {
						if (creation.path || creation.name) {
							try {
								const existing = app.vault.getFileByPath(
									creation.path || creation.name + ".md",
								);
								if (existing) {
									return existing;
								}
							} catch (e) {
								throw new Error(`Could not read exiting file`, {
									cause: e,
								});
							}
						}
					}
				}
				// if we couldn't find the existing file, just throw
				throw e;
			});*/
		},
		check: (matches: Match[], file): boolean => {
			let match: Match | null = null;
			if (filesystemIsCaseSensitive()) {
				match = matches.find((it) => it.file.path === file.path) ?? null;
			} else {
				match =
					matches.find((it) => it.file.path.toLowerCase() === file.path.toLowerCase()) ??
					null;
			}
			return match != null;
		},
		after: function (file) {
			this.after(() => {
				app.vault.delete(file, true);
			});
		},
	};
}
