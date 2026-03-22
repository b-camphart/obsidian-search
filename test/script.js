import { Logger } from "./io.js";

const [main_file, ...args] = process.argv.slice(1);

const test_types = {
	unit: {
		short: "Quickly tests isolated parts of production code.",
		description: "These tests live next to the code they're testing in a file suffixed with *.test.(ts|js)",
		/** @returns {Promise<import("vitest/node").Vitest>} */
		async run(...args) {
			const script = await import("./unit/script.js")
			const result = await script.run(...args);
			if (result.testModules.every(it => it.state() === "passed")) {
				process.exit(0)
			} else {
				process.exit(1)
			}
		}
	},
	api: {
		short: "Tests understandings of current obsidian API within obsidian itself.",
		description: "Tests understandings of the current obsidian API.  Don't need to be run frequently and cannot " +
			"be run in headless mode.  Typically run with contract tests, so the developer shouldn't need to run " +
			"these independently.",
		async run(..._args) {
			const script = (await import("./api/script.js")).default;
			if (await script.run(Logger.init({}))) {
				process.exit(0)
			} else {
				process.exit(1)
			}
		}
	},
	contract: {
		short: "Tests expected behavior of obsidian's search plugin within obsidian itself.",
		description: "Tests the expected behavior of obsidian's search plugin.  Cannot be run in headless mode.  These " +
			"tests MUST pass (or have passed for the current version of obsidian and production code) to allow " +
			"compliance or simulated tests to run.",
		async run(...args) {
			const script = (await import("./contract/script.js")).default
			if (await script.run(Logger.init({}))) {
				process.exit(0)
			} else {
				process.exit(1)
			}
		},
	},
	compliance: {
		short: "Tests production code within obsidian itself.",
		description: "Tests production code against verified behavior of obsidian's search plugin to ensure the two " +
			"are equivelant.  These tests will not run if api or contract tests have not yet passed.  Cannot be run " +
			"in headless mode.",
		async run(...args) {
			const script = (await import("./compliance/script.js")).default
			if (await script.run(Logger.init({}))) {
				process.exit(0)
			} else {
				process.exit(1)
			}
		},
	},
	simulated: {
		short: "Tests production code with a mocked version of obsidian's api.",
		description: "Tests production code with a mocked version of obsidian's api to allow headless testing.  Will " +
			"not run if unit or api tests have not yet passed.  This should NOT be used as a verification that " +
			"production code is ready to be released.  These may pass, but the mocked version of obsidian's api may " +
			"not be working correctly.",
		async run(...args) {
			const script = await import("./simulated/script.js");
		},
	},
	headless: {
		short: "Runs unit and simulated tests.  Default when omitting an argument.",
		description: "Runs unit and simulated tests.  The default test called by omitting an argument.",
		async run(...args) {
			const result = await (await import("./unit/script.js")).run(...args);
			if (!result.testModules.every(it => it.state() === "passed")) {
				process.exit(1)
			}

			const api = (await import("./api/script.js")).default;
			if (!await api.check("api", Logger.init({}))) {
				process.exit(1)
			}

			const contract = (await import("./contract/script.js")).default;
			if (!await contract.check("contract", Logger.init({}))) {
				process.exit(1)
			}

			const compliance = (await import("./compliance/script.js")).default;
			if (!await compliance.check("compliance", Logger.init({}))) {
				process.exit(1)
			}

			process.exit(0)
		},
	},
	all: {
		short: "Runs all tests, skipping previously verified successful tests.",
		description: "Runs all tests, skipping previously verified successful tests.  This should be run through the " +
			"github cli prior to releases.",
		async run(...args) {
		},
	}
}

if (args.length === 0) {
	test_types.headless.run();
} else {
	if (Object.hasOwn(test_types, args[0])) {
		if (args[1] === "-h") {
			console.group(`pnpm test ${args[0]}`)
			console.log(test_types[args[0]].description);
			console.groupEnd();
		} else {
			test_types[args[0]].run(...args.slice(1));
		}
	} else {
		if (args[0] === "-h") {
			console.group("Test commands:")
			let longest_command = "";
			for (const cmd of Object.keys(test_types)) {
				if (cmd.length > longest_command.length) longest_command = cmd;
			}
			for (const [cmd, def] of Object.entries(test_types)) {
				console.log(`pnpm test ${cmd.padEnd(longest_command.length, " ")}`, def.short)
			}
			console.groupEnd();
		} else {
			console.error("Did not recognize the test command '" + args[0] + "'");
			process.exit(1);
		}
	}
}
