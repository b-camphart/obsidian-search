import type * as obsidian from "obsidian"
import * as common from "./common.main"
import * as tests from "./tests";
import * as testing from "./framework"

export default common.Plugin(async (plugin) => {
	const files = common.ObsidianFiles(plugin, async (query) => {
			const leaves = plugin.app.workspace.getLeavesOfType("search");
			if (leaves.length === 0) throw new Error("could not find any leaves of type 'search'");
			if (!leaves[0].isVisible()) {
				plugin.app.workspace.setActiveLeaf(leaves[0]);
			}
			const search = leaves[0].view;
			search.setQuery(query);
			return new Promise(resolve => {
				const id = setInterval(() => {
					if (!search.queue.queue.runnable.running) {
						clearInterval(id);
					}
					resolve(Array.from(search.dom.resultDomLookup).map(([file, match]) => {
						return {
							name: file.name,
							path: file.path,
							basename: file.basename,
							extension: file.extension,
							content: match.content,
							metadata: plugin.app.metadataCache.getFileCache(file)?.frontmatter
						}
					}))
				}, 1)
			})
		},
	);

	const logger = new common.SocketLogger()

	const t = new testing.Suite(logger)



	for (const { filename, run } of tests.allTests<obsidian.TFile>()) {
		await t.suite(filename, t => run(t, files))
	}

	logger.log("")
	logger.end();

});
