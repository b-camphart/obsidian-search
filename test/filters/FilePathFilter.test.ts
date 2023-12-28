import { path as pathFilter } from "src/filters";
import { describe, expect, it } from "vitest";
import { alwaysMatch, neverMatch, stringCheckerSpy } from "../checkers/doubles";

describe(`Filtering by File Path`, () => {
    it(`applies to a file with a matching path`, async () => {
        const file = { path: "path/to/file.md" };
        let receivedTestString: string | undefined;
        const filter = pathFilter(
            stringCheckerSpy(
                alwaysMatch,
                (test) => (receivedTestString = test),
            ),
        );

        expect(await filter.appliesTo(file)).toBeTruthy();
        expect(receivedTestString).toEqual("path/to/file.md");
    });

    it(`does not apply to a file with a different path`, async () => {
        const file = { path: "path/to/file.md" };
        const filter = pathFilter(neverMatch);

        expect(await filter.appliesTo(file)).toBeFalsy();
    });
});
