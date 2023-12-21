import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryParser } from "./SubQueryParser";
import { Word } from "src/checkers/Word";

export class SubQueryWordParser implements SubQueryParser {
    constructor(
        private _buffer: string,
        private matchCase?: boolean,
    ) {}

    get buffer() {
        return this._buffer
    }

    parse(char: string): SubQueryWordParser | null {
        if (char === ` `) {
            return null;
        }
        this._buffer += char;
        return this;
    }

    end(): StringChecker | void {
        if (this._buffer.length > 0) {
            return new Word(this._buffer, this.matchCase);
        }
    }
}