import { StringChecker } from "./StringChecker";

export class Or implements StringChecker {

    constructor(
        private readonly a: StringChecker,
        private readonly b: StringChecker
    ) {}

    matches(test: string): boolean {
        return this.a.matches(test) || this.b.matches(test)
    }

}