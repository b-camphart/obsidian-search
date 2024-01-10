import { FileFilter, isFileFilter } from "src/filters/FileFilter";
import { DefaultParser } from "./DefaultParser";
import { Parser, ParentParser, isParentParser } from "./Parser";
import { StringChecker } from "src/checkers/StringChecker";
import { MetadataCache } from "obsidian";
import { WordParser } from "./WordParser";
import { EmtpyFilter } from "src/main";

let _nonGroupParsers: Function[] | undefined;
function NonGroupParsers() {
    if (_nonGroupParsers == null) {
        _nonGroupParsers = [DefaultParser, WordParser];
    }
    return _nonGroupParsers;
}

export class GroupParser implements ParentParser {
    public static start(
        metadata: MetadataCache,
        filterType: (checker: StringChecker) => FileFilter,
        matchCase?: boolean,
    ): GroupParser {
        return new GroupParser(
            metadata,
            filterType,
            EmtpyFilter,
            new DefaultParser(metadata, filterType, matchCase),
            matchCase,
        );
    }

    private constructor(
        private readonly metadata: MetadataCache,
        private readonly filterType: (checker: StringChecker) => FileFilter,
        private readonly internalFilter: FileFilter,
        private readonly internalParser: Parser,
        private readonly matchCase?: boolean,
    ) {}

    parse(char: string): Parser | null {
        if (char === `)` && !this.containsNestedGroupParser()) {
            return null;
        }

        const nextParser = this.internalParser.parse(char);
        if (nextParser != null) {
            return new GroupParser(
                this.metadata,
                this.filterType,
                this.internalFilter,
                nextParser,
                this.matchCase,
            );
        } else {
            const filter = this.endInternalParser();
            return new GroupParser(
                this.metadata,
                this.filterType,
                filter,
                new DefaultParser(
                    this.metadata,
                    this.filterType,
                    this.matchCase,
                ),
                this.matchCase,
            );
        }
    }

    containsNestedGroupParser() {
        return (
            this.internalParser instanceof GroupParser ||
            (isParentParser(this.internalParser) &&
                this.internalParser.containsNestedGroupParser())
        );
    }

    private endInternalParser(): FileFilter {
        const filter = this.internalParser.end(this.internalFilter);
        if (isFileFilter(filter)) {
            return filter
        }
        return this.internalFilter;
    }

    end(activeFilter: FileFilter): FileFilter {
        const filter = this.endInternalParser();
        return activeFilter.and(filter);
    }
}
