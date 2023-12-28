import { StringChecker } from "src/checkers/StringChecker";


export const alwaysMatch: StringChecker = {
    matches(test) {
        return true
    },
}
export const neverMatch: StringChecker = {
    matches(test) {
        return false
    },
}

export function stringCheckerSpy(behavior: StringChecker, onCheck: (test: string) => void): StringChecker {
    return {
        matches(test) {
            onCheck(test)
            return behavior.matches(test)
        },
    }
}