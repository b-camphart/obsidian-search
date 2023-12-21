import { StringChecker, isStringChecker } from "src/checkers/StringChecker";
import { SubQueryParser } from "./SubQueryParser";
import { not } from "src/checkers/Not";
import { DefaultSubQueryParser } from "./DefaultSubQueryParser";

export class SubQueryNegatedParser implements SubQueryParser {
    private internalParser: SubQueryParser;

    constructor(matchCase?: boolean) {
        this.internalParser = new DefaultSubQueryParser(matchCase);
    }

    parse(char: string): SubQueryParser | null {
        const nextParser = this.internalParser.parse(char);
        if (nextParser == null) {
            return null;
        }
        this.internalParser = nextParser;
        return this;
    }

    end(): StringChecker | void {
        const result = this.internalParser.end();
        if (isStringChecker(result)) {
            return not(result);
        }
    }
}
