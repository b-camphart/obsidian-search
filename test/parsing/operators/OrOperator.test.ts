import { group } from "src/checkers/Group";
import { Word, word } from "src/checkers/Word";
import { content, file, matchAll, parse } from "src/main";
import { describe, it, expect } from "vitest";

describe(`OR operator`, () => {
    it(`allows either filter to match`, () => {
        const filter = parse(`work OR personal`, null as any);

        expect(filter).toEqual(content(word`work`).or(content(word`personal`)));
    });

    it(`combines previous filters`, () => {
        const filter = parse(`work meetings OR personal`, null as any);

        expect(filter).toEqual(
            matchAll(content(word`work`), content(word`meetings`)).or(
                content(word`personal`),
            ),
        );
    });

    it(`works within a group`, () => {
        const filter = parse(
            `personal (meeting OR meetup) freetime`,
            null as any,
        );

        expect(filter).toEqual(
            content(word`personal`)
                .and(content(word`meeting`).or(content(word`meetup`)))
                .and(content(word`freetime`)),
        );
    });

    it(`can be applied to operators`, () => {

        const filter = parse(`file:(work OR personal)`, null as any)

        expect(filter).toEqual(file(group(word`work`.or(word`personal`))))

    })
});
