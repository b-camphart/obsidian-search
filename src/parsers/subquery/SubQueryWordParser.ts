import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryParser } from "./SubQueryParser";
import { Word } from "src/checkers/Word";

export class SubQueryWordParser implements SubQueryParser {
    constructor(
        readonly buffer: string,
        private readonly matchCase?: boolean,
    ) {}

    parse(char: string): SubQueryWordParser | null {
        if (char === ` `) {
            return null;
        }
        return new SubQueryWordParser(
            this.buffer + char,
            this.matchCase
        )
    }

    end(): StringChecker | void {
        if (this.buffer.length > 0) {
            return new Word(this.buffer, this.matchCase);
        }
    }
}