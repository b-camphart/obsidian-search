import * as obsidian from "obsidian"
import * as testing from "../testing/files"
import * as paths from "path"

export async function createFile(
	app: obsidian.App,
	path: string,
	body: string = "",
	frontmatter?: testing.Frontmatter,
): Promise<obsidian.TFile> {
	if (frontmatter) {
		let prefix = "---\n";
		if (frontmatter.tags.length > 0) {
			prefix += "tags:\n"
			frontmatter.tags.forEach(tag => prefix += "  - " + tag + "\n")
		}
		if (frontmatter.aliases.length > 0) {
			prefix += "aliases:\n"
			frontmatter.aliases.forEach(alias => prefix += `  - ${alias}\n`)
		}
		if (frontmatter.cssclasses.length > 0) {
			prefix += "cssclasses:\n"
			frontmatter.cssclasses.forEach(cssclass => prefix += `  - ${cssclass}\n`)
		}
		if (Object.keys(frontmatter.properties).length > 0) {
			for (const [prop, value] of Object.entries(frontmatter.properties)) {
				prefix += `${prop}: ${value}\n`
			}
		}
		prefix += "---\n";
		body = prefix + body;
	}
	const path_parts = path.split("/");
	if (path_parts.length > 1) {
		const folder_path = paths.join(...path_parts.slice(0, -1));
		if (!app.vault.getFolderByPath(folder_path)) {
			try {
				await app.vault.createFolder(folder_path);
			} catch (e) {
				const err = new Error("Failed to create folder: " + folder_path);
				err.cause = e;
				throw err;
			}
		}
	}
	let file: obsidian.TFile;
	try {
		file = await app.vault.create(path, body);
	} catch (e) {
		throw new Error(`Failed to create file at "${path}"`, { cause: e });
	}
	if (app.metadataCache.getCache(path) == null) {
		return new Promise(resolve => {
			const ref = app.metadataCache.on("resolved", () => {
				if (app.metadataCache.getCache(path) != null) {
					app.metadataCache.offref(ref);
					resolve(file);
				}
			});
		})
	}
	return file;
}

export function files(app: obsidian.App): testing.Files<obsidian.TFile> {
	return new testing.Files<obsidian.TFile, obsidian.App>({
		impl: app,
		createFile(
			this: testing.Files<obsidian.TFile, obsidian.App>,
			path: string,
			body?: string,
			frontmatter?: testing.Frontmatter
		): Promise<obsidian.TFile> {
			return createFile(this.impl, path, body, frontmatter);
		},
		async deleteFile(this: testing.Files<obsidian.TFile, obsidian.App>, file: obsidian.TFile) {
			await this.impl.vault.delete(file, true)
			const path_parts = file.name.split("/")
			if (path_parts.length > 1) {
				const folder_path = paths.join(...path_parts.slice(0, -1))
				const folder = this.impl.vault.getFolderByPath(folder_path);
				if (!folder) return;
				if (!folder.children.length) {
					await this.impl.vault.delete(folder, true);
				} else {
					console.log("folder ", folder.path, "still has children", folder.children.length)
				}
			}
		},
		async readFile(this: testing.Files<obsidian.TFile, obsidian.App>, file: obsidian.TFile): Promise<string> {
			return this.impl.vault.cachedRead(file)
		}
	})
}

