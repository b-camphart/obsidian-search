/**
	* @template T
	* @param {() => T} fn
	* @returns {Error | T}
	*/
export function safe(fn) {
	try {
		return fn();
	} catch (e) {
		if (e instanceof Error) return e;
		if (typeof e === "string") {
			return new Error(e)
		}
		return new Error(String(e))
	}
}
