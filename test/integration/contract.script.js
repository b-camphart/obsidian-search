import * as common from "./common.script.js";
import * as crypto from "crypto"
import yaml from "yaml"
import fs from "fs/promises"

const entry = import.meta.resolve("./contract.main.ts").substring("file://".length);
const results_file_path = import.meta.resolve("./contract_results.json").substring("file://".length);

async function calculateHashes() {
	const output = await common.build(entry, -1)
	const hashes = [];
	if (Array.isArray(output)) {
		for (const entry of output) {
			for (const chunk of entry.output) {
				const md5 = crypto.createHash("md5")
				md5.update(chunk.code)
				hashes.push(md5.digest("base64"))
			}
		}
	}
	return hashes;
}

/** @param{string} entry */
async function writeCachedSuccess() {
	const obsidian_version = await getInstalledDependencyVersion("obsidian");

	const file_content = JSON.stringify({
		version: obsidian_version,
		hashes: await calculateHashes(),
	});
	await fs.writeFile(
		results_file_path,
		file_content,
		"utf8"
	);
}

/** 
	* @param {string} dependency
	* @returns {Promise<string>}
*/
async function getInstalledDependencyVersion(dependency) {
	const lock_file_content = yaml.parse(await fs.readFile("pnpm-lock.yaml", "utf8"));
	// assumes we're looking for a devDependency
	return lock_file_content.importers["."].devDependencies[dependency].version;
}

/** @returns {Promise<Error | null>} */
export async function run() {
	console.log("Running contract tests")
	const err = await common.test({
		entry,
		vault_path: import.meta.resolve("./contract_test_vault").substring("file://".length),
	});
	if (err === null) {
		await writeCachedSuccess();
	}
	return err;
}

function setsEq(set1, set2) {
	return set1.size === set2.size && [...set1].every(item => set2.has(item));
}

/** @returns {Promise<boolean>} */
export async function ranSuccessfully() {
	let json = {};
	try {
		const file_content = await fs.readFile(results_file_path, "utf8");
		json = JSON.parse(file_content);
	} catch (e) {
		// assume file doesn't exist
		return false
	}
	if (json.version !== await getInstalledDependencyVersion("obsidian")) {
		return false
	}

	const expected_hashes = await calculateHashes();
	if (!setsEq(new Set(expected_hashes), new Set(json.hashes))) {
		return false
	}

	return true;
}

/** @returns {Promise<Error | null>} */
export async function maybeRun() {
	if (await ranSuccessfully()) {
		return null;
	}
	return run()
}

if (import.meta.url.includes(process.argv[1])) {
	run().then(err => {
		if (err !== null) {
			console.error(err);
			process.exit(1)
		} else {
			process.exit(0)
		}
	})
}
