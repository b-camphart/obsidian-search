import { word } from "src/checkers/Word";
import {
    MetadataTagFilter,
} from "src/filters";
import { describe, expect, it } from "vitest";

describe(`Filtering by Tag`, () => {
    it(`does not match files with no metadata`, () => {
        const filter = new MetadataTagFilter(word`tag1`)
        
        expect.soft(filter.appliesTo(null)).toBeFalsy()
        expect.soft(filter.appliesTo({})).toBeFalsy()
    })

    it(`matches files containing the tag`, async () => {
        const filter = new MetadataTagFilter(word`tag1`);

        expect(filter.appliesTo({ tags: [{ tag: "#tag1" }] })).toBeTruthy();
    });

    it(`matches files with tags in the frontmatter`, async () => {
        const filter = new MetadataTagFilter(word`tag1`);

        expect(filter.appliesTo({ frontmatter: { tag: "tag1" } })).toBeTruthy();
    });

    it(`matches files with array of tags`, async () => {
        const filter = new MetadataTagFilter(word`tag1`);

        expect(filter.appliesTo({ frontmatter: { tags: ["tag2", "tag1"] } })).toBeTruthy();
    })
});
