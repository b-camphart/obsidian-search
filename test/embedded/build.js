import * as vite from "vite"
import * as yaml from "yaml"
import * as paths from "path"
import * as fs from "fs/promises"
import * as fs_sync from "fs"
import * as child_process from "child_process";
import * as net from "net"
import * as crypto from "crypto";
import * as util from "util";
import treeKill from "tree-kill";

import * as build from "../../build.js";
import * as embedded_sockets from "./sockets.js";
import { Logger } from "../io.js"

/** 
	* Builds an obsidian plugin using vite, reusing the top-level build config.  Defines a port for the plugin to send
	* messages back to.
	*
	* @param {string} entry 
	* @param {Logger} logger
	* @param {number} [port] the port that the plugin should send messages to
	* @returns {Promise<vite.Rollup.RollupOutput[]>}
	*/
export function buildObsidianPlugin(entry, logger, port = -1) {
	const config = build.build_config;
	config.resolve = {
		...config.resolve,
		alias: {
			...(config.resolve ?? {}).alias,
			"test": import.meta.resolve("../../test").substring("file://".length),
		}
	}
	config.customLogger = {
		info: (msg) => logger.info(msg),
		warn: (msg) => logger.warn(msg),
		error: (msg) => logger.error(msg),
	} 

	config.build = {
		...config.build,
		write: false,
		sourcemap: "inline",
		lib: {
			...(config.build ?? {}).lib,
			entry,
		},
	}


	config.define = {
		...config.define,
		"__TEST_RUNNER_PORT__": port,
	}

	return vite.build({...config})
}

/** 
	* @param {string} vault_path
	* @param {vite.Rollup.RollupOutput[]} bundle
	* @param {import("../io.js").Logger} logger 
	* @returns {Promise<string>} */
export async function createObsidianTestVault(vault_path, plugin_name, bundle, logger) {
	if (fs_sync.existsSync(vault_path)) {
		await fs.rm(vault_path, { recursive: true })
	}
	const test_plugin_dir = paths.join(vault_path, ".obsidian", "plugins", plugin_name);
	if (!fs_sync.existsSync(test_plugin_dir)) {
		logger.info(`creating plugin directory at ${test_plugin_dir}`);
		await fs.mkdir(test_plugin_dir, { recursive: true });
	} else {
		logger.info(`plugin directory exists at ${test_plugin_dir}`);
	}

	const manifest = {
		id: plugin_name,
		name: "Obsidian Search Integration Tests",
		version: "1.0.0",
		minAppVersion: "1.4.14",
		description: "None",
		author: "this",
		authorUrl: "this",
		isDesktopOnly: false
	}

	logger.info("creating manifest file for plugin")
	await fs.writeFile(paths.join(test_plugin_dir, 'manifest.json'), JSON.stringify(manifest));

	for (const chunk of bundle) {
		for (const file of chunk.output) {
			if (file.type === "chunk" && file.fileName.endsWith(".cjs")) {
				const main_js_path = paths.join(test_plugin_dir, "main.js");
				logger.info(`writing plugin main file at ${main_js_path}`)
				await fs.writeFile(main_js_path, file.code, { encoding: "utf8" });
			}
		}
	}

	logger.info("enabling plugin by adding it to list of community plugins")
	await fs.writeFile(paths.join(vault_path, ".obsidian", "community-plugins.json"), `["${plugin_name}"]`, { encoding: "utf8" });
	return vault_path;
}

/** @returns {Promise<string>} */
export async function obsidianVersion() {
	const lock_file_content = yaml.parse(await fs.readFile("pnpm-lock.yaml", "utf8"));
	return lock_file_content.importers["."].devDependencies.obsidian.version;
}

/** 
	* @param {string} vault_path
	* @param {import("../io.js").Logger} logger 
	*
	* @returns {Promise<child_process.ChildProcess>}
	*/
export async function launchObsidian(vault_path, logger) {
	logger.info("loading local obsidian config")
	const local_obsidian_config = await getOrCreateLocalObsidianConfig(logger.createChild());

	/** @type {{ vaults: Record<string, { path: string, ts: number, open?: boolean }>}} */
	const obsidian_cache = JSON.parse(await fs.readFile(local_obsidian_config.path_to_vaults));
	for (const vault of Object.values(obsidian_cache.vaults)) {
		if (vault.open) {
			delete vault.open;
		}
	}
	const vault_id = crypto.hash("md5", vault_path);
	obsidian_cache.vaults[vault_id] = {
		path: vault_path,
		ts: Date.now(),
	};

	await fs.writeFile(local_obsidian_config.path_to_vaults, JSON.stringify(obsidian_cache), { encoding: "utf8" });

	const cmd = local_obsidian_config.launch_vault.replace("{0}", vault_path.replace(" ", "%20"));
	logger.info(`running command \`${cmd}\``)
	const obsidian_process = child_process.exec(cmd);
	obsidian_process.on("message", (msg) => logger.info(msg.toString()))
	obsidian_process.on("error", (e) => logger.error(util.inspect(e)))
	return obsidian_process;
}

