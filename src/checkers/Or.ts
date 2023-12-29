import { group } from "./Group";
import { StringChecker } from "./StringChecker";

export class Or implements StringChecker {

    constructor(
        private readonly a: StringChecker,
        private readonly b: StringChecker
    ) {}

    matches(test: string): boolean {
        return this.a.matches(test) || this.b.matches(test)
    }

    or(checker: StringChecker): StringChecker {
        return new Or(this, checker)
    }

    and(checker: StringChecker): StringChecker {
        return group(this, checker)
    }
}