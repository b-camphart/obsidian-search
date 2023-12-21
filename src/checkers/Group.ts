import { StringChecker } from "./StringChecker";

export function group(checkers: StringChecker[]): StringChecker;
export function group(...checkers: StringChecker[]): StringChecker;
export function group(...checkers: StringChecker[] | [StringChecker[]]): StringChecker {
    if (checkers.length === 1) {
        if (Array.isArray(checkers[0])) {
            return matchAll(checkers[0])
        }
    }
    return matchAll(checkers as StringChecker[])
}

function matchAll(checkers: StringChecker[]): StringChecker {
    if (checkers.length === 1) return checkers[0]
    return new Group(checkers)
}

export class Group implements StringChecker {

    constructor(private readonly checkers: readonly StringChecker[]) {}

    matches(test: string): boolean {
        return this.checkers.every(checker => checker.matches(test))
    }

}