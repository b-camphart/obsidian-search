import { StringChecker } from "src/checkers/StringChecker";
import { FileFilter } from "src/filters/FileFilter";

export interface Parser {
    parse(char: string): Parser | null;
    end(activeFilter: FileFilter): FileFilter;
}

export interface ParentParser extends Parser {
    containsNestedGroupParser(): boolean;
}

export function isParentParser(parser: object): parser is ParentParser {
    return (
        "containsNestedGroupParser" in parser &&
        typeof parser.containsNestedGroupParser === "function"
    );
}
