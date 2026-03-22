import { TestContext } from "node:test";
import { inspect } from "util";

export function testLogger(t: TestContext): Console {
	function callLine() {
		return (new Error().stack ?? "").split("\n")[3].trim();
	}

	function stringifyArgs(...args: any[]): string {
		return args
			.map((item) => {
				if (typeof item === "string") return item;
				return inspect(item);
			})
			.join(" ");
	}

	return {
		...console,
		log(...data) {
			t.diagnostic(callLine() + " " + stringifyArgs(...data));
		},
		info(...data) {
			t.diagnostic(callLine() + " " + stringifyArgs(...data));
		},
		warn(...data) {
			t.diagnostic("[WARN] " + callLine() + " " + stringifyArgs(...data));
		},
		error(...data) {
			t.diagnostic("[ERROR] " + callLine() + " " + stringifyArgs(...data));
		},
	};
}
