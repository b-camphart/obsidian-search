import { StringChecker, isStringChecker } from "src/checkers/StringChecker";
import { SubQueryParser } from "./SubQueryParser";
import { not } from "src/checkers/Not";
import { DefaultSubQueryParser } from "./DefaultSubQueryParser";
import { SubQueryGroupParser } from "./SubQueryGroupParser";
import { isParentParser } from "../Parser";

export class SubQueryNegatedParser implements SubQueryParser {
    ;

    constructor(
        private readonly matchCase?: boolean,
        private readonly internalParser: SubQueryParser = new DefaultSubQueryParser(matchCase)
    ) {}

    parse(char: string): SubQueryParser | null {
        const nextParser = this.internalParser.parse(char);
        if (nextParser == null) {
            return null;
        }
        return new SubQueryNegatedParser(this.matchCase, nextParser)
    }

    containsNestedGroupParser(): boolean {
        return (
            this.internalParser instanceof SubQueryGroupParser ||
            (isParentParser(this.internalParser) &&
                this.internalParser.containsNestedGroupParser())
        );
    }

    end(): StringChecker | void {
        const result = this.internalParser.end();
        if (isStringChecker(result)) {
            return not(result);
        }
    }
}
