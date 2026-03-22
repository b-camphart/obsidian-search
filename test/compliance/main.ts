import * as tests from "../contract/tests";
import * as embedded from "../embedded/plugin";
import * as testing from "../framework";

import * as embedded_testing from "../embedded/testing";
import * as embedded_sockets from "../embedded/sockets";
import { Search } from "../testing/search";

import * as obsidian_search from "../../src/index"
import { inspect } from "util";

export default class Compliance extends embedded.SocketReporterPlugin {
	onload(this: Compliance) {
		const runner = new testing.Runner({
			reporter: new testing.StartStopReporter({
				output: new testing.Writer({
					impl: this.socket,
					write(writer, data) {
						writer.impl.write(data);
					}
				})
			}).reporter(),
		});

		this.app.workspace.onLayoutReady(async () => {
			try {
				const passed = await tests.runTests(runner, embedded_testing.files(this.app), new Search(
					this,
					async function(this: Search<Compliance>, query: string) {
						const matches = [];
						for await (const file of obsidian_search.search(query, this.impl.app)) {
							matches.push({
								name: file.name,
								path: file.path,
								basename: file.basename,
								content: await file.vault.cachedRead(file),
								metadata: this.impl.app.metadataCache.getFileCache(file)?.frontmatter,
							});
						}
						return matches;
					}
				))

				embedded_sockets.sendResultSignal(this.socket, passed)
			} catch (e) {
				this.socket.write("catastrophic error: " + inspect(e))
			}
		})
	}
}
