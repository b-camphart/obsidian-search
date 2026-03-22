import * as tests from "./tests";
import * as testing from "../framework";
import * as embedded from "../embedded/plugin";
import * as embedded_testing from "../embedded/testing";
import * as embedded_sockets from "../embedded/sockets";
import { Search } from "../testing/search";
import { inspect } from "util";

export default class Contract extends embedded.SocketReporterPlugin {
	onload(this: Contract) {
		this.app.workspace.onLayoutReady(async () => {
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

			try {
				const passed = await tests.runTests(runner, embedded_testing.files(this.app), new Search(
					this,
					async function(this: Search<Contract>, query: string) {
						const leaves = this.impl.app.workspace.getLeavesOfType("search");
						if (leaves.length === 0) throw new Error("could not find any leaves of type 'search'");
						// @ts-ignore
						if (!leaves[0].isVisible()) {
							this.impl.app.workspace.setActiveLeaf(leaves[0]);
						}
						const search = leaves[0].view;
						// @ts-ignore
						search.setQuery(query);
						return new Promise((resolve, reject) => {
							const id = setInterval(() => {
								try {
									// @ts-ignore
									if (!search.queue?.queue?.runnable?.running) {
										clearInterval(id);
									}
									// @ts-ignore
									console.log(search.searchQuery.matcher);
									// @ts-ignore
									resolve(Array.from(search.dom.resultDomLookup).map(([file, match]) => {
										return {
											name: file.name,
											path: file.path,
											basename: file.basename,
											extension: file.extension,
											content: match.content,
											metadata: this.impl.app.metadataCache.getFileCache(file)?.frontmatter,
											result: {
												...match.result
											},
										}
									}))
								} catch (e) {
									reject(e)
								} finally {
									clearInterval(id);
								}
							}, 1)
						})
					}
				))

				embedded_sockets.sendResultSignal(this.socket, passed)
			} catch (e) {
				this.socket.write("catastrophic error: " + inspect(e))
			}
		})
	}
}
