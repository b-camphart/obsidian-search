import * as common from "./common.script.js";
import * as contract_script from "./contract.script.js";

await (async () => {
	const err = await contract_script.maybeRun();
	if (err != null) {
		throw err;
	}
})()

console.log("running integration tests")
if (await common.test({
	entry: import.meta.resolve("./integration.main.ts").substring("file://".length),
	vault_path: import.meta.resolve("./integration_test_vault").substring("file://".length),
})) {
	process.exit(0);
} else {
	process.exit(1);
}
