import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryParser } from "./SubQueryParser";
import { regex } from "src/checkers/Regex";

export class SubQueryRegexParser implements SubQueryParser {
    private escaped: boolean = false;
    private buffer: string = "";

    constructor(
        private matchCase: boolean = true
    ) {}

    parse(char: string): SubQueryRegexParser | null {
        switch (char) {
            case `\\`: {
                if (!this.escaped) {
                    this.escaped = true;
                    return this;
                }
            }
            case `/`: {
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
            return regex(this.buffer, this.matchCase);
        }
    }
}