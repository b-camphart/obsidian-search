import { MetadataCache } from "obsidian";
import { group } from "src/checkers/Group";
import { StringChecker } from "src/checkers/StringChecker";
import { word } from "src/checkers/Word";
import { FilePropertyFilter, parse, traceParsing } from "src/main";
import { describe, expect, it } from "vitest";

describe(`Parsing a Property`, () => {
    function property(
        propertyChecker: StringChecker,
        valueChecker?: StringChecker,
    ) {
        return new FilePropertyFilter(
            null as any,
            propertyChecker,
            valueChecker,
        );
    }

    it(`matches files with the property`, () => {
        const filter = parse(`[prop]`, null as any);

        expect(filter).toEqual(property(word`prop`));
    });

    it(`matches files with the value for the property`, () => {
        expect(parse(`[prop:value]`, null as any)).toEqual(
            property(word`prop`, word`value`),
        );
    });

    it(`matches files with both properties`, () => {
        const filter = parse(`[prop1 prop2]`, null as any);

        expect(filter).toEqual(property(group(word`prop1`, word`prop2`)));
    });

    it(`matches files with both properties with value`, () => {
        expect(parse(`[prop1 prop2:value]`, null as any)).toEqual(
            property(group(word`prop1`, word`prop2`), word`value`),
        );
        expect(parse(`[(prop1 prop2):value]`, null as any)).toEqual(
            property(group(word`prop1`, word`prop2`), word`value`),
        );
    });

    it(`matches files with property containing both values`, () => {
        expect(parse(`[prop:value1 value2]`, null as any)).toEqual(
            property(word`prop`, group(word`value1`, word`value2`)),
        );
        expect(parse(`[prop:(value1 value2)]`, null as any)).toEqual(
            property(word`prop`, group(word`value1`, word`value2`)),
        );
    });

    it(`matches files with both properties containing both values`, () => {
        expect(parse(`[prop1 prop2:value1 value2]`, null as any)).toEqual(
            property(
                group(word`prop1`, word`prop2`),
                group(word`value1`, word`value2`),
            ),
        );
        expect(parse(`[(prop1 prop2):(value1 value2)]`, null as any)).toEqual(
            property(
                group(word`prop1`, word`prop2`),
                group(word`value1`, word`value2`),
            ),
        );
    });
});
