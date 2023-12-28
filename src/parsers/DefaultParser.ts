import { FileFilter } from "src/filters/FileFilter";
import { Parser } from "./Parser";
import { StringChecker } from "src/checkers/StringChecker";
import { FileContentFilter } from "src/filters/FileContentFilter";
import { WordParser } from "./WordParser";
import { GroupParser } from "./GroupParser";
import { NegatedParser } from "./NegatedParser";
import { PhraseParser } from "./PhraseParser";
import { RegexParser } from "./RegexParser";
import { MetadataCache } from "obsidian";
import { parseProperty } from "src/parsers/PropertyParser";

export class DefaultParser implements Parser {
    constructor(
        private readonly metadata: MetadataCache,
        private readonly filterType: (checker: StringChecker) => FileFilter = (
            checker,
        ) => new FileContentFilter(checker),
        private readonly matchCase?: boolean,
    ) {}

    parse(char: string): Parser | null {
        switch (char) {
            case `-`: {
                return NegatedParser.start(this.metadata, this.filterType, this.matchCase);
            }
            case `"`: {
                return new PhraseParser(this.filterType, this.matchCase);
            }
            case `/`: {
                return new RegexParser(this.filterType, this.matchCase);
            }
            case `(`: {
                return GroupParser.start(this.metadata, this.filterType, this.matchCase);
            }
            case `[`: { 
                return parseProperty(this.metadata)
            }
            case ` `: {
                return null;
            }
            default: {
                return WordParser.start(char, this.filterType, this.metadata, this.matchCase);
            }
        }
    }

    end(): FileFilter | StringChecker | void {}
}