/** 
	* @param {import("../io.js").Logger} logger 
	*
	* @returns {Promise<{ launch_vault: `${string}{0}${string}`, path_to_vaults: string }>} 
	*/
async function getOrCreateLocalObsidianConfig(logger) {
	const file_name = "obsidian_config.local.json";
	const path = import.meta.resolve(`./${file_name}`).substring("file://".length);

	let loaded;

	try {
		loaded = (await import("./" + file_name, { with: { type: "json" } })).default;
		if (typeof loaded.launch_vault !== "string") {
			logger.error("found local obsidian config file, but the 'launch_vault' field was missing or invalid");
		} else if (typeof loaded.path_to_vaults !== "string") {
			logger.error("found local obsidian config file, but the 'path_to_vaults' field was missing or invalid");
		} else {
			return loaded;
		}
	} catch (e) {
		logger.error(util.inspect(e))
		logger.warn(`no local obsidian config file found at ${path}`)
	}

	const valid = {
		launch_vault: loaded?.launch_vault ?? "<launch a url> \"obsidian://open?path={0}\"",
		path_to_vaults: loaded?.path_to_vaults ?? "<path to obsidian config file containing json with 'vaults' object>",
	}

	logger.info(`creating new local obsidian config file at ${path}`)
	await fs.writeFile(path, JSON.stringify(valid, undefined, "\t"), "utf-8");
	logger.info("modify your local obsidian config file to launch urls")
	process.exit(1);

}

/** 
	* Creates a server for receiving test messages from an embedded process.
	*
	* @param {vite.Logger} logger
	* @param {number} [port] the port to use, randomly chosen if omitted
	* @returns {Promise<net.Server>}
	*/
export function createTestServer(logger, port = 0) {
	return new Promise(resolve => {
		const server = net.createServer();
		server.listen(port, () => {
			logger.info(`test server created and listening at ${util.inspect(server.address())}`)
			resolve(server);
		});
	})
}

/**
	* @param {string} vault_path
	* @param {string} name 
	* @param {string} entry
	* @param {import("../io.js").Logger} logger
	* @param {import("../io.js").Logger} [test_logger] 
	* @returns {Promise<boolean | Error>}
	*/
export async function test(vault_path, name, entry, logger, test_logger) {
	logger.info("creating a test server")
	const server = await createTestServer(logger.createChild())
	logger.info(`building obsidian plugin using entry file '${entry}' and port ${server.address().port}`);
	const bundle = await buildObsidianPlugin(entry, logger.createChild(), server.address().port);
	logger.info(`creating obsidian test vault at '${vault_path}'`);
	await createObsidianTestVault(vault_path, name, bundle, logger.createChild());
	/** @type {Promise<boolean>} */
	const promise = new Promise((resolve, reject) => {
		const wait_for_connection = setTimeout(() => reject(new Error("took too long for embedded plugin to launch and connect")), 5000)
		server.on("connection", (socket) => {
			clearTimeout(wait_for_connection);
			logger.info("received connection")
			const connection_logger = test_logger ?? logger.createChild();
			socket.on("error", (e) => connection_logger.error(e))
			socket.on("close", (had_error) => resolve(!had_error))

			embedded_sockets.awaitResultSignal(socket, connection_logger, resolve, reject)
			setTimeout(() => reject("took too long for connection to close"), 10000);
		})
	})
	logger.info(`launching obsidian at ${vault_path}`)
	const obsidian = await launchObsidian(vault_path, logger.createChild())
	obsidian.on("exit", () => {
		logger.info("closing server")
		server.close((e) => {
			if (e) {
				logger.error(`server closed with ${util.inspect(e)}`)
			} else {
				logger.info("server closed")
			}
		})
	})

	/** @type {boolean} */
	let result = false;
	try {
		result = await promise
	} catch (e) {
		logger.error(e)
		return e instanceof Error ? e : new Error(String(e));
	} finally {
		logger.info("closing obsidian")
		await new Promise(resolve => {
			treeKill(obsidian.pid, resolve)
		})
	}

	return result;
}


