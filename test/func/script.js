// check that contract tests have been run for the current version of obsidian
// 		fail if not
// run tests against fake obsidian fs

import * as contract from "../integration/contract.script.js";

if (!contract.ranSuccessfully()) {
	throw "Contract tests have not been run successfully, so mocked functionality tests cannot run.";
}

import * as vite from "vite";
import * as path from "path";
import * as fs from "fs/promises";

console.log("Building functionality tests");
const build_output = await vite.build({
	build: {
		write: false,
		target: "esnext",
		minify: false,
		sourcemap: "inline",
		lib: {
			entry: import.meta.resolve("./main.ts").substring("file://".length),
			formats: ["es"],
		},
		rollupOptions: {
			external: ["obsidian", "util"],
			output: {
				format: "es",
			},
		}
	},
	resolve: {
		alias: {
			"src": path.resolve("./src"),
		}
	},
	configFile: false,
});

const out_path = import.meta.resolve("./.out.js").substring("file://".length)
await fs.writeFile(out_path, build_output[0].output[0].code);
try {
	await import(out_path);
} finally {
	await fs.rm(out_path);
}
// console.log(build_output[0].output[0].map);
