import { App, CachedMetadata, normalizePath, stringifyYaml, TFile } from "obsidian";
import { Match } from "src/contract";
import { randomBytes } from "crypto";
import type { TestContext } from "node:test";
import assert from "assert";
import { inspect } from "util";
import { dirname, join, sep } from "path";
import { wrap } from "module";
import { filesystemIsCaseSensitive } from "./os";

export function layoutReady(app: App): Promise<void> {
	if (app.workspace.layoutReady) {
		return Promise.resolve();
	}
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(
			reject.bind(null, new Error(`Workspace not ready after 5000ms`)),
			5000,
		);
		app.workspace.onLayoutReady(() => {
			clearTimeout(timeout);
			resolve();
		});
	});
}

export type FileCreation = {
	name?: string;
	content?: string;
	properties?: Record<string, unknown>;
	tags?: readonly string[];
	path?: string;
};

export async function createTempFile(app: App, info: FileCreation): Promise<TFile> {
	await layoutReady(app);
	const properties = info.properties ?? {};
	if (info.tags) {
		properties["tags"] = info.tags;
	}
	let content = info.content ?? "";
	if (Object.keys(properties).length > 0) {
		content = `---\n` + stringifyYaml(properties) + `\n---\n` + content;
	}
	let path = info.path ?? info.name ?? randomBytes(8).toString("hex");
	if (!path.endsWith(".md") && info.path === undefined) {
		path = path + ".md";
	}
	const originalPath = path;
	if (!filesystemIsCaseSensitive()) {
		path = path.toLowerCase();
	}
	const pathParts = path.split("/");
	path = normalizePath(pathParts.join(sep));
	let parentPath = normalizePath(dirname(path));
	if (parentPath !== "." && parentPath !== "" && app.vault.getFolderByPath(parentPath) == null) {
		try {
			await app.vault.createFolder(parentPath);
		} catch (e) {
			throw Object.defineProperties(
				new Error(`Failed to create parent folder`, { cause: e }),
				{
					originalPath: {
						value: originalPath,
						enumerable: true,
					},
					path: {
						value: path,
						enumerable: true,
					},
					parentPath: {
						value: parentPath,
						enumerable: true,
					},
				},
			);
		}
	}

	const file = await app.vault.create(path, content).catch((cause) => {
		if (cause instanceof Error && cause.message === "File already exists.") {
			return app.vault.getFileByPath(path)!;
		}
		throw Object.defineProperties(
			new Error(`Failed to create file\n${String(cause)}`, { cause }),
			{
				originalPath: {
					value: originalPath,
					enumerable: true,
				},
				path: {
					value: path,
					enumerable: true,
				},
				parentPath: {
					value: parentPath,
					enumerable: true,
				},
			},
		);
	});
	try {
		const metadata =
			app.metadataCache.getFileCache(file) ??
			(await new Promise<CachedMetadata>((resolve, reject) => {
				const timeout = setTimeout(() => reject("timeout"), 1000);
				const ref = app.metadataCache.on("resolved", () => {
					let metadata: CachedMetadata | null = null;
					try {
						metadata = app.metadataCache.getFileCache(file);
					} catch (e) {
						clearTimeout(timeout);
						app.metadataCache.offref(ref);
						reject(e);
					}
					if (metadata === null) {
						return;
					}
					clearTimeout(timeout);
					app.metadataCache.offref(ref);
					resolve(metadata);
				});
			}));

		if (Object.keys(properties).length > 0) {
			const frontmatter = metadata.frontmatter;
			assert(frontmatter);

			for (const [name, value] of Object.entries(properties)) {
				const propValue: unknown = frontmatter[name];
				assert(
					propValue !== undefined,
					`expected to find ${name} in ${inspect(frontmatter)}`,
				);
				assert.deepStrictEqual(
					propValue,
					value,
					`Property name: ${name}\ngenerated content:::\n${content}\n<EOF`,
				);
			}
		}

		if (info.tags) {
			const frontmatter = metadata.frontmatter;
			assert(frontmatter);
			assert.deepStrictEqual(frontmatter.tags, info.tags);
		}
	} catch (e) {
		// clean-up if failed
		try {
			await app.vault.delete(file);
		} catch (del_err) {
			console.error(e);
			const err = new Error(`Failed to delete file when cleaning up after original error`, {
				cause: del_err,
			});
			Object.defineProperty(err, "original", { value: e, enumerable: true });
			throw err;
		}
		throw e;
	}

	return file;
}

/**
 * generates a random name for the markdown file and returns once obsidian has fully ingested it.  Handles removing
 * the file after the active test completes
 */
export async function createTestFile(app: App, t: TestContext, info: FileCreation): Promise<TFile> {
	const file = await createTempFile(app, info);
	t.after(() => app.vault.delete(file));
	return file;
}

export class Search {
	constructor(private app: App) {}

	private static stringifyHTML(el: Element) {
		const lines: string[] = [];
		function walk(node: Element, indent: number) {
			const text = Array.from(node.childNodes)
				.filter((n) => n.nodeType === Node.TEXT_NODE)
				.map((n) => n.textContent?.trim() ?? "")
				.join("");

			if (text) {
				lines.push("  ".repeat(indent) + text);
			}

			for (const child of node.children) {
				walk(child, indent + 1);
			}
		}

		for (const div of el.children) {
			walk(div, 0);
		}

		return lines.join("\n");
	}

	private prepareQuery(query: string) {
		const leaves = this.app.workspace.getLeavesOfType("search");
		if (leaves.length === 0) throw new Error("could not find any leaves of type 'search'");
		// @ts-ignore
		if (!leaves[0].isVisible()) {
			this.app.workspace.setActiveLeaf(leaves[0]);
		}
		const search = leaves[0].view;
		const console_log = console.log;
		// subdue error output
		console.log = (...args) => {};
		try {
			// @ts-ignore
			search.setQuery(query);
		} finally {
			console.log = console_log;
		}

		return {
			get explanation(): string {
				// @ts-ignore
				const infoEl: HTMLElement = search.searchInfoEl;
				return Search.stringifyHTML(infoEl);
			},
			get renderedResults(): string {
				// @ts-ignore
				const resultEl: HTMLElement = search.dom.el;
				return resultEl.innerHTML;
			},
			get results(): Array<Match & { result: { filename?: [number, number] } }> {
				// @ts-ignore
				return Array.from(search.dom.resultDomLookup.values());
			},
		};
	}

	findMatches(query: string, log?: TestContext["diagnostic"]): Promise<Array<Match>> {
		const search = this.prepareQuery(query);
		return new Promise((resolve, reject) => {
			setTimeout(async () => {
				log?.("[Search Expanation]");
				search.explanation.split("\n").forEach((line) => {
					log?.(line);
				});
				log?.("[Search Results]");
				const results = search.results;
				results.forEach((result) => {
					const str = inspect(
						{
							file: {
								path: result.file.path,
								name: result.file.name,
							},
							result: result.result,
						},
						{ depth: null },
					);
					str.split("\n").forEach((line) => log?.(line));
				});
				log?.("[Available Files]");
				for (const file of this.app.vault.getFiles()) {
					log?.(`${file.path}\n${await this.app.vault.cachedRead(file)}\n`);
				}
				resolve(results);
			}, 1);
		});
	}

	explain(query: string): Promise<string> {
		const search = this.prepareQuery(query);
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(search.explanation);
			}, 1);
		});
	}
}

export function search(
	app: App,
	query: string,
	log?: TestContext["diagnostic"],
): Promise<Array<Match>> {
	const searcher = new Search(app);
	return searcher.findMatches(query, log);
}
