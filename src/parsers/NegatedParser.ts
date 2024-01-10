import { StringChecker } from "src/checkers/StringChecker";
import { DefaultParser } from "./DefaultParser";
import { ParentParser, Parser, isParentParser } from "./Parser";
import { FileFilter, isFileFilter } from "src/filters/FileFilter";
import { negate } from "src/filters/Negation";
import { MetadataCache } from "obsidian";
import { GroupParser } from "./GroupParser";
import { EmtpyFilter } from "src/main";

export class NegatedParser implements ParentParser {
    public static start(
        metadata: MetadataCache,
        filterType: (checker: StringChecker) => FileFilter,
        matchCase?: boolean,
    ): NegatedParser {
        return new NegatedParser(
            metadata,
            filterType,
            new DefaultParser(metadata, filterType, matchCase),
            matchCase,
        );
    }

    constructor(
        private readonly metadata: MetadataCache,
        private readonly filterType: (checker: StringChecker) => FileFilter,
        private readonly internalParser: Parser,
        private readonly matchCase?: boolean,
    ) {}

    parse(char: string): Parser | null {
        const nextParser = this.internalParser.parse(char);
        if (nextParser == null) {
            return null;
        }
        return new NegatedParser(
            this.metadata,
            this.filterType,
            nextParser,
            this.matchCase,
        );
    }

    containsNestedGroupParser(): boolean {
        return (
            this.internalParser instanceof GroupParser ||
            (isParentParser(this.internalParser) &&
                this.internalParser.containsNestedGroupParser())
        );
    }

    end(activeFilter: FileFilter): FileFilter {
        const result = this.internalParser.end(EmtpyFilter);
        if (isFileFilter(result)) {
            return activeFilter.and(negate(result));
        }
        return activeFilter
    }
}
