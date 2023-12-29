import { FileFilter } from "src/filters/FileFilter";
import { Parser } from "./Parser";
import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryRegexParser } from "./subquery/SubQueryRegexParser";
import { matchAll } from "src/filters";

export class RegexParser implements Parser {
    private subParser: SubQueryRegexParser;

    constructor(
        private readonly filterType: (checker: StringChecker) => FileFilter,
        matchCase: boolean = true,
    ) {
        this.subParser = new SubQueryRegexParser(matchCase)
    }

    parse(char: string): Parser | null {
        const nextParser = this.subParser.parse(char)
        if (nextParser == null) {
            return null
        }
        this.subParser = nextParser
        return this;
    }

    end(activeFilter: FileFilter): FileFilter {
        const checker = this.subParser.end();
        if (checker != null) {
            return activeFilter.and(this.filterType(checker))
        }
        return activeFilter
    }
}