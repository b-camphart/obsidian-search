/* *
 * Responsible for running all unit tests in the project
 */
import * as vitest from 'vitest/node'
import * as build from "../../build.js"

export const config = await vitest.resolveConfig({
	setupFiles: [
		"test/assertions.ts"
	],
	include: ["**/*.test.ts"],
	includeSource: ["**/*.ts"],
	watch: false
}, build.build_config);

/** 
	* @param {string[]} filters
	* @returns {Promise<vitest.TestRunResult>}
*/
export async function run(...filters) {
	const runner = await vitest.createVitest("test", {
		setupFiles: config.vitestConfig.setupFiles,
		include: config.vitestConfig.include,
		watch: config.vitestConfig.watch,
	}, build.build_config)

	return runner.start(filters)
}

if (import.meta.url.includes(process.argv[1])) {
	const warning = "Prefer running unit tests using 'pnpm test unit' over calling this script file directly";
	console.warn("".padEnd(warning.length + 4, "-"))
	console.warn("|" + "".padEnd(warning.length + 2, " ") + "|")
	console.warn("| " + warning + " |")
	console.warn("|" + "".padEnd(warning.length + 2, " ") + "|")
	console.warn("".padEnd(warning.length + 4, "-"))
	await run(...process.argv.slice(2));
}

