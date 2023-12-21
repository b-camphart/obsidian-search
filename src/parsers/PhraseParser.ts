import { FileFilter } from "src/filters/FileFilter";
import { Parser } from "./Parser";
import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryPhraseParser } from "./subquery/SubQueryPhraseParser";
import { SubQueryParser } from "./subquery/SubQueryParser";

export class PhraseParser implements Parser {
    private subParser: SubQueryParser

    constructor(
        private readonly filterType: (checker: StringChecker) => FileFilter,
        matchCase: boolean = true,
    ) {
        this.subParser = new SubQueryPhraseParser(matchCase)
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