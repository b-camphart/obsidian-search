import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryParser } from "./SubQueryParser";
import { DefaultSubQueryParser } from "./DefaultSubQueryParser";
import { group } from "src/checkers/Group";

export class SubQueryGroupParser implements SubQueryParser {
    private internalCheckers: StringChecker[] = []
    private internalParser: SubQueryParser;

    constructor(private matchCase?: boolean) {
        this.internalParser = new DefaultSubQueryParser(matchCase)
    }

    parse(char: string): SubQueryParser | null {
        if (char === `)` && !(this.internalParser instanceof SubQueryGroupParser)) {
            return null
        } else {
            const nextParser = this.internalParser.parse(char)
            if (nextParser != null) {
                this.internalParser = nextParser
            } else {
                this.endInternalParser()
                this.internalParser = new DefaultSubQueryParser(this.matchCase)
            }
        }
        return this;
    }

    private endInternalParser() {
        const checker = this.internalParser.end();
        if (checker != null) {
            this.internalCheckers.push(checker)
        }
    }

    end(): StringChecker | void {
        this.endInternalParser()
        return group(this.internalCheckers)
    }
}

