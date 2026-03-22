import * as obsidian from "obsidian";
import * as testing from "./framework";
import * as obsidian_search from "../../src/main";
import net from "net";

import * as tests from "../tests/root"
import { inspect } from "util";

declare const __TEST_RUNNER_PORT__: number;

export default class Plugin extends obsidian.Plugin {
	socket: net.Socket;

	onload(): void {
		this.socket = net.createConnection({ port: __TEST_RUNNER_PORT__ });

		const sendMessage = (data: any[]) => {
			let buffer: Array<string> = [];
			for (const entry of data) {
				if (typeof entry === "string") {
					buffer.push(entry)
				} else {
					buffer.push(inspect(entry));
				}
			}
			this.socket.write(buffer.join(" "))
		}

		const logger = {

			error: (...data: any[]) => {
				this.socket.write("ERROR");
				sendMessage(data);
				this.socket.write("\0");
			},
			warn: (...data: any[]) => {
				this.socket.write("WARN");
				sendMessage(data);
				this.socket.write("\0");
			},
			log: (...data: any[]) => {
				this.socket.write("INFO");
				sendMessage(data);
				this.socket.write("\0");
			}
		}

		const obsidian_adapter = new testing.Obsidian<obsidian.TFile>(
			async (name, body = "") => {
				const file = await this.app.vault.create(name, body);
				if (this.app.metadataCache.getFileCache(file) == null) {
					return new Promise(resolve => {
						const ref = this.app.metadataCache.on("resolved", () => {
							if (this.app.metadataCache.getFileCache(file) != null) {
								this.app.metadataCache.offref(ref);
								resolve(file);
							}
						});
					})
				}
				return file;
			},
			(file) => this.app.vault.delete(file, true),
			async (query) => {
				const leaves = this.app.workspace.getLeavesOfType("search");
				if (leaves.length === 0) throw new Error("could not find any leaves of type 'search'");
				if (!leaves[0].isVisible()) {
					this.app.workspace.setActiveLeaf(leaves[0]);
				}
				const search = leaves[0].view;
				search.setQuery(query);
				return new Promise(resolve => {
					const id = setInterval(() => {
						if (!search.queue.queue.runnable.running) {
							clearInterval(id);
						}
						resolve(Array.from(search.dom.resultDomLookup.keys()))
					}, 1)
				})
			},
		)

		this.app.workspace.onLayoutReady(async () => {
			await tests.runTests(logger, obsidian_adapter)
			this.socket.write("INFO\0")
			await tests.runTests(logger, new testing.Obsidian<obsidian.TFile>(
				obsidian_adapter.createFile,
				obsidian_adapter.deleteFile,
				async (query) => {
					const matches: Array<obsidian.TFile> = [];
					for await (const file of obsidian_search.search(query, this.app)) {
						matches.push(file)
					}
					return matches;
				}
			))
			this.socket.end();
		})
	}

	sendTestResult(this: Plugin, test_name: string, passed: boolean, details?: string) {
		const msg = JSON.stringify({ test: test_name, passed, details }) + "\n";
		this.socket.write(msg);
	}

	onunload() {
		this.socket.end();
	}

}
