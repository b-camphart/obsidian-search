import { StringChecker } from "src/checkers/StringChecker";
import { OperatorParser } from "./OperatorParser";
import { Parser } from "./Parser";
import { FileFilter } from "src/filters/FileFilter";
import { SubQueryWordParser } from "./subquery/SubQueryWordParser";
import { MetadataCache } from "obsidian";
import { DefaultParser } from "./DefaultParser";

export class WordParser implements Parser {
    public static start(
        buffer: string,
        filterType: (checker: StringChecker) => FileFilter,
        metadata: MetadataCache,
        matchCase?: boolean,
    ): WordParser {
        return new WordParser(
            new SubQueryWordParser(buffer, matchCase),
            filterType,
            metadata,
            matchCase
        )
    }

    private constructor(
        private readonly subParser: SubQueryWordParser,
        private readonly filterType: (checker: StringChecker) => FileFilter,
        private readonly metadata: MetadataCache,
        private readonly matchCase?: boolean,
    ) {}

    parse(char: string): Parser | null {
        if (char === `:`) {
            const buffer = this.subParser.buffer;
            switch (buffer) {
                case `file`:
                case `path`:
                case "content":
                case "tag": {
                    return OperatorParser.start(buffer, this.metadata, this.matchCase);
                }
            }
            return new DefaultParser(this.metadata);
        }
        const nextParser = this.subParser.parse(char);
        if (nextParser == null) {
            return null;
        }
        return new WordParser(
            nextParser,
            this.filterType,
            this.metadata,
            this.matchCase
        )
    }

    end(): FileFilter | void {
        const checker = this.subParser.end();
        if (checker != null) {
            return this.filterType(checker);
        }
    }
}
