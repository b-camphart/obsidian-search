import { StringChecker } from "./StringChecker";

export function phrase(phrase: string, options?: { matchCase: boolean }): StringChecker;
export function phrase(phrase: TemplateStringsArray): StringChecker;
export function phrase(
    phrase: TemplateStringsArray | string,
    { matchCase = true }: { matchCase: boolean } = { matchCase: true },
): StringChecker {
    if (typeof phrase === "string") {
        return new Phrase(phrase, matchCase);
    }
    return new Phrase(phrase.join(""), matchCase);
}

export class Phrase implements StringChecker {
    constructor(
        private readonly phrase: string,

        private readonly matchCase: boolean = false,
    ) {}

    matches(test: string): boolean {
        if (this.matchCase) return test.includes(this.phrase);
        return test
            .toLocaleUpperCase()
            .includes(this.phrase.toLocaleUpperCase());
    }
}
