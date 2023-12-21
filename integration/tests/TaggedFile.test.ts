import { TFile } from "obsidian";
import { TestContext } from "../framework/TestContext";
import { expect } from "../framework";


export function suite(this: TestContext) {

    let taggedFile: TFile;

    this.beforeAll(async (app) => {
        taggedFile = await app.vault.create("taggedFile.md", `---
tag: single-tag
tags:
  - tag2
  - tag3
---

#inline-tag
`)
    })

    this.test(`inline tags have hashes`, (app) => {
        const fileCache = app.metadataCache.getFileCache(taggedFile)
        if (fileCache == null) throw new Error("no file cache created yet")
        
        expect(fileCache.tags!.map(it => it.tag)).toContainEqual("#inline-tag")
    })

    this.test(`single tag is standard string`, (app) => {
        const fileCache = app.metadataCache.getFileCache(taggedFile)
        if (fileCache == null) throw new Error("no file cache created yet")
        
        expect(fileCache.frontmatter!.tag).toEqual("single-tag")
    })

    this.test(`tag list is array of strings`, (app) => {
        const fileCache = app.metadataCache.getFileCache(taggedFile)
        if (fileCache == null) throw new Error("no file cache created yet")
        
        expect(fileCache.frontmatter!.tags).toEqual(["tag2", "tag3"])
    })

}