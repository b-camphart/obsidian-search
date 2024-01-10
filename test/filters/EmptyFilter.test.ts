import { EmtpyFilter } from "src/main";
import { AlwaysMatch } from "src/filters/AlwaysMatch"
import { describe, it, expect } from "vitest";


describe(`Emtpy filter`, () => {

    it(`never matches against a file`, async () => {
        expect(await EmtpyFilter.appliesTo({} as any)).toBeFalsy();
    })

    describe(`combining it with another filter`, () => {

        it(`defers to the 'and'ed filter`, async () => {
            const filter = EmtpyFilter.and(AlwaysMatch);

            expect(await filter.appliesTo({} as any)).toBeTruthy();
        })

        it(`defers to the 'or'ed filter`, async () => {
            const filter = EmtpyFilter.or(AlwaysMatch);

            expect(await filter.appliesTo({} as any)).toBeTruthy();
        })

    })

})