
import * as tests from "../integration/tests/index";
import { Files } from "../integration/obsidian";
import * as obsidian_search from "../../src/main";

const files_by_path = new Map<string, {
	metadata?: {
		tags?: string[]
	},
	body: string,
}>();

const vault = {
	getMarkdownFiles() {
		return Array.from(files_by_path, ([path, file]) => {
			return {
				path,
				vault,
			};
		})
	},
	cachedRead(file) {
		return files_by_path.get(file.path)?.body ?? "";
	}
};

const metadataCache = {
	getFileCache(file) {
		const { metadata } = files_by_path.get(file.path)
		return {
			frontmatter: metadata,
		};
	}
};

function collectTagsInBody(body: string, logger?: Console): string[] {
	logger?.log("collecting tags in", body)
	const tags: string[] = [];
	let in_code_block = false;
	let collecting_tag = false;
	let buffer = "";
	for (let i = 0; i < body.length; i++) {
		const char = body[i];
		logger?.group(i, `'${char}'`);
		if (collecting_tag) {
			logger?.log("collecting tag")
			if ([" ", "\n", "\r", "\t"].includes(char)) {
				logger?.log("found whitespace")
				tags.push(buffer);
				buffer = "";
				collecting_tag = false;
				logger?.groupEnd();
				continue;
			} else {
				logger?.log("building tag")
				buffer += char;
				logger?.groupEnd();
				continue;
			}
		}
		if (in_code_block) {
			logger?.log("in code block")
			if (char === "`" && body.substring(i, i+3) === "```") {
				logger?.log("ending code block and jumping")
				in_code_block = false;
				i = i + 2;
			}
			logger?.groupEnd();
			continue;
		}
		if (char === "`" && body.substring(i, i+3) === "```") {
			logger?.log("detected code block, jumping")
			in_code_block = true;
			i = i + 2;
			logger?.groupEnd();
			continue;
		}
		if (char === "#") {
			logger?.log("detected tag")
			collecting_tag = true;
			buffer = "";
			logger?.groupEnd();
			continue;
		}
	}
	return tags;
}

const io = new Files<{ path: string, vault: object }>(
	(name_with_extension, body = "", frontmatter) => {
		frontmatter = {
			tags: [
				...frontmatter?.tags ?? [],
				...collectTagsInBody(body),
			]
		}
		files_by_path.set(name_with_extension, { body, metadata: frontmatter });
		return Promise.resolve({
			path: name_with_extension,
			vault,
		});
	},
	(file) => {
		files_by_path.delete(file.path);
		return Promise.resolve();
	},
	async (query) => {
		const matches: Array<{ name: string }> = [];
		for await (const match of obsidian_search.search(query, {
			vault,
			metadataCache,
		})) {
			matches.push({
				name: match.path,
			});
		}
		return matches;
	}
)

tests.runTests(console, io);
