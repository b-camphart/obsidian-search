export function isStringChecker(obj: any): obj is StringChecker {
    return (
        obj != null &&
        typeof obj === "object" &&
        "matches" in obj &&
        typeof obj.matches === "function"
    );
}

export interface StringChecker {
    matches(test: string): boolean;
}
