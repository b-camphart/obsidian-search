import { StringChecker } from "src/checkers/StringChecker";
import { OperatorParser } from "./OperatorParser";
import { Parser } from "./Parser";
import { FileFilter } from "src/filters/FileFilter";
import { SubQueryWordParser } from "./subquery/SubQueryWordParser";
import { MetadataCache } from "obsidian";

export class WordParser implements Parser {
    private subParser: SubQueryWordParser;

    constructor(
        buffer: string,
        private readonly filterType: (checker: StringChecker) => FileFilter,
        private readonly metadata: MetadataCache,
        private matchCase?: boolean,
    ) {
        this.subParser = new SubQueryWordParser(buffer, matchCase);
    }

    parse(char: string): Parser | null {
        if (char === `:`) {
            const buffer = this.subParser.buffer;
            switch (buffer) {
                case `file`:
                case `path`:
                case "content":
                case "tag": {
                    return new OperatorParser(buffer, this.metadata, this.matchCase);
                }
            }
            return new WordParser("", this.filterType, this.metadata, this.matchCase);
        }
        const nextParser = this.subParser.parse(char);
        if (nextParser == null) {
            return null;
        }
        return this;
    }

    end(): FileFilter | void {
        const checker = this.subParser.end();
        if (checker != null) {
            return this.filterType(checker);
        }
    }
}
