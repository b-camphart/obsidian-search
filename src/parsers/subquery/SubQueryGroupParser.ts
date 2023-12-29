import { StringChecker } from "src/checkers/StringChecker";
import { SubQueryParser } from "./SubQueryParser";
import { DefaultSubQueryParser } from "./DefaultSubQueryParser";
import { group } from "src/checkers/Group";
import { isParentParser } from "../Parser";
import { SubQueryWordParser } from "./SubQueryWordParser";
import { SubQueryEitherParser } from "./SubQueryEitherParser";

export class SubQueryGroupParser implements SubQueryParser {
    public static start(matchCase?: boolean): SubQueryGroupParser {
        return new SubQueryGroupParser(
            [],
            new DefaultSubQueryParser(matchCase),
            matchCase,
        );
    }

    private constructor(
        private readonly internalCheckers: readonly StringChecker[],
        private readonly internalParser: SubQueryParser,
        private readonly matchCase?: boolean,
    ) {}

    parse(char: string): SubQueryParser | null {
        if (char === `)` && !this.containsNestedGroupParser()) {
            return null;
        }

        const nextParser = this.internalParser.parse(char);
        if (nextParser != null) {
            return new SubQueryGroupParser(
                this.internalCheckers,
                nextParser,
                this.matchCase,
            );
        } else {
            if (this.internalParser instanceof SubQueryWordParser) {
                switch (this.internalParser.buffer.toLocaleLowerCase()) {
                    case "or": {
                        return new SubQueryGroupParser(
                            [],
                            SubQueryEitherParser.start(
                                group(this.internalCheckers),
                                this.matchCase,
                            ),
                            this.matchCase,
                        );
                    }
                    case "and": {
                        return new SubQueryGroupParser(
                            this.internalCheckers,
                            new DefaultSubQueryParser(this.matchCase),
                            this.matchCase
                        )
                    }
                }
            }

            return new SubQueryGroupParser(
                this.endInternalParser(),
                new DefaultSubQueryParser(this.matchCase),
                this.matchCase,
            );
        }
    }

    containsNestedGroupParser(): boolean {
        return (
            this.internalParser instanceof SubQueryGroupParser ||
            (isParentParser(this.internalParser) &&
                this.internalParser.containsNestedGroupParser())
        );
    }

    private endInternalParser() {
        const checker = this.internalParser.end();
        if (checker != null) {
            return this.internalCheckers.concat([checker]);
        }
        return this.internalCheckers;
    }

    end(): StringChecker | void {
        return group(this.endInternalParser());
    }
}
