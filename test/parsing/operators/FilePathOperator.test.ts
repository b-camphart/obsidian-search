import { not } from "src/checkers/Not";
import { phrase } from "src/checkers/Phrase";
import { word } from "src/checkers/Word";
import { group } from "src/checkers/Group";
import { content } from "src/filters/FileContentFilter";
import { path } from "src/filters/FilePathFilter";
import { parse } from "src/main";
import { describe, expect, it } from "vitest";

describe(`Parsing the "path:" operator`, () => {
    it(`detects the operator at the beginning of the query`, () => {
        const filter = parse("path:Hello", null as any);

        expect(filter).toEqual(path(word("Hello")));
    });

    it(`ignores the operator without any subquery`, () => {
        const filter = parse("path: Hello", null as any);

        expect(filter).toEqual(content(word("Hello")));
    });

    it(`allows the subquery to be negated`, () => {
        const filter = parse("path:-Hello", null as any);

        expect(filter).toEqual(path(not(word("Hello"))));
    });

    it(`accepts a phrase subquery`, () => {
        const filter = parse(`path:"Hello World"`, null as any);

        expect(filter).toEqual(path(phrase("Hello World")));
    });

    it(`accepts a grouped subquery`, () => {
        const filter = parse(`path:(Hello world)`, null as any);

        expect(filter).toEqual(path(group(word("Hello"), word("world"))));
    })

    it(`accepts a nested grouped subquery`, () => {
        const filter = parse(`path:(Hello (world bob))`, null as any);

        expect(filter).toEqual(
            path(group(word("Hello"), group(word`world`, word`bob`))),
        );
    });
});
