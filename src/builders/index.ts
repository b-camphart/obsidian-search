import * as filters from "../filters";

const file = filters.file;
const strings = filters.strings;

export function basic(str: string) {
	return file.content(strings.basic(str));
}
