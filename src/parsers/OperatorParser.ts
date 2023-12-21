import { FileFilter } from "src/filters/FileFilter";
import { Parser } from "./Parser";
import { SubQueryParser } from "./subquery/SubQueryParser";
import { StringChecker, isStringChecker } from "src/checkers/StringChecker";
import { FileNameFilter } from "src/filters/FileNameFilter";
import { FilePathFilter } from "src/filters/FilePathFilter";
import { DefaultSubQueryParser } from "./subquery/DefaultSubQueryParser";
import { FileContentFilter } from "src/filters/FileContentFilter";
import { FileTagsFilter } from "src/filters/FileTagsFilter";
import { MetadataCache } from "obsidian";

export class OperatorParser implements Parser {
    private internalParser: SubQueryParser;

    constructor(
        private readonly operator: string,
        private readonly metadata: MetadataCache,
        matchCase?: boolean,
    ) {
        this.internalParser = new DefaultSubQueryParser(matchCase);
    }

    parse(char: string): Parser | null {
        const nextParser = this.internalParser.parse(char);
        if (nextParser == null) {
            return null;
        }
        this.internalParser = nextParser;
        return this;
    }

    end(): void | StringChecker | FileFilter {
        const checker = this.internalParser.end();
        if (isStringChecker(checker)) {
            switch (this.operator) {
                case "file": {
                    return new FileNameFilter(checker);
                }
                case "path": {
                    return new FilePathFilter(checker);
                }
                case "content": {
                    return new FileContentFilter(checker);
                }
                case "tag": {
                    return new FileTagsFilter(checker, this.metadata);
                }
            }
        }
    }
}