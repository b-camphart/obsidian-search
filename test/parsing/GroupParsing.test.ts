import { TFile } from "obsidian";
import { group } from "src/checkers/Group";
import { not } from "src/checkers/Not";
import { phrase } from "src/checkers/Phrase";
import { word } from "src/checkers/Word";
import { content } from "src/filters/FileContentFilter";
import { file } from "src/filters/FileNameFilter";
import { path } from "src/filters/FilePathFilter";
import { matchAll } from "src/filters/MatchAllFilter";
import { negate } from "src/filters/Negation";
import { hideParseingTrace, parse, traceParsing } from "src/main";
import { describe, it, expect } from "vitest";

describe(`Parsing a Group`, () => {
    it(`is unwrapped with a single word`, () => {
        const filter = parse(`(Hello)`, null as any);

        expect(filter).toEqual(content(word`Hello`));
    });

    it(`is unwrapped with a single phrase`, () => {
        const filter = parse(`("Hello world")`, null as any);

        expect(filter).toEqual(content(phrase`Hello world`));
    });

    it(`is unwrapped with a negated single word`, () => {
        const filter = parse(`(-Hello)`, null as any);

        expect(filter).toEqualOneOf([
            content(not(word`Hello`)),
            negate(content(word`Hello`)),
        ]);
    });

    it(`is unwrapped with a negated single phrase`, () => {
        const filter = parse(`(-"Hello world")`, null as any);

        expect(filter).toEqualOneOf([
            content(not(phrase`Hello world`)),
            negate(content(phrase`Hello world`)),
        ]);
    });

    it(`combines multiple words`, () => {
        const filter = parse(`(Hello world)`, null as any);

        expect(filter).toEqualOneOf([
            content(group(word`Hello`, word`world`)),
            matchAll([content(word`Hello`), content(word`world`)]),
        ]);
    });

    it(`can negate nested word`, () => {
        const filter = parse(`(Hello -world)`, null as any);

        expect(filter).toEqualOneOf([
            content(group(word`Hello`, not(word`world`))),
            matchAll([content(word`Hello`), negate(content(word`world`))]),
        ]);
    });

    it(`can be negated`, () => {
        const filter = parse(`-(Hello world)`, null as any);

        expect(filter).toEqualOneOf([
            content(not(group(word`Hello`, word`world`))),
            negate(matchAll([content(word`Hello`), content(word`world`)])),
        ]);
    });

    it(`can contain operators`, () => {
        const filter = parse(`(file:Hello path:world)`, null as any);

        expect(filter).toEqual(
            matchAll<TFile>([file(word`Hello`), path(word`world`)]),
        );
    });

    it(`can contain nested gruops`, () => {
        const filter = parse(
            `(file:Hello (Hello path:-("Hello" world)))`,
            null as any,
        );

        expect(filter).toEqual(
            matchAll<TFile>([
                file(word`Hello`),
                matchAll<TFile>([
                    content(word`Hello`),
                    path(not(group(phrase`Hello`, word`world`)))
                ]),
            ]),
        );
    });
});
