import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryParser } from "./SubQueryParser";
import { DefaultSubQueryParser } from "./DefaultSubQueryParser";
import { matchAll } from "src/filters";
import { group } from "src/checkers/Group";

export class SubQueryEitherParser implements SubQueryParser {

    static start(
        aChecker: StringChecker,
        matchCase: boolean = true
    ): SubQueryEitherParser {
        return new SubQueryEitherParser(
            aChecker,
            group(),
            matchCase,
        )
    }

    private constructor(
        private readonly aChecker: StringChecker,
        private readonly bChecker: StringChecker,
        private readonly matchCase?: boolean,
        private readonly internalParser: SubQueryParser = new DefaultSubQueryParser(matchCase)
    ){}

    parse(char: string): SubQueryParser | null {
        const nextParser = this.internalParser.parse(char)
        if (nextParser == null) {
            return new SubQueryEitherParser(
                this.aChecker,
                this.nextChecker(),
                this.matchCase,
                new DefaultSubQueryParser(this.matchCase)
            )
        }
        return new SubQueryEitherParser(
            this.aChecker,
            this.bChecker,
            this.matchCase,
            nextParser
        )
    }

    private nextChecker() {
        const next = this.internalParser.end()
        if (next != null) {
            return this.bChecker.and(next)
        }
        return this.bChecker
    }

    end(): void | StringChecker {
        return this.aChecker.or(this.nextChecker())
    }

}