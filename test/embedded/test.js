import * as embedded_build from "../embedded/build.js"
import { hash } from "crypto";
import * as fs from "fs";
import * as io from "../io.js";
import { safe } from "../try.js";
import paths from "path";

export default class Test {

	/**
		* @param {object} def
		* @param {string} def.results_dir_path
		* @param {string} def.name
		* @param {string} def.test_vault_dir_path
		* @param {string} def.entry_file_path
		*/
	constructor({
		results_dir_path,
		name,
		test_vault_dir_path,
		entry_file_path,
	}) {
		this.results_dir_path = results_dir_path;
		this.name = name;
		this.test_vault_dir_path = test_vault_dir_path;
		this.entry_file_path = entry_file_path;

		this.results_metadata_path = paths.join(results_dir_path, "results.json");
		this.results_log_path = paths.join(results_dir_path, "logs.txt");
	}

	/** @type {Array<{ name: string, test: Test }>} */
	depends_on = [];

	/** 
		* @this {Test}
		*
		* @param {string} name
		* @param {Test} test
		*/
	dependOn(name, test) {
		this.depends_on.push({ name, test })
	}

	/**
		* @this {Test}
		*
		* @param {string} name
		* @param {io.Logger} logger
		*
		* @returns {Promise<boolean>}
		*/
	async maybeRun(name, logger) {
		const prev = await this.previousRun();
		let dep_success = false;
		if (prev == null) {
			logger.info(`no previous ${name} run, running ${name} tests`)
			dep_success = await this.run(logger.createChild());
		} else {
			logger.info(`checking if ${name} run is up to date...`)
			const up_to_date = await prev.upToDate(logger.createChild(), this.entry_file_path)
			if (!up_to_date || prev.status === "FAILED") {
				logger.info(`previous ${name} run is not up to date, running ${name} tests`)
				dep_success = await this.run(logger.createChild());
			} else {
				logger.info(`previous ${name} run is up to date`)
				dep_success = prev.status === "PASSED";
			}
		}
		if (!dep_success) {
			logger.error(`${name} tests did not pass, cannot run task`);
			return false;
		}
		logger.info(` ✓ ${name} tests passed`);
		return true;
	}

	/**
		* @this {Test}
		*
		* @param {string} name
		* @param {io.Logger} logger
		*
		* @returns {Promise<boolean>}
		*/
	async check(name, logger) {
		const prev = await this.previousRun();
		let dep_success = false;
		if (prev == null) {
			logger.info(`no previous ${name} run`)
			return false;
		} else {
			logger.info(`checking if ${name} run is up to date...`)
			const up_to_date = await prev.upToDate(logger.createChild(), this.entry_file_path)
			if (!up_to_date) {
				logger.info(`previous ${name} run is not up to date`)
				return false;
			} else {
				logger.info(`previous ${name} run is up to date`)
				dep_success = prev.status === "PASSED";
			}
		}
		if (!dep_success) {
			logger.error(`${name} tests did not pass, cannot run task`);
			return false;
		}
		logger.info(` ✓ ${name} tests passed`);
		return true;
	}

	/** 
		* @this {Test}
		*
		* @param {io.Logger} logger 
		*
		* @returns {Promise<boolean>}
		*/
	async run(logger) {
		if (this.depends_on.length > 0) {
			for (const dependency of this.depends_on) {
				if (await dependency.test.maybeRun(dependency.name, logger)) {
					// continue
				} else {
					return false;
				}
			}
		}

		const test_logger = new io.BufferedLogger({});
		const passed = await embedded_build.test(
			this.test_vault_dir_path,
			this.name,
			this.entry_file_path,
			logger,
			new io.ConcurrentLogger(test_logger.logger(), logger.createChild()).logger(),
		)
		if (typeof passed !== "boolean") {
			return false;
		}

		const static_build = await embedded_build.buildObsidianPlugin(this.entry_file_path, logger.createChild(undefined, 0), -1)
		/** @type {Record<string, string>} */
		const hashes = {};
		for (const entry of static_build) {
			for (const chunk of entry.output) {
				if (chunk.type === "chunk") {
					hashes[chunk.fileName] = hash("md5", chunk.code);
				}
			}
		}

		const metadata = new PreviousRun({
			hashes,
			obsidian_version: await embedded_build.obsidianVersion(),
			status: passed ? "PASSED" : "FAILED",
		});

		if (!fs.existsSync(this.results_dir_path)) {
			logger.info("creating result directory")
			fs.mkdirSync(this.results_dir_path, { recursive: true })
		}

		logger.info("writing results metadata")
		fs.writeFileSync(
			this.results_metadata_path,
			JSON.stringify(metadata, undefined, "\t"),
		);

		logger.info("writing test logs")
		fs.writeFileSync(
			this.results_log_path,
			test_logger.logs.join("\n"),
		);

		return passed
	}



	/**
		* @this {Test}
		*
		* @returns {Promise<PreviousRun | null>}
		*/
	async previousRun() {
		const content = safe(() => fs.readFileSync(this.results_metadata_path, "utf8"));
		if (content instanceof Error) {
			return null;
		}
		const parsed = safe(() => JSON.parse(content));
		if (parsed instanceof Error) {
			return null;
		}

		return new PreviousRun(parsed);
	}

}

class PreviousRun {
	hashes;
	obsidian_version;
	status;

	/** 
		* @param {object} def
		* @param {Record<string, string>} def.hashes
		* @param {string} def.obsidian_version
		* @param {string} def.status
		* */
	constructor(def) {
		this.hashes = def.hashes;
		this.obsidian_version = def.obsidian_version;
		this.status = def.status;
	}

	/**
		* @this {PreviousRun}
		*
		* @param {io.Logger} logger
		* @param {string} entry_file_path 
		*
		* @returns {Promise<boolean>}
		*/
	async upToDate(logger, entry_file_path) {
		if (this.obsidian_version !== await embedded_build.obsidianVersion()) {
			return false;
		}

		logger.info("building static build to compare to cache")
		const static_build = await embedded_build.buildObsidianPlugin(entry_file_path, logger.createChild(), -1)
		/** @type {Record<string, string>} */
		const hashes = {};
		for (const entry of static_build) {
			for (const chunk of entry.output) {
				if (chunk.type === "chunk") {
					hashes[chunk.fileName] = hash("md5", chunk.code);
				}
			}
		}

		if (Object.keys(hashes).length !== Object.keys(this.hashes).length) {
			return false;
		}

		for (const [key, value] of Object.entries(hashes)) {
			if (this.hashes[key] !== value) return false
		}

		return true;

	}
}
