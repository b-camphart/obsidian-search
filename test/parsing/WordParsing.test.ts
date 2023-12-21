import { describe, expect, it } from "vitest";
import { hideParseingTrace, parse, traceParsing } from "src/main";
import { content } from "src/filters/FileContentFilter";
import { word } from "src/checkers/Word";
import { MatchAllFilter } from "src/filters/MatchAllFilter";
import { not } from "src/checkers/Not";
import { negate } from "src/filters/Negation";

describe(`Parsing a Word`, () => {
    it(`matches a single word`, () => {
        const filter = parse("Hello", null as any);

        expect(filter).toEqual(content(word`Hello`));
    });

    it(`matches against two words`, () => {
        const filter = parse("Hello world", null as any);

        expect(filter).toEqual(
            new MatchAllFilter([content(word`Hello`), content(word`world`)]),
        );
    });

    it(`can be negated`, () => {
        const filter = parse("-Hello", null as any);

        const possibilities = [
            content(not(word`Hello`)),
            negate(content(word`Hello`))
        ]

        expect(possibilities).toContainEqual(filter)
    });

    it(`can negate only one word of two`, () => {
        const filter = parse(`Hello -world`, null as any);

        const possibilities = [
            new MatchAllFilter([
                content(word`Hello`),
                content(not(word`world`)),
            ]),
            new MatchAllFilter([
                content(word`Hello`),
                negate(content(word`world`))
            ]),            
        ]

        expect(possibilities).toContainEqual(filter)
    });
});
