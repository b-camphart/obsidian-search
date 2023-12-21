import { StringChecker } from "./StringChecker";

export function not(checker: StringChecker): StringChecker {
    if (checker instanceof Not) {
        return checker.not()
    }
    return new Not(checker)
}

export class Not implements StringChecker {

    constructor(private readonly checker: StringChecker) {}

    matches(test: string): boolean {
        return ! this.checker.matches(test)
    }

    not() { return this.checker }

}