import { MetatdataPropertyFilter } from "src/filters";
import { describe, it, expect } from "vitest";
import { alwaysMatch, neverMatch } from "../checkers/doubles";

describe(`Filter by property`, () => {

    it(`does not match files without frontmatter`, () => {
        const filter = new MetatdataPropertyFilter(alwaysMatch)

        expect.soft(filter.appliesTo(null)).toBeFalsy()
        expect.soft(filter.appliesTo({ })).toBeFalsy()
        expect.soft(filter.appliesTo({ frontmatter: {} })).toBeFalsy()
    })

    it(`matches files with just the matching property name`, () => {
        const filter = new MetatdataPropertyFilter(alwaysMatch)

        expect(filter.appliesTo({ frontmatter: { prop: null } })).toBeTruthy();
    })

    it(`does not match files without matching property name`, () => {
        const filter = new MetatdataPropertyFilter(neverMatch)

        expect(filter.appliesTo({ frontmatter: { prop: null }})).toBeFalsy();
    })

    it(`matches files with matching property name and value`, () => {
        const filter = new MetatdataPropertyFilter(alwaysMatch, alwaysMatch)

        expect(filter.appliesTo({ frontmatter: { prop: "" }})).toBeTruthy();
    })

    it(`does not match files with matching property name, but not value`, () => {
        const filter = new MetatdataPropertyFilter(alwaysMatch, neverMatch)

        expect(filter.appliesTo({ frontmatter: { prop: "" }})).toBeFalsy();
    })

    it(`does not match files with matching value, but not property name`, () => {
        const filter = new MetatdataPropertyFilter(neverMatch, alwaysMatch)

        expect(filter.appliesTo({ frontmatter: { prop: "" }})).toBeFalsy();
    })

})