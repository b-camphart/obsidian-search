import { FileFilter, isFileFilter } from "src/filters/FileFilter";
import { matchAll } from "src/filters/MatchAllFilter";
import { DefaultParser } from "./DefaultParser";
import { Parser } from "./Parser";
import { StringChecker } from "src/checkers/StringChecker";
import { MetadataCache } from "obsidian";

export class GroupParser implements Parser {
    private internalFilters: FileFilter[] = []
    private internalParser: Parser;

    constructor(
        private readonly metadata: MetadataCache,
        private readonly filterType: (checker: StringChecker) => FileFilter,
        private matchCase?: boolean
    ) {
        this.internalParser = new DefaultParser(metadata, filterType, matchCase)
    }

    parse(char: string): Parser | null {
        if (char === `)` && !(this.internalParser instanceof GroupParser)) {
            return null
        }

        
        const nextParser = this.internalParser.parse(char)
        if (nextParser != null) {
            this.internalParser = nextParser
        } else {
            this.endInternalParser()
            this.internalParser = new DefaultParser(this.metadata, this.filterType, this.matchCase)
        }

        return this;
    }

    private endInternalParser() {
        const filter = this.internalParser.end();
        if (isFileFilter(filter)) {
            this.internalFilters.push(filter)
        }
    }

    end(): FileFilter | void {
        this.endInternalParser()
        return matchAll(this.internalFilters)
    }
}