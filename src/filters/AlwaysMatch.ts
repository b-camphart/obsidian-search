import { FileFilter } from "./FileFilter";

/**
 * @since 0.1.1
 * 
 * Matches against all files.  The resulting filter of combining this filter 
 * with another will also always match against any file
 */
export const AlwaysMatch: FileFilter = {
    async appliesTo(file) {
        return true
    },
    and(filter) {
        return this
    },
    or(filter) {
        return this
    }
}