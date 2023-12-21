import { FileFilter, isFileFilter } from "src/filters/FileFilter";
import { matchAll } from "src/filters/MatchAllFilter";
import { DefaultParser } from "./DefaultParser";
import { Parser, ParentParser, isParentParser } from "./Parser";
import { StringChecker } from "src/checkers/StringChecker";
import { MetadataCache } from "obsidian";
import { WordParser } from "./WordParser";
import { PhraseParser } from "./PhraseParser";
import { NegatedParser } from "./NegatedParser";

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
            [],
            new DefaultParser(metadata, filterType, matchCase),
            matchCase,
        );
    }

    private constructor(
        private readonly metadata: MetadataCache,
        private readonly filterType: (checker: StringChecker) => FileFilter,
        private readonly internalFilters: readonly FileFilter[],
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
                this.internalFilters,
                nextParser,
                this.matchCase,
            );
        } else {
            const filters = this.endInternalParser();
            return new GroupParser(
                this.metadata,
                this.filterType,
                filters,
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

    private endInternalParser() {
        const filter = this.internalParser.end();
        if (isFileFilter(filter)) {
            return this.internalFilters.concat([filter]);
        }
        return this.internalFilters;
    }

    end(): FileFilter | void {
        const filters = this.endInternalParser();
        return matchAll(filters);
    }
}
