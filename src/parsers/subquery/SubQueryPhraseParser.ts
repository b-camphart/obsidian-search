import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryParser } from "./SubQueryParser";
import { Phrase } from "src/checkers/Phrase";

export class SubQueryPhraseParser implements SubQueryParser {
    
    constructor(
        protected readonly matchCase: boolean = true,
        protected readonly buffer: string = "",
    ) {}

    parse(char: string): SubQueryParser | null {
        switch (char) {
            case `\\`: {
                return new EscapedSubQueryPhraseParser(this.buffer, this.matchCase)
            }
            case `"`: {
                return null;
            }
        }
        return new SubQueryPhraseParser(this.matchCase, this.buffer + char)
    }

    end(): StringChecker | void {
        if (this.buffer.length > 0) {
            return new Phrase(this.buffer, this.matchCase);
        }
    }
}

class EscapedSubQueryPhraseParser extends SubQueryPhraseParser {

    constructor(
        buffer: string,
        matchCase: boolean = true
    ) {
        super(matchCase, buffer)
    }

    parse(char: string): SubQueryParser | null {
        return new SubQueryPhraseParser(
            this.matchCase,
            this.buffer + char, 
        )
    }

}