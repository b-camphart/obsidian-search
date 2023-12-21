import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryParser } from "./SubQueryParser";
import { Phrase } from "src/checkers/Phrase";

export class SubQueryPhraseParser implements SubQueryParser {
    private escaped: boolean = false;
    private buffer: string = "";

    constructor(
        private matchCase: boolean = true
    ) {}

    parse(char: string): SubQueryParser | null {
        switch (char) {
            case `\\`: {
                if (!this.escaped) {
                    this.escaped = true;
                    return this;
                }
            }
            case `"`: {
                if (!this.escaped) {
                    return null;
                }
            }
        }
        this.escaped = false;
        this.buffer += char;
        return this;
    }

    end(): StringChecker | void {
        if (this.buffer.length > 0) {
            return new Phrase(this.buffer, this.matchCase);
        }
    }
}