import { describe, expect, it } from "vitest";
import { parse } from "src/main";
import { content } from "src/filters/FileContentFilter";
import { phrase } from "src/checkers/Phrase";
import { not } from "src/checkers/Not";
import { negate } from "src/filters/Negation";

describe(`Parsing a Phrase`, () => {
    it(`matches a single word`, () => {
        const filter = parse(`"Hello"`, null as any);

        expect(filter).toEqual(content(phrase`Hello`));
    });

    it(`matches against two words`, () => {
        const filter = parse(`"Hello world"`, null as any);

        expect(filter).toEqual(content(phrase`Hello world`));
    });

    it(`can contain an escaped quote`, () => {
        const filter = parse(
            `"Hello, \\"Bob,\\" if that is your real name."`,
            null as any,
        );

        expect(filter).toEqual(
            content(phrase`Hello, "Bob," if that is your real name.`),
        );
    });

    it(`does not have to be closed`, () => {
        const filter = parse(`"Hello world`, null as any);

        expect(filter).toEqual(content(phrase`Hello world`));
    });

    it(`does not have to close the escaped quote`, () => {
        const filter = parse(`"Hello, \\"Bob,`, null as any);

        expect(filter).toEqual(content(phrase`Hello, "Bob,`));
    });

    it(`can be negated`, () => {
        const filter = parse(`-"Hello world"`, null as any);

        const possibilities = [
            content(not(phrase`Hello world`)),
            negate(content(phrase`Hello world`))
        ]

        expect(possibilities).toContainEqual(filter);
    });
});
