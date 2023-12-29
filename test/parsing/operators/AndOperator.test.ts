import { group } from "src/checkers/Group";
import { Word, word } from "src/checkers/Word";
import { content, file, matchAll, parse } from "src/main";
import { describe, it, expect } from "vitest";

describe(`AND operator`, () => {
    it(`requires both filters to match`, () => {
        const filter = parse(`work AND personal`, null as any);

        expect(filter).toEqual(
            content(word`work`).and(content(word`personal`)),
        );
    });

    it(`combines previous filters`, () => {
        const filter = parse(`work meetings AND personal`, null as any);

        expect(filter).toEqual(
            matchAll(
                content(word`work`),
                content(word`meetings`),
                content(word`personal`),
            ),
        );
    });

    it(`works within a group`, () => {
        const filter = parse(
            `personal (meeting AND meetup) freetime`,
            null as any,
        );

        expect(filter).toEqual(
            matchAll(
                content(word`personal`),
                content(word`meeting`),
                content(word`meetup`),
                content(word`freetime`),
            ),
        );
    });

    it(`can be applied to operators`, () => {
        const filter = parse(`file:(work AND personal)`, null as any);

        expect(filter).toEqual(file(group(word`work`, word`personal`)));
    });
});
