import { FileFilter } from "./FileFilter";
import { Filter } from "./Filter";

/**
 * @since 0.1.1
 *
 * Matches against all files.  The resulting filter of combining this filter
 * with another will also always match against any file
 */
// @ts-ignore
export const AlwaysMatch: FileFilter = new Filter();
AlwaysMatch.appliesTo = function (file) {
	return true;
};
AlwaysMatch.toQuery = function () {
	return "";
};
