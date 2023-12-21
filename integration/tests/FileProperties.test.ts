import { TFile } from "obsidian";
import { TestContext } from "../framework/TestContext";
import { expect } from "../framework";


export function suite(this: TestContext) {

    let fileWithProperties: TFile;

    this.beforeAll(async (app) => {
        fileWithProperties = await app.vault.create("fileWithProps.md", `---
prop1: default-string-value
prop2: "explicit string"
prop3: 3
prop4: "3"
prop5: true
prop6: false
prop7: 
  - array-val-1
  - array-val-2
  - nested:
    - nested-val-1
---
`)
    })

    this.test(`default property value`, (app) => {
        const cache = app.metadataCache.getFileCache(fileWithProperties)

        expect(cache!.frontmatter!.prop1).toStrictEqual("default-string-value")
    })

    this.test(`explicit string value`, (app) => {
        const cache = app.metadataCache.getFileCache(fileWithProperties)

        expect(cache!.frontmatter!.prop2).toStrictEqual("explicit string")
    })

    this.test(`number value`, (app) => {
        const cache = app.metadataCache.getFileCache(fileWithProperties)

        expect(cache!.frontmatter!.prop3).toStrictEqual(3)
    })

    this.test(`true boolean value`, (app) => {
        const cache = app.metadataCache.getFileCache(fileWithProperties)

        expect(cache!.frontmatter!.prop5).toStrictEqual(true)
    })

    this.test(`false boolean value`, (app) => {
        const cache = app.metadataCache.getFileCache(fileWithProperties)

        expect(cache!.frontmatter!.prop6).toStrictEqual(false)
    })

    this.test(`array value`, (app) => {
        const cache = app.metadataCache.getFileCache(fileWithProperties)

        expect(cache!.frontmatter!.prop7).toStrictEqual(["array-val-1", "array-val-2", { 'nested': ["nested-val-1" ] }])
    })
}