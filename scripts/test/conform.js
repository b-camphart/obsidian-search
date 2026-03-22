import { extendTestConfig } from "obsidian-test/node";
import path from "path";

extendTestConfig(config => {
	return {
		...config,
		build: {
			testPattern: "./src/main.conform.ts",

		},
		cachePath: ".conform",
		launch: {
			vaultPath: path.join(process.cwd(), "node_modules", ".cache", "obsidian-test", "obsidian-search-conform-vault")
		}
	}
})
