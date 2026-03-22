import * as vite from "vite";
import tsconfig from "./tsconfig.json" with { type: "json" }

export { tsconfig };

export const build_config = vite.defineConfig({
	resolve: {
		alias: {
			"src": import.meta.resolve("./src").substring("file://".length),
		}
	},
	build: {
		target: tsconfig.compilerOptions.target,
		lib: {
			entry: 'src/main.ts',
			name: 'obsidian-search',
			formats: ["es", "cjs"],
		},
		minify: false,
		rollupOptions: {
			external: [
				"obsidian",
				"util",
				"path",
				"net",
			],
		},
	},
})

if (import.meta.url.includes(process.argv[1])) {
	await vite.build({
		...build_config,
		configFile: false,
		define: {
			'import.meta.vitest': 'undefined',
		},
	});
}
