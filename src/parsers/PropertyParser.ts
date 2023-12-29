import { MetadataCache, TFile } from "obsidian";
import { group } from "src/checkers/Group";
import { StringChecker } from "src/checkers/StringChecker";
import { FilePropertyFilter } from "src/filters";
import { FileFilter } from "src/filters/FileFilter";
import { Parser } from "src/parsers/Parser";
import { DefaultSubQueryParser } from "src/parsers/subquery/DefaultSubQueryParser";
import { SubQueryParser } from "src/parsers/subquery/SubQueryParser";

export function parseProperty(metadata: MetadataCache): Parser {
    return new PropertyNameParser([], metadata);
}

class PropertyNameParser implements Parser {
    constructor(
        private readonly checkers: readonly StringChecker[],
        private readonly metadata: MetadataCache,
        private parser: SubQueryParser = new DefaultSubQueryParser(),
    ) {}

    parse(char: string): Parser | null {
        if (char === `]`) {
            return null;
        }
        if (char === `:`) {
            return new PropertyValueParser(
                group(this.endInternalParser()),
                this.metadata,
            );
        }
        const next = this.parser.parse(char);
        if (next == null) {
            return new PropertyNameParser(
                this.endInternalParser(),
                this.metadata,
            );
        }

        return new PropertyNameParser(this.checkers, this.metadata, next);
    }

    private endInternalParser() {
        const checker = this.parser.end();
        if (checker != null) {
            return this.checkers.concat([checker]);
        }
        return this.checkers;
    }

    end(activeFilter: FileFilter): FileFilter<TFile> {
        return activeFilter.and(
            new FilePropertyFilter(
                this.metadata,
                group(this.endInternalParser()),
            ),
        );
    }
}

class PropertyValueParser implements Parser {
    constructor(
        private readonly property: StringChecker,
        private readonly metadata: MetadataCache,
        private readonly checkers: readonly StringChecker[] = [],
        private parser: SubQueryParser = new DefaultSubQueryParser(),
    ) {}

    parse(char: string): Parser | null {
        if (char === `]`) {
            return null;
        }
        const next = this.parser.parse(char);
        if (next == null) {
            return new PropertyValueParser(
                this.property,
                this.metadata,
                this.endInternalParser(),
                new DefaultSubQueryParser(),
            );
        }

        return new PropertyValueParser(
            this.property,
            this.metadata,
            this.checkers,
            next,
        );
    }

    private endInternalParser() {
        const checker = this.parser.end();
        if (checker != null) {
            return this.checkers.concat([checker]);
        }
        return this.checkers;
    }

    end(activeFilter: FileFilter): FileFilter<TFile> {
        return activeFilter.and(
            new FilePropertyFilter(
                this.metadata,
                this.property,
                group(this.endInternalParser()),
            ),
        );
    }
}
