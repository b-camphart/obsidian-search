import { StringChecker } from "./StringChecker";

export function regex(
    regex: TemplateStringsArray | string | RegExp,
    matchCase: boolean = false
): StringChecker {
    if (typeof regex === "string" || regex instanceof RegExp) {
        return new Regex(new RegExp(regex))
    }
    return new Regex(new RegExp(regex.join("")))
}

export class Regex implements StringChecker {

    private readonly regex: RegExp;

    constructor(
        regex: RegExp,

        matchCase: boolean = false
    ) {
        if (matchCase && regex.flags.includes("i")) {
            this.regex = new RegExp(regex, regex.flags.split("").filter(it => it !== "i").join(""))
        }
        else if (!matchCase && !regex.flags.includes("i")) {
            this.regex = new RegExp(regex, regex.flags + "i")
        } else {
            this.regex = regex
        }
    }

    matches(test: string): boolean {
        return this.regex.test(test)
    }

}