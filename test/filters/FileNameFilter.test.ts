import { FileNameFilter, file as fileFilter } from "src/filters";
import { describe, expect, it } from "vitest";
import { alwaysMatch, neverMatch, stringCheckerSpy } from "../checkers/doubles";

describe(`Filtering by File Name`, () => {

    it(`applies to a file with a matching basename`, async () => {
        const file = { basename: "basename.md" }
        let receivedTestString: string | undefined;
        const filter = fileFilter(stringCheckerSpy(alwaysMatch, test => (receivedTestString = test)))

        expect(await filter.appliesTo(file)).toBeTruthy()
        expect(receivedTestString).toEqual("basename.md")
    })

    it(`does not apply to a file with a different basename`, async () => {
        const file = { basename: "basename.md" }
        const filter = fileFilter(neverMatch)

        expect(await filter.appliesTo(file)).toBeFalsy()
    })

})