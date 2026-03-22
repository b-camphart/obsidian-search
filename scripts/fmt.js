import { format } from "prettier";
import { extname, join, resolve } from "path";
import { readdir, readFile, writeFile } from "fs/promises";

const SRC_DIR = process.cwd() + "/src";
const FORMATTABLE_EXTENSIONS = new Set([".ts"]);

/** @param {string} filePath */
async function formatFile(filePath) {
	const ext = extname(filePath);
	if (!FORMATTABLE_EXTENSIONS.has(ext)) {
		return;
	}

	const input = await readFile(filePath, "utf8");

	const formatted = await format(input, {
		plugins: [],
		parser: "typescript",
		useTabs: true,
		semi: true,
		tabWidth: 4,
		objectWrap: "preserve",
		proseWrap: "preserve",
		printWidth: 100,
	});

	if (formatted !== input) {
		await writeFile(filePath, formatted, "utf8");
		console.log(`Formatted: ${filePath}`);
	} else {
		console.log(`Unchanged: ${filePath}`);
	}
}

/** @param {string} dir */
async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			await walk(fullPath);
		} else {
			await formatFile(fullPath);
		}
	}
}

const target_path = process.argv[2];
if (!target_path || target_path === ".") {
	await walk(SRC_DIR);
} else {
	await formatFile(resolve(process.cwd(), target_path));
}
console.log("Formatting complete ");
