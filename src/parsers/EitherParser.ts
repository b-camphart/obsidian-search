import { MetadataCache, TFile } from "obsidian";
import { StringChecker } from "src/checkers/StringChecker";
import { FileFilter, isFileFilter, matchAll } from "src/filters";
import { Parser } from "./Parser";
import { DefaultParser } from "./DefaultParser";

export class EitherPerser implements Parser {

    static start(
        metadata: MetadataCache,
        filterType?: (checker: StringChecker) => FileFilter,
        matchCase?: boolean
    ) {
        return new EitherPerser(metadata, filterType, matchCase)
    }

    private constructor(
        private readonly metadata: MetadataCache,
        private readonly filterType?: (checker: StringChecker) => FileFilter,
        private readonly matchCase?: boolean,
        private readonly collectedBFilters: readonly FileFilter[] = [],
        private internalParser: Parser = new DefaultParser(metadata, filterType, matchCase)
    ) {
    }

    parse(char: string): Parser | null {
        const nextParser = this.internalParser.parse(char)
        if (nextParser == null) {
            const filterOrChecker = this.internalParser.end(matchAll())
            if (isFileFilter(filterOrChecker)) {
                return new EitherPerser(
                    this.metadata,
                    this.filterType,
                    this.matchCase,
                    this.collectedBFilters.concat([filterOrChecker])
                )
            }
            return new EitherPerser(
                this.metadata,
                this.filterType,
                this.matchCase
            )
        }
        return new EitherPerser(
            this.metadata,
            this.filterType,
            this.matchCase,
            this.collectedBFilters,
            nextParser,
        )
    }

    end(activeFilter: FileFilter): FileFilter<TFile> {
        const filterOrChecker = this.internalParser.end(matchAll())
        if (isFileFilter(filterOrChecker)) {
            return activeFilter.or(matchAll(this.collectedBFilters.concat([filterOrChecker])))
        }
        return activeFilter
    }

}