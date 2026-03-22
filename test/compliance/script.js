import api from "../api/script.js"
import contract from "../contract/script.js"
import EmbeddedTest from "../embedded/test.js";

const test = new EmbeddedTest({
	name: "compliance",
	entry_file_path: import.meta.resolve("./main.ts").substring("file://".length),
	results_dir_path: import.meta.resolve("./results").substring("file://".length),
	test_vault_dir_path: import.meta.resolve("./vault").substring("file://".length),
});

test.dependOn("api", api);
test.dependOn("contract", contract);

export default test;
