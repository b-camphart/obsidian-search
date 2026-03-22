import EmbeddedTest from "../embedded/test.js"

export default new EmbeddedTest({
	name: "api",
	results_dir_path: import.meta.resolve("./results").substring("file://".length),
	entry_file_path: import.meta.resolve("./main.ts").substring("file://".length),
	test_vault_dir_path: import.meta.resolve("./vault").substring("file://".length),
})

