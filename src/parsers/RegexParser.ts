import { FileFilter } from "src/filters/FileFilter";
import { Parser } from "./Parser";
import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryRegexParser } from "./subquery/SubQueryRegexParser";

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

    end(): FileFilter | void {
        const checker = this.subParser.end();
        if (checker != null) {
            return this.filterType(checker);
        }
    }
}