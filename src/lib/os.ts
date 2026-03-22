import { mkdtempSync, readdirSync, rmdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

function lazy<T>(fn: () => T): () => T {
	const UN_INITIALIZED = Symbol();
	let value: T | typeof UN_INITIALIZED = UN_INITIALIZED;
	return (): T => {
		if (value !== UN_INITIALIZED) {
			return value;
		}
		value = fn();
		return value;
	};
}

export const filesystemIsCaseSensitive: () => boolean = lazy(() => {
	const dirPath = mkdtempSync("os-case-sensitivity");
	try {
		const upperPath = join(dirPath, "UPPER");
		const lowerPath = join(dirPath, "lower");

		for (const path of [upperPath, lowerPath]) {
			writeFileSync(path, "", "utf8");
			try {
				const [reportedPath] = readdirSync(dirPath);
				if (reportedPath !== path) {
					return false;
				}
			} finally {
				rmSync(path);
			}
		}
		return true;
	} finally {
		rmdirSync(dirPath);
	}
});
