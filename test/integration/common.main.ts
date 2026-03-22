import * as obsidian from "obsidian";
import net from "net";

import { Files } from "./obsidian";
import { inspect } from "util";
import { join } from "path";

declare const __TEST_RUNNER_PORT__: number;

export function ObsidianFiles(plugin: obsidian.Plugin, search: (query: string) => Promise<typeof Files.SearchMatch.prototype[]>) {
	return new Files<obsidian.TFile>(
		async (name, body = "", frontmatter) => {
			if (frontmatter) {
				let prefix = "---\n";
				if (frontmatter.tags) {
					prefix += "tags:\n"
					frontmatter.tags.forEach(tag => prefix += "  - " + tag + "\n")
				}
				if (frontmatter.aliases) {
					prefix += "aliases:\n"
					frontmatter.aliases.forEach(alias => prefix += `  - ${alias}\n`)
				}
				if (frontmatter.properties) {
					for (const [prop, value] of Object.entries(frontmatter.properties)) {
						prefix += `${prop}: ${value}\n`
					}
				}
				prefix += "---\n";
				body = prefix + body;
			}
			const path_parts = name.split("/");
			if (path_parts.length > 1) {
				const folder_path = join(...path_parts.slice(0, -1));
				if (!plugin.app.vault.getFolderByPath(folder_path)) {
					await plugin.app.vault.createFolder(folder_path);
				}
			}
			const file = await plugin.app.vault.create(name, body);
			if (plugin.app.metadataCache.getFileCache(file) == null) {
				return new Promise(resolve => {
					const ref = plugin.app.metadataCache.on("resolved", () => {
						if (plugin.app.metadataCache.getFileCache(file) != null) {
							plugin.app.metadataCache.offref(ref);
							resolve(file);
						}
					});
				})
			}
			return file;
		},
		async (file) => {
			await plugin.app.vault.delete(file, true)
			const path_parts = file.name.split("/")
			if (path_parts.length > 1) {
				const folder_path = join(...path_parts.slice(0, -1))
				const folder = plugin.app.vault.getFolderByPath(folder_path);
				if (!folder) return;
				if (folder.children.length === 0) {
					await plugin.app.vault.delete(folder, true);
				}
			}
		},
		search,
		async (file) => {
			return plugin.app.vault.cachedRead(file)
		},
	);
}

export class SocketLogger {
	#socket;

	constructor(
		port: number = __TEST_RUNNER_PORT__
	) {
		this.#socket = net.createConnection({ port });
	}

	#sendMessage(this: SocketLogger, ...data: unknown[]) {
		let buffer: Array<string> = [];
		for (const entry of data) {
			if (typeof entry === "string") {
				buffer.push(entry)
			} else {
				buffer.push(inspect(entry, undefined, 4, true));
			}
		}
		this.#socket.write(buffer.join(" ") + "\0")
	}

	error(this: SocketLogger, message?: unknown, ...optionalParams: unknown[]): void {
		this.#socket.write("ERROR")
		this.#sendMessage(message, ...optionalParams);
	}
	warn(this: SocketLogger, message?: unknown, ...optionalParams: unknown[]): void {
		this.#socket.write("WARN")
		this.#sendMessage(message, ...optionalParams);
	}
	log(this: SocketLogger, message?: unknown, ...optionalParams: unknown[]): void {
		this.#socket.write("INFO")
		this.#sendMessage(message, ...optionalParams);
	}

	end(this: SocketLogger) {
		this.#socket.end();
	}

}

export function Plugin(
	onload: (plugin: obsidian.Plugin) => Promise<void>,
): typeof obsidian.Plugin {
	return class extends obsidian.Plugin {
		onload(): void {
			this.app.workspace.onLayoutReady(async () => {
				await onload(this);
			})
		}
	}

}
