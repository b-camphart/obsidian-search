import { extendTestConfig } from "obsidian-test/node";
import path from "path";

extendTestConfig(config => {
	return {
		...config,
		build: {
			testPattern: "./src/main.contract.ts",
		},
		cachePath: ".contract",
		launch: {
			vaultPath: path.join(process.cwd(), "node_modules", ".cache", "obsidian-test", "obsidian-search-contract-vault"),
			// cmd: `start`,
		}
	}
})


