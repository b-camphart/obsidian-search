import { MetadataCache, TFile } from "obsidian";
import { group } from "src/checkers/Group";
import { StringChecker } from "src/checkers/StringChecker";
import { FilePropertyFilter } from "src/filters";
import { FileFilter } from "src/filters/FileFilter";
import { Parser } from "src/parsers/Parser";
import { DefaultSubQueryParser } from "src/parsers/subquery/DefaultSubQueryParser";
import { SubQueryParser } from "src/parsers/subquery/SubQueryParser";

export function parseProperty(metadata: MetadataCache): Parser {
    return new PropertyNameParser(metadata);
}

class PropertyNameParser implements Parser {
    private readonly checkers: StringChecker[] = [];
    private parser: SubQueryParser = new DefaultSubQueryParser();

    constructor(private readonly metadata: MetadataCache) {}

    parse(char: string): Parser | null {
        if (char === `]`) {
            return null;
        }
        if (char === `:`) {
            this.endInternalParser();
            return new PropertyValueParser(group(this.checkers), this.metadata);
        }
        const next = this.parser.parse(char);
        if (next == null) {
            this.endInternalParser();
            this.parser = new DefaultSubQueryParser();
        }

        return this;
    }

    private endInternalParser() {
        const checker = this.parser.end();
        if (checker != null) {
            this.checkers.push(checker);
        }
    }

    end(): void | FileFilter<TFile> | StringChecker {
        this.endInternalParser();
        return new FilePropertyFilter(this.metadata, group(this.checkers));
    }
}

class PropertyValueParser implements Parser {
    private readonly checkers: StringChecker[] = [];
    private parser: SubQueryParser = new DefaultSubQueryParser();

    constructor(
        private readonly property: StringChecker,
        private readonly metadata: MetadataCache
    ) {}

    parse(char: string): Parser | null {
        if (char === `]`) {
            return null;
        }
        const next = this.parser.parse(char);
        if (next == null) {
            this.endInternalParser();
            this.parser = new DefaultSubQueryParser();
        }

        return this;
    }

    private endInternalParser() {
        const checker = this.parser.end();
        if (checker != null) {
            this.checkers.push(checker);
        }
    }

    end(): void | FileFilter<TFile> | StringChecker {
        this.endInternalParser();
        return new FilePropertyFilter(
            this.metadata,
            this.property,
            group(this.checkers),
        );
    }
}
