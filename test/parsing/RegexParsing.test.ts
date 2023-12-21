import { describe, expect, it } from "vitest";
import { parse } from "src/main";
import { content } from "src/filters/FileContentFilter";
import { regex } from "src/checkers/Regex";
import { not } from "src/checkers/Not";
import { negate } from "src/filters/Negation";

describe(`Parsing a Regex`, () => {
    it(`matches a single word`, () => {
        const filter = parse(`/Hello/`, null as any);

        expect(filter).toEqual(content(regex`Hello`));
    });

    it(`matches against two words`, () => {
        const filter = parse(`/Hello world/`, null as any);

        expect(filter).toEqual(content(regex`Hello world`));
    });

    it(`can contain an escaped slash`, () => {
        const filter = parse(
            `/Hello, \\/Bob,\\/ if that is your real name./`,
            null as any,
        );

        expect(filter).toEqual(
            content(regex`Hello, /Bob,/ if that is your real name.`),
        );
    });

    it(`does not have to be closed`, () => {
        const filter = parse(`/Hello world`, null as any);

        expect(filter).toEqual(content(regex`Hello world`));
    });

    it(`does not have to close the escaped regex`, () => {
        const filter = parse(`/Hello, \\/Bob,`, null as any);

        expect(filter).toEqual(content(regex`Hello, /Bob,`));
    });

    it(`can be negated`, () => {
        const filter = parse(`-/Hello world/`, null as any);

        const possibilities = [
            content(not(regex`Hello world`)),
            negate(content(regex`Hello world`))
        ]

        expect(possibilities).toContainEqual(filter);
    });
});
