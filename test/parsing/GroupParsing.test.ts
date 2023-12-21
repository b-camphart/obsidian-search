import { TFile } from "obsidian";
import { not } from "src/checkers/Not";
import { phrase } from "src/checkers/Phrase";
import { word } from "src/checkers/Word";
import {
    file,
    content,
    path,
    matchAll,
    negate,
    type FileFilter,
} from "src/filters";
import {
    hideParseingTrace,
    parse as actualParse,
} from "src/main";
import { describe, it, expect, afterEach, test } from "vitest";

describe(`Parsing a Group`, () => {
    function parse(query: string | TemplateStringsArray) {
        query = typeof query === "string" ? query : query.join("");
        const filter = actualParse(query, null as any);
        return {
            to(expectedFilter: FileFilter) {
                expect.soft(filter, `"${query}"`).toEqual(expectedFilter);
            },
        };
    }

    afterEach(() => {
        hideParseingTrace();
    });

    it(`is unwrapped with a single word`, () => {
        parse`(Hello)`.to(content(word`Hello`));
    });

    it(`is unwrapped with a single phrase`, () => {
        parse`("Hello world")`.to(content(phrase`Hello world`));
    });

    it(`is unwrapped with a negated single word`, () => {
        parse(`(-Hello)`).to(negate(content(word("Hello"))));
    });

    it(`is unwrapped with a negated single phrase`, () => {
        parse(`(-"Hello world")`).to(negate(content(phrase`Hello world`)));
    });

    it(`combines multiple words`, () => {
        parse(`(Hello world)`).to(
            matchAll(content(word`Hello`), content(word`world`)),
        );
    });

    it(`can negate nested word`, () => {
        parse(`(Hello -world)`).to(
            matchAll(content(word`Hello`), negate(content(word`world`))),
        );
    });

    it(`can be negated`, () => {
        parse(`-(Hello world)`).to(
            negate(matchAll(content(word`Hello`), content(word`world`))),
        );
    });

    it(`can contain operators`, () => {
        parse(`(file:Hello path:world)`).to(
            matchAll<TFile>(file(word`Hello`), path(word`world`)),
        );
    });

    describe(`handling nested groups`, () => {
        test(`simple, nested hierarchy`, () => {
            parse(`((Hello))`).to(content(word`Hello`));
            parse(`(((Hello)))`).to(content(word`Hello`));
            parse(`((((Hello))))`).to(content(word`Hello`));
        });

        test(`adjacent nested groups`, () => {
            parse`((Hello) (There))`.to(
                matchAll(content(word`Hello`), content(word`There`)),
            );
            parse`((Hello) ((There) (General Kenobe)))`.to(
                matchAll(
                    content(word("Hello")),
                    matchAll(
                        content(word("There")),
                        matchAll(
                            content(word("General")),
                            content(word("Kenobe")),
                        ),
                    ),
                ),
            );
        });

        test(`groups within nested operators`, () => {
            parse(`(-(Hello))`).to(negate(content(word("Hello"))));
            parse(`(file:(Hello))`).to(file(word("Hello")));
            parse(`(-(Hello) -(World))`).to(
                matchAll(
                    negate(content(word("Hello"))),
                    negate(content(word("World"))),
                ),
            );
            parse(`(-(Hello) -(World file:-(There)))`).to(
                matchAll(
                    negate(content(word("Hello"))),
                    negate(
                        matchAll(
                            content(word("World")),
                            file(not(word("There"))),
                        ),
                    ),
                ),
            );
        });
    });
});

/*
Let's think about this case:
`(Hello (there -(mr file:kenobe) grevous)`
this SHOULD result in the following filter:
matchAll(
  content(word("Hello")),
  matchAll(
    content(word("there")),
    negate(
      matchAll(
        content(word("mr")),
        file(word("kenobe"))
      )
    )
  ),
  content(word("grevous"))
)


*/
