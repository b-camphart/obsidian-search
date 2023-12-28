import { word } from "src/checkers/Word";
import { FileTagsFilter, parse } from "src/main";
import { describe, expect, it } from "vitest";

describe(`Parsing the "tag:" operator`, () => {
    it(`ignores the '#' symbol`, () => {
        expect(parse(`tag:#tag1`, null as any)).toEqual(
            new FileTagsFilter(word`tag1`, null as any),
        );
    });
});
