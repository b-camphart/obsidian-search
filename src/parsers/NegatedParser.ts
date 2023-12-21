import { StringChecker, isStringChecker } from "src/checkers/StringChecker";
import { DefaultParser } from "./DefaultParser";
import { Parser } from "./Parser";
import { FileFilter, isFileFilter } from "src/filters/FileFilter";
import { not } from "src/checkers/Not";
import { negate } from "src/filters/Negation";
import { MetadataCache } from "obsidian";

export class NegatedParser implements Parser {
    private internalParser: Parser;
    constructor(
        metadata: MetadataCache,
        filterType: (checker: StringChecker) => FileFilter,
        matchCase?: boolean,
    ) {
        this.internalParser = new DefaultParser(metadata, filterType, matchCase)
    }

    parse(char: string): Parser | null {
        const nextParser = this.internalParser.parse(char);
        if (nextParser == null) {
            return null;
        }
        this.internalParser = nextParser;
        return this;
    }

    end(): FileFilter | StringChecker | void {
        const result = this.internalParser.end();
        if (isStringChecker(result)) {
            return not(result);
        }
        if (isFileFilter(result)) {
            return negate(result);
        }
    }
}
