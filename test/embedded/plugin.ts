import * as obsidian from "obsidian"
import * as net from "net"

import { inspect } from "util";

/** defined by vite during build */
declare const __TEST_RUNNER_PORT__: number;

export class SocketReporterPlugin extends obsidian.Plugin {
	socket;

	constructor(app: obsidian.App, manifest: obsidian.PluginManifest) {
		super(app, manifest)
		try {
			this.socket = net.createConnection({ port: __TEST_RUNNER_PORT__ })
		} catch (e) {
			this.socket = {
				// @ts-ignore
				write: console.log,
			}
			new obsidian.Notice("Failed to create socket connection\n" + inspect(e))
			throw e;
		}

	}

}
