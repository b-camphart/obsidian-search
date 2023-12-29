import { Or } from "./Or";
import { StringChecker } from "./StringChecker";

export function group(checkers: readonly StringChecker[]): StringChecker;
export function group(...checkers: readonly StringChecker[]): StringChecker;
export function group(...checkers: readonly StringChecker[] | [readonly StringChecker[]]): StringChecker {
    if (checkers.length === 1) {
        if (Array.isArray(checkers[0])) {
            return combine(checkers[0])
        }
    }
    return combine(checkers as StringChecker[])
}

function combine(checkers: StringChecker[]): StringChecker {
    if (checkers.length === 1) return checkers[0]
    return new Group(checkers)
}

export class Group implements StringChecker {

    constructor(private readonly checkers: readonly StringChecker[]) {}

    matches(test: string): boolean {
        return this.checkers.every(checker => checker.matches(test))
    }

    or(checker: StringChecker): StringChecker {
        return new Or(this, checker)
    }

    and(checker: StringChecker): StringChecker {
        return group(this.checkers.concat([checker]))
    }

}