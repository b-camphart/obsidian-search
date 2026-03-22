import * as vite from "vite";
import * as net from "net"
import * as path from "path";
import * as fs from "fs/promises"
import * as fs_sync from "fs";
import * as crypto from "crypto"
import child_process from "child_process"
import kill from "tree-kill"

/** @returns {net.Server} */
function startTestReporter() {
	const server = net.createServer();
	server.listen(0);
	return server;
}

/** @param{string} entry
*  @param {number} port
* */
export function build(entry, port) {
	return vite.build({
		build: {
			write: false,
			target: "esnext",
			minify: false,
			sourcemap: "inline",
			lib: {
				entry,
				formats: ["cjs"],
			},
			rollupOptions: {
				external: ["obsidian", "net", "util", "process", "path"],
				output: {
					format: "cjs",
				}
			}
		},
		define: {
			"__TEST_RUNNER_PORT__": port, // use constant for now to ensure identical output
		},
		resolve: {
			alias: {
				"src": path.resolve("./src"),
			}
		},
		configFile: false,
	});
}

/** 
	* @param {string} test_vault
	* @param {import("rollup").RollupOutput[]} bundle
	* @returns {Promise<string>} */
async function createObsidianTestVault(test_vault, bundle) {
	// const test_vault = import.meta.resolve("./test_vault").substring("file://".length)
	const test_plugin_name = "tests";
	const test_plugin_dir = path.join(test_vault, ".obsidian", "plugins", test_plugin_name);
	if (!fs_sync.existsSync(test_plugin_dir)) {
		await fs.mkdir(test_plugin_dir, { recursive: true });
	}

	const manifest = {
		id: test_plugin_name,
		name: "Obsidian Search Integration Tests",
		version: "1.0.0",
		minAppVersion: "1.4.14",
		description: "None",
		author: "this",
		authorUrl: "this",
		isDesktopOnly: false
	}
	await fs.writeFile(path.join(test_plugin_dir, 'manifest.json'), JSON.stringify(manifest));

	for (const chunk of bundle) {
		for (const file of chunk.output) {
			if (file.fileName.endsWith(".cjs")) {
				const main_js_path = test_plugin_dir + "/main.js";
				await fs.writeFile(main_js_path, file.code, { encoding: "utf8" });
			}
		}
	}

	await fs.writeFile(path.join(test_vault, ".obsidian", "community-plugins.json"), `["tests"]`, { encoding: "utf8" });
	return test_vault;
}

/** 
	* @param {net.Server} server
	* @param {string} test_vault 
	* @returns {Promise<Error | null>} */
async function run(server, test_vault) {

	const config = (await import("./obsidian.config.json", { with: { type: "json" } })).default;

	// create vault
	/** @type {{ vaults: Record<string, { path: string, ts: number, open?: boolean }>}} */
	const obsidian_cache = JSON.parse(await fs.readFile(config.obsidian.support, "utf8"));
	for (const vault of Object.values(obsidian_cache.vaults)) {
		if (vault.open) {
			delete vault.open;
		}
	}
	const vault_id = crypto.hash("md5", test_vault);
	obsidian_cache.vaults[vault_id] = {
		path: test_vault,
		ts: Date.now(),
	};

	await fs.writeFile(config.obsidian.support, JSON.stringify(obsidian_cache), { encoding: "utf8" });

	/** @type {Promise<Error | null>} */
	const async_result = new Promise(resolve => {
		/** @type {child_process.ChildProcess | null} */
		let obsidian_process = null;

		server.on("connection", socket => {
			socket.setEncoding("utf8");
			let buffer = "";

			socket.on("data", chunk => {
				buffer += chunk;
				let null_term = -1
				while ((null_term = buffer.indexOf("\0")) >= 0) {
					if (buffer.startsWith("ERROR")) {
						console.error(buffer.substring("ERROR".length, null_term))
					} else if (buffer.startsWith("WARN")) {
						console.warn(buffer.substring("WARN".length, null_term))
					} else if (buffer.startsWith("INFO")) {
						console.log(buffer.substring("INFO".length, null_term));
					} else {
						console.log(buffer.substring(null_term));
					}
					buffer = buffer.substring(null_term + 1);
				}
			});
			socket.on("error", (err) => {
				kill(obsidian_process.pid, () => {
					resolve(err)
				});
			})
			socket.on("close", () => {
				kill(obsidian_process.pid, () => {
					resolve(null);
				});
			})
		});

		const cmd = config.obsidian.launch_vault.replace("{0}", test_vault.replace(" ", "%20"));
		obsidian_process = child_process.exec(cmd);
		obsidian_process.on("message", (msg) => {
			console.log(msg);
		})
		obsidian_process.on("spawn", () => {
			console.log("obsidian spawned child process")
		})
		obsidian_process.on("error", (err) => {
			resolve(err)
		})
		obsidian_process.on("exit", () => {
			console.error("obsidian exited unexpectedly")
			// resolve(new Error(`obsidian exited unexpectedly from '${cmd}'`)) // if not yet resolved, this should indicate failure
		});
		obsidian_process.on("close", () => {
			resolve(new Error(`obsidian closed unexpectedly from '${cmd}'`)) // if not yet resolved, this should indicate failure
		})
	});

	return async_result;
}

/** 
	* @param {{ entry: string, vault_path: string }} config
	* @returns {Promise<Error | null>}
*/
export async function test(config) {
	const server = startTestReporter();
	const bundle = await build(config.entry, server.address().port);
	const vault = await createObsidianTestVault(config.vault_path, bundle)
	const success = await run(server, vault);
	server.close();
	return success;
}
