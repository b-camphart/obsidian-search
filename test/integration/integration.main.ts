import type { TFile } from "obsidian"
import * as common from "./common.main";
import * as obsidian_search from "src/main"

export default common.Plugin(plugin => common.ObsidianFiles(plugin, async (query) => {
	const matches: TFile[] = [];
	for await (const file of obsidian_search.search(query, plugin.app)) {
		matches.push(file);
	}
	return matches;
}))
