import { StringChecker } from "./StringChecker";

export function word(word: string, options?: { matchCase: boolean }): StringChecker;
export function word(word: TemplateStringsArray): StringChecker;
export function word(
    word: TemplateStringsArray | string,
    { matchCase = true }: { matchCase: boolean } = { matchCase: true },
): StringChecker {
    if (typeof word === "string") {
        return new Word(word, matchCase);
    }
    return new Word(word.join(""), matchCase);
}
export class Word implements StringChecker {

    constructor(
        private readonly word: string,

        private readonly matchCase: boolean = true
    ) {}

    matches(test: string): boolean {
        if (this.matchCase) {
            return test.includes(this.word)
        }
        return test.toLocaleUpperCase().includes(this.word.toLocaleUpperCase())
    }

}