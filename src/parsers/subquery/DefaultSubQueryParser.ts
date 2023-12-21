import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryPhraseParser } from "./SubQueryPhraseParser";
import { SubQueryNegatedParser } from "./SubQueryNegatedParser";
import { SubQueryParser } from "./SubQueryParser";
import { SubQueryWordParser } from "./SubQueryWordParser";
import { SubQueryGroupParser } from "./SubQueryGroupParser";

export class DefaultSubQueryParser implements SubQueryParser {
    constructor(private readonly matchCase?: boolean) {}

    parse(char: string): SubQueryParser | null {
        switch (char) {
            case `-`: {
                return new SubQueryNegatedParser(this.matchCase);
            }
            case `"`: {
                return new SubQueryPhraseParser(this.matchCase);
            }
            case `(`: {
                return new SubQueryGroupParser(this.matchCase)
            }
            case ` `: {
                return this;
            }
            default: {
                return new SubQueryWordParser(char, this.matchCase);
            }
        }
    }

    end(): StringChecker | void {}
}