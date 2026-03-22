import { embedded } from "obsidian-test";
import { searchContract } from "./search.contract";
import { Search, search } from "./lib/obsidian";

embedded(async function (app) {
	await searchContract(app, new Search(app));
});
