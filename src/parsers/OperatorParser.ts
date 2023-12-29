import { FileFilter } from "src/filters/FileFilter";
import { ParentParser, Parser, isParentParser } from "./Parser";
import { SubQueryParser } from "./subquery/SubQueryParser";
import { isStringChecker } from "src/checkers/StringChecker";
import { FileNameFilter } from "src/filters/FileNameFilter";
import { FilePathFilter } from "src/filters/FilePathFilter";
import { DefaultSubQueryParser } from "./subquery/DefaultSubQueryParser";
import { FileContentFilter } from "src/filters/FileContentFilter";
import { FileTagsFilter } from "src/filters/FileTagsFilter";
import { MetadataCache } from "obsidian";
import { SubQueryGroupParser } from "./subquery/SubQueryGroupParser";

export class OperatorParser implements ParentParser {
    public static start(
        operator: string,
        metadata: MetadataCache,
        matchCase?: boolean,
    ): OperatorParser {
        return new OperatorParser(
            operator,
            metadata,
            new DefaultSubQueryParser(matchCase),
            matchCase,
        );
    }

    private constructor(
        private readonly operator: string,
        private readonly metadata: MetadataCache,
        private readonly internalParser: SubQueryParser,
        private readonly matchCase?: boolean,
    ) {}

    parse(char: string): Parser | null {
        if (this.operator === "tag" && char === "#") return this;

        const nextParser = this.internalParser.parse(char);
        if (nextParser == null) {
            return null;
        }
        return new OperatorParser(
            this.operator,
            this.metadata,
            nextParser,
            this.matchCase,
        );
    }

    containsNestedGroupParser(): boolean {
        return (
            this.internalParser instanceof SubQueryGroupParser ||
            (isParentParser(this.internalParser) &&
                this.internalParser.containsNestedGroupParser())
        );
    }

    end(activeFilter: FileFilter): FileFilter {
        const checker = this.internalParser.end();
        if (isStringChecker(checker)) {
            switch (this.operator) {
                case "file": {
                    return activeFilter.and(new FileNameFilter(checker));
                }
                case "path": {
                    return activeFilter.and(new FilePathFilter(checker));
                }
                case "content": {
                    return activeFilter.and(new FileContentFilter(checker));
                }
                case "tag": {
                    return activeFilter.and(
                        new FileTagsFilter(checker, this.metadata),
                    );
                }
            }
        }
        return activeFilter;
    }
}
