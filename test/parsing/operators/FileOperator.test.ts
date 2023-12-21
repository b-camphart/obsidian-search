import { group } from "src/checkers/Group";
import { not } from "src/checkers/Not";
import { phrase } from "src/checkers/Phrase";
import { word } from "src/checkers/Word";
import { content } from "src/filters/FileContentFilter";
import { file } from "src/filters/FileNameFilter";
import { negate } from "src/filters/Negation";
import { traceParsing, hideParseingTrace, parse } from "src/main";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

describe(`Parsing the "file:" operator`, () => {
    it(`detects the operator at the beginning of the query`, () => {
        const filter = parse("file:Hello", null as any);

        expect(filter).toEqual(file(word("Hello")));
    });

    it(`ignores the operator without any subquery`, () => {
        const filter = parse("file: Hello", null as any);

        expect(filter).toEqual(content(word("Hello")));
    });

    it(`allows the subquery to be negated`, () => {
        const filter = parse("file:-Hello", null as any);

        expect(filter).toEqual(file(not(word("Hello"))));
    });

    it(`accepts a phrase subquery`, () => {
        const filter = parse(`file:"Hello World"`, null as any);

        expect(filter).toEqual(file(phrase("Hello World")));
    });

    it(`accepts a grouped subquery`, () => {
        const filter = parse(`file:(Hello world)`, null as any);

        expect(filter).toEqual(file(group(word("Hello"), word("world"))));
    });

    it(`accepts a nested grouped subquery`, () => {
        const filter = parse(`file:(Hello (world bob))`, null as any);

        expect(filter).toEqual(
            file(group(word("Hello"), group(word`world`, word`bob`))),
        );
    });

    it(`can be negated`, () => {
        const filter = parse(`-file:(Hello (world bob))`, null as any);

        expect(filter).toEqual(
            negate(file(group(word("Hello"), group(word`world`, word`bob`)))),
        );
    })
});
