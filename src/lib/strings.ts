export function trimIndent(str: string): string {
	const lines = str.split("\n");
	const first_index = lines.findIndex((it) => it.length > 0 && it !== "\n");
	if (first_index < 0) {
		return str;
	}
	const first = lines[first_index];
	const whitespace = first.length - first.trimStart().length;
	return lines
		.slice(first_index)
		.map((it) => it.substring(whitespace))
		.join("\n");
}
