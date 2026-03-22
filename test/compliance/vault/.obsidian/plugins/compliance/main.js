"use strict";
const util = require("util");
const obsidian = require("obsidian");
const net = require("net");
const paths = require("path");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const util__namespace = /* @__PURE__ */ _interopNamespaceDefault(util);
const obsidian__namespace = /* @__PURE__ */ _interopNamespaceDefault(obsidian);
const net__namespace = /* @__PURE__ */ _interopNamespaceDefault(net);
const paths__namespace = /* @__PURE__ */ _interopNamespaceDefault(paths);
function testAnd(run2, obsidian2, search2) {
  run2.test("implicit", async (t) => {
    const file2 = await obsidian2.createFile("test.md", `one two three`);
    t.after(() => obsidian2.deleteFile(file2));
    const file_with_only_one = await obsidian2.createFile("test1.md", "one");
    t.after(() => obsidian2.deleteFile(file_with_only_one));
    const query = "one three";
    t.log({ query });
    const matches = await search2.searchFor(query);
    t.log({ matches });
    if (!matches.some((it) => it.name === "test.md")) {
      t.failWith("expected to find 'test.md' in matches");
      t.log("    content:", await obsidian2.readFile(file2));
    }
    if (matches.some((it) => it.name === "test1.md")) {
      t.failWith("'test1.md' only has 'one' in its body, but was in");
    }
  });
  run2.test("explicit 'AND' is not recognized", async (t) => {
    const file2 = await obsidian2.createFile("test.md", `one two three AND`);
    t.after(() => obsidian2.deleteFile(file2));
    const file_with_only_one = await obsidian2.createFile("test1.md", "one three");
    t.after(() => obsidian2.deleteFile(file_with_only_one));
    const query = "one AND three";
    t.log("query:", query);
    const matches = await search2.searchFor(query);
    t.log("matches:", matches);
    if (!matches.some((it) => it.name === "test.md")) {
      t.failWith(`file containing 'one', 'AND', and 'three' should have matched`);
    }
    if (matches.some((it) => it.name === "test1.md")) {
      t.failWith(`file containing only 'one' and 'three' should NOT have matched`);
    }
  });
}
function testFileOperator$2(t, files2, search2) {
  t.test("non-keyword", async (t2) => {
    const file2 = await files2.createFile("test.md", `keyword:foo`);
    t2.after(() => files2.deleteFile(file2));
    const query = "keyword:foo";
    t2.log({ query });
    const matches = await search2.searchFor(query);
    const expected_message = `Operator "keyword" not recognized`;
    const logged_err = t2.logs.findLast((it) => it.args.some((it2) => it2.includes(expected_message)));
    t2.log({ matches });
    if (!logged_err) {
      t2.failWith("should have logged an error");
    }
    if (matches.length !== 0) {
      t2.failWith("should not have found any matches");
    }
  });
}
function testFileOperator$1(t, files2, search2) {
  t.test("file keyword", async (t2) => {
    const query = "file:test";
    const matching_files = [
      { path: "dir/test.md", content: "" }
    ];
    const non_matching_files = [
      { path: "test/foo.md", content: "" }
    ];
    for (const { path: path2, content: content2 } of [...matching_files, ...non_matching_files]) {
      const file2 = await files2.createFile(path2, content2);
      t2.after(() => files2.deleteFile(file2));
    }
    t2.log({ query });
    const matches = await search2.searchFor(query);
    t2.log({ matches });
    for (const { path: path2 } of matching_files) {
      if (!matches.some((it) => it.path === path2)) {
        t2.failWith(`expected to match file with path "${path2}"`);
      }
    }
    for (const { path: path2 } of non_matching_files) {
      if (matches.some((it) => it.path === path2)) {
        t2.failWith(`expected NOT to have matched file with path "${path2}"`);
      }
    }
  });
  t.test("nesting operator within operator", async (t2) => {
    const query = "file:file:";
    const file_list = [
      { path: "file.md", content: "" }
    ];
    for (const { path: path2, content: content2 } of file_list) {
      const file2 = await files2.createFile(path2, content2);
      t2.after(() => files2.deleteFile(file2));
    }
    t2.log({ query });
    const matches = await search2.searchFor(query);
    const expected_message = `Operator "file" cannot be nested within "file"`;
    const logged_err = t2.logs.findLast((it) => it.args.some((it2) => it2.includes(expected_message)));
    t2.log({ matches });
    if (matches.length !== 0) {
      t2.failWith("should not have found any matches");
    }
    if (!logged_err) {
      t2.failNowWith("should have logged an error");
    }
  });
  t.test("file keyword with additional query", async (t2) => {
    const query = "file:test something";
    const matching_files = [
      { path: "dir/test.md", content: "something" }
    ];
    const non_matching_files = [
      { path: "dir1/test.md", content: "" },
      { path: "test/foo.md", content: "" }
    ];
    for (const { path: path2, content: content2 } of [...matching_files, ...non_matching_files]) {
      const file2 = await files2.createFile(path2, content2);
      t2.after(() => files2.deleteFile(file2));
    }
    t2.log({ query });
    const matches = await search2.searchFor(query);
    t2.log({ matches });
    for (const { path: path2, content: content2 } of matching_files) {
      if (!matches.some((it) => it.path === path2)) {
        t2.failWith(`expected to match file with path "${path2}" and content: ${content2}`);
      }
    }
    for (const { path: path2, content: content2 } of non_matching_files) {
      if (matches.some((it) => it.path === path2)) {
        t2.failWith(`expected NOT to have matched file with path "${path2}" and content: ${content2}`);
      }
    }
  });
  t.test("negate within subquery", async (t2) => {
    const test_file = await files2.createFile("test.md");
    t2.after(() => files2.deleteFile(test_file));
    const other_file = await files2.createFile("other.md");
    t2.after(() => files2.deleteFile(other_file));
    const query = `file:-test`;
    t2.log({ query });
    const matches = await search2.searchFor(query);
    t2.log({ matches });
    if (!matches.some((it) => it.name === "other.md")) {
      t2.failWith(`expected to find file "other.md"`);
    }
    if (matches.some((it) => it.name === "test.md")) {
      t2.failWith(`should NOT have matched "test.md"`);
    }
  });
  t.test("group within subquery", async (t2) => {
    const query = `file:(some thing)`;
    const matching_files = [
      { path: "(some thing).md", content: "" }
    ];
    const non_matching_files = [
      { path: "some/thing.md", content: "" },
      { path: "thing/some.md", content: "" },
      { path: "some.md", content: "" },
      { path: "thing.md", content: "" },
      { path: "(some.md", content: "thing)" }
    ];
    for (const { path: path2, content: content2 } of [...non_matching_files, ...matching_files]) {
      const file2 = await files2.createFile(path2, content2);
      t2.after(() => files2.deleteFile(file2));
    }
    t2.log({ query });
    const matches = await search2.searchFor(query);
    t2.log({ matches });
    for (const { path: path2, content: content2 } of matching_files) {
      if (!matches.some((it) => it.path === path2)) {
        t2.failWith(`expected to match file with path "${path2}" and content: ${content2}`);
      }
    }
    for (const { path: path2, content: content2 } of non_matching_files) {
      if (matches.some((it) => it.path === path2)) {
        t2.failWith(`expected NOT have matched file with path "${path2}" and content: ${content2}`);
      }
    }
  });
  t.test("negated group within subquery", async (t2) => {
    const query = `file:-(some thing)`;
    const matching_files = [
      { path: "some/thing.md", content: "" },
      { path: "thing/some.md", content: "" },
      { path: "some.md", content: "" },
      { path: "thing.md", content: "" },
      { path: "(some.md", content: "thing)" }
    ];
    const non_matching_files = [
      { path: "(some thing).md", content: "" }
    ];
    for (const { path: path2, content: content2 } of [...matching_files, ...non_matching_files]) {
      const file2 = await files2.createFile(path2, content2);
      t2.after(() => files2.deleteFile(file2));
    }
    t2.log({ query });
    const matches = await search2.searchFor(query);
    t2.log({ matches });
    for (const { path: path2, content: content2 } of matching_files) {
      if (!matches.some((it) => it.path === path2)) {
        t2.failWith(`expected to match file with path "${path2}" and content: ${content2}`);
      }
    }
    for (const { path: path2, content: content2 } of non_matching_files) {
      if (matches.some((it) => it.path === path2)) {
        t2.failWith(`expected NOT have matched file with path "${path2}" and content: ${content2}`);
      }
    }
  });
  t.test("path:", async (t2) => {
    const matching_file = await files2.createFile("dir/test.md");
    t2.after(() => files2.deleteFile(matching_file));
    const file_in_dir = await files2.createFile("test/foo.md");
    t2.after(() => files2.deleteFile(file_in_dir));
    const matches = await search2.searchFor("path:test");
    if (!matches.some((match) => match.name === "test.md")) {
      t2.failWith("did not match file name");
    }
    if (!matches.some((match) => match.name === "foo.md")) {
      t2.failWith("did not match directory name");
    }
  });
}
function testNegation(run2, obsidian2, search2) {
  run2.test("not word", async (t) => {
    const file2 = await obsidian2.createFile("has word.md", "word");
    t.after(() => obsidian2.deleteFile(file2));
    const matches = await search2.searchFor(`-word`);
    if (matches.some((it) => it.name === "has word.md")) {
      t.failWith("file with word should NOT match because it was negated");
    }
  });
}
function testOr(run2, obsidian2, search2) {
  run2.test("basic usage", async (t) => {
    const match1 = await obsidian2.createFile("match1.md", "value1");
    t.after(() => obsidian2.deleteFile(match1));
    const match2 = await obsidian2.createFile("match2.md", "value2");
    t.after(() => obsidian2.deleteFile(match2));
    const non_match = await obsidian2.createFile("non_match.md", "value3");
    t.after(() => obsidian2.deleteFile(non_match));
    const query = "value1 OR value2";
    t.log("query:", query);
    const matches = await search2.searchFor(query);
    t.log("matches:", matches);
    if (!matches.some((it) => it.name === "match1.md")) {
      t.failWith("file containing `value1` not found");
    }
    if (!matches.some((it) => it.name === "match2.md")) {
      t.failWith("file containing `value2` not found");
    }
    if (matches.some((it) => it.name === "non_match.md")) {
      t.failWith("file not containing either value was found");
    }
  });
  run2.test("lowercase 'or' is considered a regular word", async (t) => {
    const match1 = await obsidian2.createFile("match1.md", "value1");
    t.after(() => obsidian2.deleteFile(match1));
    const match2 = await obsidian2.createFile("match2.md", "value2");
    t.after(() => obsidian2.deleteFile(match2));
    const or_match = await obsidian2.createFile("or_match.md", "or value2 value1");
    t.after(() => obsidian2.deleteFile(or_match));
    const query = "value1 or value2";
    t.log("query:", query);
    const matches = await search2.searchFor(query);
    t.log("matches:", matches);
    if (matches.some((it) => it.name === "match1.md")) {
      t.failWith("file containing only `value1` should not have been found");
    }
    if (matches.some((it) => it.name === "match2.md")) {
      t.failWith("file containing only `value2` should not have found");
    }
    if (!matches.some((it) => it.name === "or_match.md")) {
      t.failWith("file containing all the words should have been included in match");
    }
  });
  run2.test("OR by itself", async (t) => {
    const file_without_or = await obsidian2.createFile("without.md", "");
    t.after(() => obsidian2.deleteFile(file_without_or));
    const file_with_or = await obsidian2.createFile("with.md", "OR");
    t.after(() => obsidian2.deleteFile(file_with_or));
    const query = "OR";
    t.log({ query });
    const matches = await search2.searchFor(query);
    t.log({ matches });
    if (matches.length > 0) {
      t.failWith("should not have found any matches");
    }
  });
  run2.test("OR quoted", async (t) => {
    const file_without_or = await obsidian2.createFile("without.md", "");
    t.after(() => obsidian2.deleteFile(file_without_or));
    const file_with_or = await obsidian2.createFile("with.md", "OR");
    t.after(() => obsidian2.deleteFile(file_with_or));
    const query = `"OR"`;
    t.log({ query });
    const matches = await search2.searchFor(query);
    t.log({ matches });
    if (!matches.some((it) => it.path === "with.md")) {
      t.failWith("should have matched file 'with.md' with content:: " + await obsidian2.readFile(file_with_or));
    }
    if (matches.some((it) => it.path === "without.md")) {
      t.failWith("should NOT have matched file 'without.md'");
    }
  });
  run2.test("negated OR", async (t) => {
    const file_without_or = await obsidian2.createFile("without.md", "");
    t.after(() => obsidian2.deleteFile(file_without_or));
    const file_with_or = await obsidian2.createFile("with.md", "OR");
    t.after(() => obsidian2.deleteFile(file_with_or));
    const query = "-OR";
    t.log({ query });
    const matches = await search2.searchFor(query);
    t.log({ matches });
    if (matches.length > 0) {
      t.failWith("should not have found any matches");
    }
  });
}
function testFileOperator(t, files2, search2) {
  async function pathTest(t2, query, expected, unexpected) {
    t2.log({ query });
    const expected_matches = [];
    for (let i = 0; i < expected.length; i++) {
      const { path: path2, content: content2 } = expected[i];
      const file2 = await files2.createFile(path2, content2);
      t2.after(() => files2.deleteFile(file2));
      expected_matches.push({ path: path2, file: file2 });
    }
    const unexpected_matches = [];
    for (let i = 0; i < unexpected.length; i++) {
      const { path: path2, content: content2 } = unexpected[i];
      const file2 = await files2.createFile(path2, content2);
      t2.after(() => files2.deleteFile(file2));
      unexpected_matches.push({ path: path2, file: file2 });
    }
    const matches = await search2.searchFor(query);
    t2.log({ matches });
    for (const { path: path2, file: file2 } of expected_matches) {
      if (!matches.some((it) => it.path === path2)) {
        t2.failWith(`did not find ${path2} in matches`);
        t2.log("    content:", await files2.readFile(file2));
      }
    }
    for (const { path: path2 } of unexpected_matches) {
      if (matches.some((it) => it.path === path2)) {
        t2.failWith(`expected NOT to find ${path2} in matches`);
      }
    }
    return matches;
  }
  t.test("path keyword", async (t2) => {
    await pathTest(
      t2,
      "path:test",
      // expected matches
      [
        { path: "dir/test.md" },
        { path: "dir/test1.md" },
        { path: "test/foo.md" },
        { path: "test1/foo.md" }
      ],
      // unexpected matches
      [
        { path: "dir/tes.md" }
      ]
    );
  });
  t.test("nesting operator within operator", async (t2) => {
    await pathTest(
      t2,
      "path:path:",
      // expected matches
      [],
      // unexpected matches
      [
        { path: "path.md" },
        { path: "path/path.md" }
      ]
    );
    const expected_message = `Operator "path" cannot be nested within "path"`;
    const logged_err = t2.logs.findLast((it) => it.args.some((it2) => it2.includes(expected_message)));
    if (!logged_err) {
      t2.failNowWith("should have logged an error");
    }
  });
  t.test("path keyword with additional query", async (t2) => {
    await pathTest(
      t2,
      "path:test something",
      // expected matches
      [
        { path: "dir/test.md", content: "something" },
        { path: "dir/tested.md", content: "something" },
        { path: "test/foo.md", content: "something" },
        { path: "testing/foo.md", content: "something" }
      ],
      // unexpected matches
      [
        { path: "dir/test1.md", content: "" },
        { path: "dir/test2.md", content: "" },
        { path: "test1/foo.md", content: "" },
        { path: "test2/foo.md", content: "" },
        { path: "tes/foo.md", content: "something" }
      ]
    );
  });
  t.test("negate within subquery", async (t2) => {
    const test_file = await files2.createFile("test.md");
    t2.after(() => files2.deleteFile(test_file));
    const other_file = await files2.createFile("other.md");
    t2.after(() => files2.deleteFile(other_file));
    const query = `file:-test`;
    t2.log({ query });
    const matches = await search2.searchFor(query);
    t2.log({ matches });
    if (!matches.some((it) => it.name === "other.md")) {
      t2.failWith(`expected to find file "other.md"`);
    }
    if (matches.some((it) => it.name === "test.md")) {
      t2.failWith(`should NOT have matched "test.md"`);
    }
  });
  t.test("group within subquery", async (t2) => {
    const query = `file:(some thing)`;
    const matching_files = [
      { path: "(some thing).md", content: "" }
    ];
    const non_matching_files = [
      { path: "some/thing.md", content: "" },
      { path: "thing/some.md", content: "" },
      { path: "some.md", content: "" },
      { path: "thing.md", content: "" },
      { path: "(some.md", content: "thing)" }
    ];
    for (const { path: path2, content: content2 } of [...non_matching_files, ...matching_files]) {
      const file2 = await files2.createFile(path2, content2);
      t2.after(() => files2.deleteFile(file2));
    }
    t2.log({ query });
    const matches = await search2.searchFor(query);
    t2.log({ matches });
    for (const { path: path2, content: content2 } of matching_files) {
      if (!matches.some((it) => it.path === path2)) {
        t2.failWith(`expected to match file with path "${path2}" and content: ${content2}`);
      }
    }
    for (const { path: path2, content: content2 } of non_matching_files) {
      if (matches.some((it) => it.path === path2)) {
        t2.failWith(`expected NOT have matched file with path "${path2}" and content: ${content2}`);
      }
    }
  });
  t.test("negated group within subquery", async (t2) => {
    const query = `file:-(some thing)`;
    const matching_files = [
      { path: "some/thing.md", content: "" },
      { path: "thing/some.md", content: "" },
      { path: "some.md", content: "" },
      { path: "thing.md", content: "" },
      { path: "(some.md", content: "thing)" }
    ];
    const non_matching_files = [
      { path: "(some thing).md", content: "" }
    ];
    for (const { path: path2, content: content2 } of [...matching_files, ...non_matching_files]) {
      const file2 = await files2.createFile(path2, content2);
      t2.after(() => files2.deleteFile(file2));
    }
    t2.log({ query });
    const matches = await search2.searchFor(query);
    t2.log({ matches });
    for (const { path: path2, content: content2 } of matching_files) {
      if (!matches.some((it) => it.path === path2)) {
        t2.failWith(`expected to match file with path "${path2}" and content: ${content2}`);
      }
    }
    for (const { path: path2, content: content2 } of non_matching_files) {
      if (matches.some((it) => it.path === path2)) {
        t2.failWith(`expected NOT have matched file with path "${path2}" and content: ${content2}`);
      }
    }
  });
  t.test("path:", async (t2) => {
    const matching_file = await files2.createFile("dir/test.md");
    t2.after(() => files2.deleteFile(matching_file));
    const file_in_dir = await files2.createFile("test/foo.md");
    t2.after(() => files2.deleteFile(file_in_dir));
    const matches = await search2.searchFor("path:test");
    if (!matches.some((match) => match.name === "test.md")) {
      t2.failWith("did not match file name");
    }
    if (!matches.some((match) => match.name === "foo.md")) {
      t2.failWith("did not match directory name");
    }
  });
}
class Files {
  impl;
  createFile;
  readFile;
  deleteFile;
  constructor(def) {
    this.impl = def.impl;
    this.createFile = def.createFile;
    this.readFile = def.readFile;
    this.deleteFile = def.deleteFile;
  }
}
class Frontmatter {
  tags;
  aliases;
  cssclasses;
  properties;
  constructor(def) {
    this.tags = def.tags ?? [];
    this.aliases = def.aliases ?? [];
    this.cssclasses = def.cssclasses ?? [];
    this.properties = def.properties ?? {};
  }
}
async function testProperty(t, files2, search2) {
  async function propertyTest(t2, query, expected, unexpected) {
    t2.log({ query });
    const expected_matches = [];
    for (let i = 0; i < expected.length; i++) {
      const path2 = `expected ${i}.md`;
      const file2 = await files2.createFile(path2, "", expected[i]);
      expected_matches.push({ path: path2, file: file2 });
      t2.after(() => files2.deleteFile(file2));
    }
    const unexpected_matches = [];
    for (let i = 0; i < unexpected.length; i++) {
      const path2 = `unexpected ${i}.md`;
      const file2 = await files2.createFile(path2, "", unexpected[i]);
      unexpected_matches.push({ path: path2, file: file2 });
      t2.after(() => files2.deleteFile(file2));
    }
    const matches = await search2.searchFor(query);
    t2.log({ matches });
    for (const { path: path2, file: file2 } of expected_matches) {
      if (!matches.some((it) => it.path === path2)) {
        t2.failWith(`did not find ${path2} in matches`);
        t2.log("    content:", await files2.readFile(file2));
      }
    }
    for (const { path: path2 } of unexpected_matches) {
      if (matches.some((it) => it.path === path2)) {
        t2.failWith(`expected NOT to find ${path2} in matches`);
      }
    }
  }
  t.suite("[property]", async (t2) => {
    t2.test("[tags]", async (t3) => {
      t3.log("match files that have the 'tags' property");
      await propertyTest(
        t3,
        "[tags]",
        /* should match */
        [
          new Frontmatter({ tags: ["foo"] }),
          new Frontmatter({ properties: { tags1: "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({})
        ]
      );
    });
    t2.test("[aliases]", async (t3) => {
      t3.log("match files that have the 'aliases' property");
      await propertyTest(
        t3,
        "[aliases]",
        /* should match */
        [
          new Frontmatter({ aliases: ["foo"] }),
          new Frontmatter({ properties: { aliases1: "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({})
        ]
      );
    });
    t2.test("[cssclasses]", async (t3) => {
      t3.log("match files that have the 'cssclasses' property");
      await propertyTest(
        t3,
        "[cssclasses]",
        /* should match */
        [
          new Frontmatter({ cssclasses: ["foo"] }),
          new Frontmatter({ properties: { cssclasses1: "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({})
        ]
      );
    });
    t2.test("arbitrary property", async (t3) => {
      t3.log("match files that have property name containing 'prop'");
      await propertyTest(
        t3,
        "[prop]",
        /* should match */
        [
          new Frontmatter({ properties: { prop: "" } }),
          new Frontmatter({ properties: { prop1: "" } }),
          new Frontmatter({ properties: { "some-prop": "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({})
        ]
      );
    });
    t2.test("negated property name", async (t3) => {
      t3.log("match files that have property name NOT containing 'prop1'");
      await propertyTest(
        t3,
        `[-prop1]`,
        /* should match */
        [
          new Frontmatter({ tags: ["foo"] }),
          new Frontmatter({ properties: { prop2: "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({}),
          // file has no frontmatter, so check is skipped
          new Frontmatter({ properties: { prop1: "" } }),
          new Frontmatter({ properties: { prop11: "" } })
        ]
      );
    });
    t2.test("multiple property names", async (t3) => {
      t3.log("match files that have property name containing 'prop1 prop2'");
      await propertyTest(
        t3,
        `[prop1 prop2]`,
        /* should match */
        [
          new Frontmatter({ properties: { "prop1 prop2": "" } }),
          new Frontmatter({ properties: { "prop1 prop22": "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({}),
          new Frontmatter({ properties: { prop1: "" } }),
          new Frontmatter({ properties: { prop2: "" } }),
          new Frontmatter({ properties: { prop1: "", prop2: "" } }),
          new Frontmatter({ properties: { prop1: "", prop2: "", prop3: "" } }),
          new Frontmatter({ properties: { prop1: "", prop3: "" } }),
          new Frontmatter({ properties: { prop2: "", prop3: "" } })
        ]
      );
    });
    t2.test("first prop name negated", async (t3) => {
      t3.log("match files that have property name NOT containing 'prop1 prop2'");
      await propertyTest(
        t3,
        `[-prop1 prop2]`,
        /* should match */
        [
          new Frontmatter({ properties: { prop1: "", prop2: "" } }),
          new Frontmatter({ properties: { prop2: "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({}),
          new Frontmatter({ properties: { ["-prop1 prop2"]: "" } }),
          new Frontmatter({ properties: { ["prop1 prop2"]: "" } }),
          new Frontmatter({ properties: { prop1: "" } }),
          new Frontmatter({ properties: { ["-prop1"]: "" } })
        ]
      );
      t3.log("files without property 'prop1 prop2' should match");
    });
    t2.test("second prop name negated", async (t3) => {
      t3.log("match files with property name containing 'prop1' (second negation breaks parser, so '-prop2' is ignored)");
      await propertyTest(
        t3,
        `[prop1 -prop2]`,
        /* should match */
        [
          new Frontmatter({ properties: { prop1: "", prop2: "" } }),
          new Frontmatter({ properties: { prop1: "" } }),
          new Frontmatter({ properties: { prop11: "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({}),
          new Frontmatter({ properties: { prop2: "" } }),
          new Frontmatter({ properties: { ["-prop2"]: "" } }),
          new Frontmatter({ properties: { ["prop1 -prop2"]: "" } }),
          new Frontmatter({ properties: { ["prop1 prop2"]: "" } })
        ]
      );
    });
    t2.test("grouped property name", async (t3) => {
      t3.log("match files that have property name containing '(prop1 prop2)'");
      await propertyTest(
        t3,
        `[(prop1 prop2)]`,
        /* should match */
        [
          new Frontmatter({ properties: { "(prop1 prop2)": "" } }),
          new Frontmatter({ properties: { "(prop1 prop2))": "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({}),
          new Frontmatter({ properties: { prop1: "" } }),
          new Frontmatter({ properties: { prop2: "" } }),
          new Frontmatter({ properties: { prop1: "", prop2: "" } })
        ]
      );
    });
    t2.test("negated grouped property name", async (t3) => {
      t3.log("match files that have property name NOT containing '(prop1 prop2)'");
      await propertyTest(
        t3,
        `[-(prop1 prop2)]`,
        /* should match */
        [
          new Frontmatter({ properties: { prop1: "" } }),
          new Frontmatter({ properties: { prop2: "" } }),
          new Frontmatter({ properties: { prop1: "", prop2: "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({}),
          new Frontmatter({ properties: { "(prop1 prop2)": "" } })
        ]
      );
    });
    t2.test("either property name", async (t3) => {
      t3.log("match files with property name containing 'prop1' or 'prop2'");
      await propertyTest(
        t3,
        `[prop1 OR prop2]`,
        /* should match */
        [
          new Frontmatter({ properties: { prop1: "" } }),
          new Frontmatter({ properties: { prop2: "" } }),
          new Frontmatter({ properties: { prop1: "", prop2: "" } })
        ],
        /* should NOT match */
        [
          new Frontmatter({}),
          new Frontmatter({ properties: { prop3: "" } })
        ]
      );
    });
    t2.test("negated either property name", async (t3) => {
      t3.log("match files with property name NOT containing 'prop1' or containing 'prop2'");
      await propertyTest(
        t3,
        `[-prop1 OR prop2]`,
        /* should match */
        [
          new Frontmatter({ properties: { prop2: "" } }),
          new Frontmatter({ properties: { prop1: "", prop2: "" } }),
          // OR containing prop2
          new Frontmatter({ properties: { prop1: "", prop22: "" } }),
          // OR containing prop2
          new Frontmatter({ properties: { prop3: "" } })
          // does NOT contain prop1
        ],
        /* should NOT match */
        [
          new Frontmatter({}),
          // no frontmatter is always a non-match
          new Frontmatter({ properties: { prop1: "" } }),
          new Frontmatter({ properties: { prop11: "" } })
        ]
      );
    });
    t2.test("either property name, but second is negated", async (t3) => {
      t3.log("match files with property name containing 'prop1' or NOT containing 'prop2'");
      await propertyTest(
        t3,
        `[prop1 OR -prop2]`,
        /* should match */
        [
          new Frontmatter({ properties: { prop1: "" } }),
          // contains prop1
          new Frontmatter({ properties: { prop1: "", prop2: "" } }),
          // OR containing prop1
          new Frontmatter({ properties: { prop11: "", prop2: "" } }),
          // OR containing prop1
          new Frontmatter({ properties: { prop3: "" } })
          // does NOT contain prop2
        ],
        /* should NOT match */
        [
          new Frontmatter({}),
          // no frontmatter is always a non-match
          new Frontmatter({ properties: { prop2: "" } }),
          new Frontmatter({ properties: { prop22: "" } })
        ]
      );
    });
    t2.test("grouping after OR", async (t3) => {
      t3.log("match files with property name containing 'prop1' or containing '(prop2 prop3)'");
      await propertyTest(
        t3,
        `[prop1 OR (prop2 prop3)]`,
        /* should match */
        [
          new Frontmatter({ properties: { prop1: "" } }),
          // contains prop1
          new Frontmatter({ properties: { "(prop2 prop3)": "" } })
          // contains "(prop2 prop3)"
        ],
        /* should NOT match */
        [
          new Frontmatter({}),
          // no frontmatter is always a non-match
          new Frontmatter({ properties: { prop2: "", prop3: "" } })
          // group is not treated as AND
        ]
      );
    });
    t2.test("either of three property names", async (t3) => {
      t3.log("match files with property name containing 'prop1', 'prop2' or 'prop3'");
      await propertyTest(
        t3,
        `[prop1 OR prop2 OR prop3]`,
        /* should match */
        [
          new Frontmatter({ properties: { prop1: "" } }),
          // contains prop1
          new Frontmatter({ properties: { prop2: "" } }),
          // contains prop2
          new Frontmatter({ properties: { prop3: "" } }),
          // contains prop3
          new Frontmatter({ properties: { prop11: "" } }),
          // contains prop2
          new Frontmatter({ properties: { prop22: "" } }),
          // contains prop2
          new Frontmatter({ properties: { prop33: "" } })
          // contains prop2
        ],
        /* should NOT match */
        [
          new Frontmatter({})
          // no frontmatter is always a non-match
        ]
      );
    });
  });
  t.suite("[property:value]", async (t2) => {
    t2.test("[aliases:Name]", async (t3) => {
      const file2 = await files2.createFile("test.md", "", new Frontmatter({
        aliases: [
          "Name"
        ]
      }));
      t3.after(() => files2.deleteFile(file2));
      const non_match = await files2.createFile("test1.md", "", new Frontmatter({
        aliases: [
          "Other"
        ]
      }));
      t3.after(() => files2.deleteFile(non_match));
      const matches = await search2.searchFor("[aliases:Name]");
      if (!matches.some((it) => it.name === "test.md")) {
        t3.failWith("expected to find 'test.md' in", matches);
      }
      if (matches.some((it) => it.name === "test1.md")) {
        t3.failWith("expected NOT to find 'test1.md' in", matches);
      }
    });
    t2.test("[aliases:value1 OR value2]", async (t3) => {
      const match1 = await files2.createFile("test.md", "", new Frontmatter({
        aliases: [
          "value1"
        ]
      }));
      t3.after(() => files2.deleteFile(match1));
      const match2 = await files2.createFile("test1.md", "", new Frontmatter({
        aliases: [
          "value2"
        ]
      }));
      t3.after(() => files2.deleteFile(match2));
      const non_match = await files2.createFile("test2.md", "", new Frontmatter({
        aliases: [
          "value3"
        ]
      }));
      t3.after(() => files2.deleteFile(non_match));
      const matches = await search2.searchFor("[aliases:value1 OR value2]");
      if (!matches.some((it) => it.name === "test.md")) {
        t3.failWith("expected to find test.md in", matches);
      }
      if (!matches.some((it) => it.name === "test1.md")) {
        t3.failWith("expected to find 'test1.md' in", matches);
      }
      if (matches.some((it) => it.name === "test3.md")) {
        t3.failWith("expected NOT to find 'test3.md' in", matches);
      }
    });
    const keywords = [
      `file`,
      `path`,
      `content`,
      `tag`,
      `ignore-case`,
      `match-case`,
      `block`,
      `line`,
      `section`,
      `task`,
      `task-todo`,
      `task-done`
    ];
    t2.suite("keyword as property name", async (run2) => {
      for (const keyword of keywords) {
        run2.suite(`keyword '${keyword}'`, async (run22) => {
          for (const query of [
            `[${keyword}]`,
            `[${keyword}:]`,
            `[${keyword}:value]`
          ]) {
            run22.test(query, async (t3) => {
              const file2 = await files2.createFile("file.md", "", new Frontmatter({ properties: { [keyword]: "value" } }));
              t3.after(() => files2.deleteFile(file2));
              const matches = await search2.searchFor(query);
              t3.log("matches:", matches);
              if (matches.length === 0) {
                t3.failWith("should have found file with property");
              }
            });
          }
        });
      }
    });
    t2.suite("keyword in property value", async (t3) => {
      for (const keyword of keywords) {
        const query = `[prop:${keyword}]`;
        t3.test(query, async (t4) => {
          const file1 = await files2.createFile(`${keyword}.md`, "", new Frontmatter({ properties: { prop: `${keyword}` } }));
          t4.after(() => files2.deleteFile(file1));
          const file2 = await files2.createFile(`${keyword}_value.md`, "", new Frontmatter({ properties: { prop: `${keyword}:value` } }));
          t4.after(() => files2.deleteFile(file2));
          const file3 = await files2.createFile(`prop_${keyword}.md`, "", new Frontmatter({ properties: { [`prop:${keyword}`]: `value` } }));
          t4.after(() => files2.deleteFile(file3));
          const matches = await search2.searchFor(query);
          t4.log("matches:", matches);
          if (!matches.some((it) => it.name === `${keyword}.md`)) {
            t4.failWith("should have matched against file with keyword as the property value");
          }
          if (!matches.some((it) => it.name === `${keyword}_value.md`)) {
            t4.failWith("should have matched against file with keyword IN the property value");
          }
          if (matches.some((it) => it.name === `prop_${keyword}.md`)) {
            t4.failWith("should NOT have matched against file with keyword in property name\n(first colon is treated as the delineation between prop name and value)");
          }
        });
        const query1 = `[prop:${keyword}:value]`;
        t3.test(query1, async (t4) => {
          t4.skip();
          const file1 = await files2.createFile(`${keyword}.md`, "", new Frontmatter({ properties: { prop: `${keyword}` } }));
          t4.after(() => files2.deleteFile(file1));
          const file2 = await files2.createFile(`${keyword}_value.md`, "", new Frontmatter({ properties: { prop: `${keyword}:value` } }));
          t4.after(() => files2.deleteFile(file2));
          const file3 = await files2.createFile(`prop_${keyword}.md`, "", new Frontmatter({ properties: { [`prop:${keyword}`]: `value` } }));
          t4.after(() => files2.deleteFile(file3));
          const matches = await search2.searchFor(query1);
          t4.log("matches:", matches);
          if (!matches.some((it) => it.name === `${keyword}.md`)) {
            t4.failWith(`should have matched against file with just keyword in property value (colon makes search ambiguous)
expected file:`, await files2.readFile(file1));
          }
          if (!matches.some((it) => it.name === `${keyword}_value.md`)) {
            t4.failWith(`should have matched against file with '${keyword}:value' IN the property value`);
          }
          if (matches.some((it) => it.name === `prop_${keyword}.md`)) {
            t4.failWith("should NOT have matched against file with keyword in property name\n(first colon is treated as the delineation between prop name and value)");
          }
        });
      }
    });
  });
}
function trimIndent(str) {
  const lines = str.split("\n");
  const first_index = lines.findIndex((it) => it.length > 0 && it !== "\n");
  if (first_index < 0) {
    return str;
  }
  const first = lines[first_index];
  const whitespace = first.length - first.trimStart().length;
  return lines.slice(first_index).map((it) => it.substring(whitespace)).join("\n");
}
function __vite_glob_0_7(run2, obsidian2, search2) {
  run2.test("tags in body", async (t) => {
    const tagged = await obsidian2.createFile("tagged.md", "#meeting");
    t.after(() => obsidian2.deleteFile(tagged));
    const matches = await search2.searchFor("tag:#meeting");
    if (!matches.some((it) => it.name === "tagged.md")) {
      t.failWith("tagged.md has tag '#meeting' in body, but it was not found in", matches);
    }
  });
  run2.test("prefixed tags in frontmatter", async (t) => {
    const tagged = await obsidian2.createFile("tagged.md", "", new Frontmatter({
      tags: ["#meeting"]
    }));
    t.after(() => obsidian2.deleteFile(tagged));
    const content2 = await obsidian2.readFile(tagged);
    t.log("tagged.md", content2);
    const matches = await search2.searchFor("tag:#meeting");
    if (matches.some((it) => it.name === "tagged.md")) {
      t.failWith("tags of a file do not have hashes at the start, so the following should NOT match", matches);
    }
  });
  run2.test("raw tag in frontmatter", async (t) => {
    const tagged = await obsidian2.createFile("tagged.md", "", new Frontmatter({
      tags: ["meeting"]
    }));
    t.after(() => obsidian2.deleteFile(tagged));
    const matches = await search2.searchFor("tag:#meeting");
    if (!matches.some((it) => it.name === "tagged.md")) {
      t.failWith("tagged.md has tag 'meeting' in frontmatter, but it was not found in", matches);
    }
  });
  run2.test("no hash after tag operator", async (t) => {
    const tagged = await obsidian2.createFile("tagged.md", "", new Frontmatter({ tags: ["meeting"] }));
    t.after(() => obsidian2.deleteFile(tagged));
    const matches = await search2.searchFor("tag:meeting");
    if (!matches.some((it) => it.name === "tagged.md")) {
      t.failWith("tagged.md has tag 'meeting' in frontmatter, but it was not found in", matches);
    }
  });
  run2.test("tag in codeblock", async (t) => {
    const file2 = await obsidian2.createFile("tagged in codeblock.md", trimIndent(`
			\`\`\`
			#meeting
			\`\`\`
		`));
    t.after(() => obsidian2.deleteFile(file2));
    const raw_matches = await search2.searchFor("#meeting");
    const tag_matches = await search2.searchFor("tag:#meeting");
    const no_hash = await search2.searchFor("tag:meeting");
    if (!raw_matches.some((it) => it.name === "tagged in codeblock.md")) {
      t.failWith("raw search for '#meeting' did not find file with '#meeting' in codeblock");
    }
    if (tag_matches.some((it) => it.name === "tagged in codeblock.md")) {
      t.failWith("tag search for '#meeting' incorrectly matched file with '#meeting' in codeblock");
    }
    if (no_hash.some((it) => it.name === "tagged in codeblock.md")) {
      t.failWith("tag search for '#meeting' incorrectly matched file with '#meeting' in codeblock");
    }
  });
  run2.test("grouped tag query", async (t) => {
    const query = "tag:(meeting personal)";
    t.log("query:", query);
    const matches = await search2.searchFor(query);
    t.log("matches:", matches);
    const expected_message = `Operator "tag" can only be followed by text`;
    const logged_error = t.logs.findLast((it) => it.args.some((it2) => it2.includes(expected_message)));
    if (!logged_error) {
      t.failNowWith("expected search to have logged an error");
    }
  });
  run2.test("negated tag subquery", async (t) => {
    const query = "tag:-personal";
    t.log("query:", query);
    const matches = await search2.searchFor(query);
    t.log("matches:", matches);
    const expected_message = `Operator "tag" can only be followed by text`;
    const logged_error = t.logs.findLast((it) => it.args.some((it2) => it2.includes(expected_message)));
    if (!logged_error) {
      t.failNowWith("expected search to have logged an error");
    }
  });
  run2.test("operator in tag subquery", async (t) => {
    const query = "tag:match-case:word";
    t.log("query:", query);
    const matches = await search2.searchFor(query);
    t.log("matches:", matches);
    const expected_message = `Operator "tag" can only be followed by text`;
    const logged_error = t.logs.findLast((it) => it.args.some((it2) => it2.includes(expected_message)));
    if (!logged_error) {
      t.failNowWith("expected search to have logged an error");
    }
  });
  run2.test("phrase as tag subquery", async (t) => {
    const query = `tag:"some phrase"`;
    t.log("query:", query);
    const matches = await search2.searchFor(query);
    t.log("matches:", matches);
    const expected_message = `Operator "tag" can only be followed by text`;
    const logged_error = t.logs.findLast((it) => it.args.some((it2) => it2.includes(expected_message)));
    if (!logged_error) {
      t.failNowWith("expected search to have logged an error");
    }
  });
  run2.test("regex as tag subquery", async (t) => {
    const query = `tag:/some regex/`;
    t.log("query:", query);
    const matches = await search2.searchFor(query);
    t.log("matches:", matches);
    const expected_message = `Operator "tag" can only be followed by text`;
    const logged_error = t.logs.findLast((it) => it.args.some((it2) => it2.includes(expected_message)));
    if (!logged_error) {
      t.failNowWith("expected search to have logged an error");
    }
  });
}
function __vite_glob_0_8(t, files2, search2) {
  t.test("word in body", async (t2) => {
    const file_with_match = await files2.createFile("test.md", "foo");
    t2.after(() => files2.deleteFile(file_with_match));
    const file_without_match = await files2.createFile("test1.md");
    t2.after(() => files2.deleteFile(file_without_match));
    const matches = await search2.searchFor("foo");
    if (!matches.some((match) => match.name === "test.md")) {
      t2.log("expected to find 'test.md' in matches", matches);
      t2.fail();
    }
    if (matches.some((match) => match.name === "test1.md")) {
      t2.log("expected NOT to find 'test1.md' in matches", matches);
      t2.fail();
    }
  });
  t.test("phrase in body", async (t2) => {
    const file_with_match = await files2.createFile("test.md", "foo bar");
    t2.after(() => files2.deleteFile(file_with_match));
    const file_without_match = await files2.createFile("test1.md", "foo");
    t2.after(() => files2.deleteFile(file_without_match));
    const matches = await search2.searchFor(`"foo bar"`);
    if (!matches.some((match) => match.name === "test.md")) {
      t2.failWith("expected to find 'test.md' in", matches);
    }
    if (matches.some((match) => match.name === "test1.md")) {
      t2.failWith("expected NOT to find 'test1.md' in", matches);
    }
  });
  t.test("unclosed phrase", async (t2) => {
    const file_with_match = await files2.createFile("test.md", "foo bar");
    t2.after(() => files2.deleteFile(file_with_match));
    const file_without_match = await files2.createFile("test1.md", "foo");
    t2.after(() => files2.deleteFile(file_without_match));
    const matches = await search2.searchFor(`"foo bar`);
    if (!matches.some((match) => match.name === "test.md")) {
      t2.failWith("expected to find 'test.md' in", matches);
    }
    if (matches.some((match) => match.name === "test1.md")) {
      t2.failWith("expected NOT to find 'test1.md' in", matches);
    }
  });
  t.test("phrase start next to word", async (t2) => {
    const file_without_quotes = await files2.createFile("test.md", `foo bar`);
    t2.after(() => files2.deleteFile(file_without_quotes));
    const file_with_quotes = await files2.createFile("test1.md", `foo"bar"`);
    t2.after(() => files2.deleteFile(file_with_quotes));
    const query = `foo"bar"`;
    t2.log({ query });
    const matches = await search2.searchFor(`foo"bar"`);
    t2.log({ matches });
    t2.log("without space before start of quote, query should be treated like a 'word'");
    if (matches.some((it) => it.name === "test.md")) {
      t2.failWith("should not have found file without exact match to query, but found: ", await files2.readFile(file_without_quotes));
    }
    if (!matches.some((it) => it.name === "test1.md")) {
      t2.failWith("should have found file with exact match to query");
    }
  });
}
function callingLocation() {
  return (new Error().stack ?? "message\ncallingLocation\ncaller\n").split("\n")[3].trimStart();
}
const FAIL_NOW = Symbol();
const SKIP = Symbol();
class Reporter {
  impl;
  vtable;
  constructor({
    impl,
    ...vtable
  }) {
    this.impl = impl;
    this.vtable = vtable;
  }
  testStarted(name, test) {
    this.vtable.testStarted(this, name, test);
  }
  testCompleted(name, test, result) {
    this.vtable.testCompleted(this, name, test, result);
  }
}
class Writer {
  impl;
  data = "";
  write_fn;
  constructor(def) {
    this.impl = def.impl;
    this.write_fn = def.write;
  }
  write(data) {
    this.data += data;
  }
  flush() {
    const data = this.data;
    this.data = "";
    this.write_fn(this, data);
  }
}
class StartStopReporter {
  static indent = "    ";
  output;
  constructor(def) {
    this.output = def.output;
  }
  ancestors = [];
  current = null;
  static #SummaryReporterVTable = Object.freeze({
    reportTestStarted: (reporter, name, _test) => {
      return reporter.impl.reportTestStarted(name);
    },
    reportTestCompleted: (reporter, name, test, result) => {
      return reporter.impl.reportTestCompleted(name, test, result);
    }
  });
  reportTestStarted(name) {
    if (this.current !== null) {
      this.ancestors.push(this.current);
    }
    this.current = { name, written: false };
  }
  reportTestCompleted(name, test, result) {
    if (result.status === 2 && this.ancestors.length > 0) {
      this.current = this.ancestors.pop() ?? null;
      return;
    }
    this.ancestors.forEach((ancestor, index) => {
      if (ancestor.written) return;
      this.output.write(StartStopReporter.indent.repeat(index));
      let prefix2 = "TEST";
      if (result.status === 3) {
        prefix2 = "\x1B[31mFAIL\x1B[39m";
      }
      this.output.write(`${prefix2} ${ancestor.name}
`);
      ancestor.written = true;
    });
    const indent = StartStopReporter.indent.repeat(this.ancestors.length);
    this.current = this.ancestors.pop() ?? null;
    let prefix = "";
    switch (result.status) {
      case 3: {
        prefix = "\x1B[31mFAIL\x1B[39m";
        break;
      }
      case 2: {
        prefix = "\x1B[32mPASS\x1B[39m";
        break;
      }
      case 1: {
        prefix = "\x1B[33mSKIP\x1B[39m";
        break;
      }
      default:
        throw new Error("reported test completed, but status is " + Status[result.status]);
    }
    this.output.write(`${indent}${prefix} ${name}
`);
    if (this.current) {
      this.current.written = true;
    }
    if (result.status === 3) {
      const log_indent = indent + StartStopReporter.indent;
      test.logs.forEach(({ location, args }) => {
        this.output.write(`${log_indent}${location}: `);
        args.forEach((arg) => {
          const lines = arg.split("\n");
          this.output.write(lines[0] + "\n");
          lines.slice(1).forEach((line) => this.output.write(log_indent + line + "\n"));
        });
      });
    }
    this.output.flush();
  }
  reporter() {
    return new Reporter({
      impl: this,
      testStarted: StartStopReporter.#SummaryReporterVTable.reportTestStarted,
      testCompleted: StartStopReporter.#SummaryReporterVTable.reportTestCompleted
    });
  }
}
class ScheduledTest {
  name;
  fn;
  constructor({ name, fn }) {
    this.name = name;
    this.fn = fn;
  }
}
function stringifyArgs(args) {
  return args.map((arg) => {
    if (typeof arg === "string") {
      return arg;
    }
    return util__namespace.inspect(arg);
  });
}
class Test {
  status = 0;
  logs = [];
  cleanup_fns = [];
  reporter;
  constructor({
    reporter
  }) {
    this.reporter = reporter;
  }
  children = [];
  run(name, fn) {
    this.children.push(new ScheduledTest({ name, fn }));
  }
  test(name, fn) {
    this.run(name, fn);
  }
  suite(name, fn) {
    this.run(name, fn);
  }
  skip() {
    if (this.status >= 1) {
      throw new Error("cannot skip a test that has already finished.  Did you call 'skip' in an 'after' call?");
    }
    this.status = 1;
    throw SKIP;
  }
  fail() {
    this.status = 3;
  }
  failNow() {
    this.fail();
    throw FAIL_NOW;
  }
  failWith(...args) {
    this.logs.push({ location: callingLocation(), args: stringifyArgs(args) });
    this.fail();
  }
  failNowWith(...args) {
    this.logs.push({ location: callingLocation(), args: stringifyArgs(args) });
    this.failNow();
  }
  log(...args) {
    this.logs.push({ location: callingLocation(), args: stringifyArgs(args) });
  }
  after(fn) {
    this.cleanup_fns.push(fn);
  }
}
class Result {
  status;
  children;
  constructor({
    status,
    children
  }) {
    this.status = status;
    this.children = children ?? [];
  }
  #summary = null;
  childrenSummary() {
    if (this.children.length === 0) return null;
    if (this.#summary !== null) return this.#summary;
    this.#summary = { skipped: 0, passed: 0, failed: 0 };
    for (const child of this.children) {
      const child_summary = child.childrenSummary();
      if (child_summary === null) {
        switch (child.status) {
          case 1: {
            this.#summary.skipped += 1;
            break;
          }
          case 2: {
            this.#summary.passed += 1;
            break;
          }
          case 3: {
            this.#summary.failed += 1;
            break;
          }
        }
      } else {
        this.#summary.skipped += child_summary.skipped ?? 0;
        this.#summary.passed += child_summary.passed ?? 0;
        this.#summary.failed += child_summary.failed ?? 0;
      }
    }
    return this.#summary;
  }
}
class Runner {
  reporter;
  constructor({
    reporter
  }) {
    this.reporter = reporter ?? new Reporter({
      impl: null,
      testStarted: () => {
      },
      testCompleted: () => {
      }
    });
  }
  async run(fn) {
    return runTest(new Test({ reporter: this.reporter }), fn);
  }
}
async function runTests$1(reporter, scheduled) {
  const results = [];
  for (const task of scheduled) {
    results.push(await run(reporter, task.name, task.fn));
  }
  return results;
}
async function run(reporter, name, fn) {
  const test = new Test({ reporter });
  reporter.testStarted(name, test);
  const result = await runTest(test, fn);
  reporter.testCompleted(name, test, result);
  return result;
}
async function runTest(test, fn) {
  const log = console.log;
  console.log = (...args) => test.log(...args);
  try {
    await fn(test);
  } catch (e) {
    if (e !== SKIP && e !== FAIL_NOW) {
      test.logs.push({ location: "", args: stringifyArgs([e]) });
      test.status = 3;
    }
  } finally {
    console.log = log;
  }
  if (test.status !== 3 && test.status !== 1) {
    test.status = 2;
  }
  const result = new Result({
    status: test.status,
    children: await runTests$1(test.reporter, test.children)
  });
  if (result.children.some(
    (it) => it.status === 3
    /* Failed */
  )) {
    result.status = test.status = 3;
  }
  for (const cleanup of test.cleanup_fns) {
    try {
      await cleanup(test);
    } catch (e) {
      if (e !== SKIP && e !== FAIL_NOW) {
        test.logs.push({ location: "AFTER", args: stringifyArgs([e]) });
      }
    }
  }
  return result;
}
var Status = /* @__PURE__ */ ((Status2) => {
  Status2[Status2["Running"] = 0] = "Running";
  Status2[Status2["Skipped"] = 1] = "Skipped";
  Status2[Status2["Passed"] = 2] = "Passed";
  Status2[Status2["Failed"] = 3] = "Failed";
  return Status2;
})(Status || {});
const all_tests = /* @__PURE__ */ Object.assign({ "/test/contract/tests/and.ts": testAnd, "/test/contract/tests/colon.ts": testFileOperator$2, "/test/contract/tests/file.ts": testFileOperator$1, "/test/contract/tests/negation.ts": testNegation, "/test/contract/tests/or.ts": testOr, "/test/contract/tests/path.ts": testFileOperator, "/test/contract/tests/property.ts": testProperty, "/test/contract/tests/tags.ts": __vite_glob_0_7, "/test/contract/tests/words.ts": __vite_glob_0_8 });
async function runTests(runner, files2, search2) {
  const result = await runner.run((t) => {
    for (const [filename, fn] of Object.entries(all_tests)) {
      t.test(filename.slice(1), (t2) => fn(t2, files2, search2));
    }
  });
  return result.status === Status.Passed;
}
class SocketReporterPlugin extends obsidian__namespace.Plugin {
  socket;
  constructor(app, manifest) {
    super(app, manifest);
    try {
      this.socket = net__namespace.createConnection({ port: 36881 });
    } catch (e) {
      this.socket = {
        // @ts-ignore
        write: console.log
      };
      new obsidian__namespace.Notice("Failed to create socket connection\n" + util.inspect(e));
      throw e;
    }
  }
}
async function createFile(app, path2, body = "", frontmatter) {
  if (frontmatter) {
    let prefix = "---\n";
    if (frontmatter.tags.length > 0) {
      prefix += "tags:\n";
      frontmatter.tags.forEach((tag2) => prefix += "  - " + tag2 + "\n");
    }
    if (frontmatter.aliases.length > 0) {
      prefix += "aliases:\n";
      frontmatter.aliases.forEach((alias) => prefix += `  - ${alias}
`);
    }
    if (frontmatter.cssclasses.length > 0) {
      prefix += "cssclasses:\n";
      frontmatter.cssclasses.forEach((cssclass) => prefix += `  - ${cssclass}
`);
    }
    if (Object.keys(frontmatter.properties).length > 0) {
      for (const [prop, value] of Object.entries(frontmatter.properties)) {
        prefix += `${prop}: ${value}
`;
      }
    }
    prefix += "---\n";
    body = prefix + body;
  }
  const path_parts = path2.split("/");
  if (path_parts.length > 1) {
    const folder_path = paths__namespace.join(...path_parts.slice(0, -1));
    if (!app.vault.getFolderByPath(folder_path)) {
      try {
        await app.vault.createFolder(folder_path);
      } catch (e) {
        const err = new Error("Failed to create folder: " + folder_path);
        err.cause = e;
        throw err;
      }
    }
  }
  let file2;
  try {
    file2 = await app.vault.create(path2, body);
  } catch (e) {
    throw new Error(`Failed to create file at "${path2}"`, { cause: e });
  }
  if (app.metadataCache.getCache(path2) == null) {
    return new Promise((resolve) => {
      const ref = app.metadataCache.on("resolved", () => {
        if (app.metadataCache.getCache(path2) != null) {
          app.metadataCache.offref(ref);
          resolve(file2);
        }
      });
    });
  }
  return file2;
}
function files(app) {
  return new Files({
    impl: app,
    createFile(path2, body, frontmatter) {
      return createFile(this.impl, path2, body, frontmatter);
    },
    async deleteFile(file2) {
      await this.impl.vault.delete(file2, true);
      const path_parts = file2.name.split("/");
      if (path_parts.length > 1) {
        const folder_path = paths__namespace.join(...path_parts.slice(0, -1));
        const folder = this.impl.vault.getFolderByPath(folder_path);
        if (!folder) return;
        if (!folder.children.length) {
          await this.impl.vault.delete(folder, true);
        } else {
          console.log("folder ", folder.path, "still has children", folder.children.length);
        }
      }
    },
    async readFile(file2) {
      return this.impl.vault.cachedRead(file2);
    }
  });
}
const PASSED_SIGNAL = "<<PASSED>>";
const FAILED_SIGNAL = "<<FAILED>>";
function sendResultSignal(socket, passed) {
  socket.write(passed ? PASSED_SIGNAL : FAILED_SIGNAL, () => socket.end());
}
class Search {
  constructor(impl, searchFor) {
    this.impl = impl;
    this.searchFor = searchFor;
  }
}
class AndFilter {
  filters;
  constructor(def) {
    this.filters = def.filters;
  }
  appliesTo(check) {
    for (const filter2 of this.filters) {
      if (!filter2.appliesTo(check)) return false;
    }
    return true;
  }
  static #filterApplies = (filter2, check) => {
    return filter2.impl.appliesTo(check);
  };
  filter() {
    return new Filter({
      impl: this,
      appliesFn: AndFilter.#filterApplies
    });
  }
}
function all(first_filter, ...filters) {
  if (filters.length === 0) return first_filter;
  return new AndFilter({ filters: [first_filter, ...filters] }).filter();
}
class AsyncAndFilter {
  filters;
  constructor(def) {
    this.filters = def.filters;
  }
  async appliesTo(check) {
    const all2 = await Promise.all(
      this.filters.map((it) => it.appliesTo(check))
    );
    return all2.every((it) => it);
  }
  static #filterApplies = (filter2, check) => {
    return filter2.impl.appliesTo(check);
  };
  filter() {
    return new AsyncFilter({
      impl: this,
      appliesFn: AsyncAndFilter.#filterApplies
    });
  }
}
function allAsync(first_filter, ...filters) {
  if (filters.length === 0) return first_filter;
  return new AsyncAndFilter({ filters: [first_filter, ...filters] }).filter();
}
class OrFilter {
  filters;
  constructor(def) {
    this.filters = def.filters;
  }
  appliesTo(check) {
    for (const filter2 of this.filters) {
      if (filter2.appliesTo(check)) return true;
    }
    return false;
  }
  static #filterApplies = (filter2, check) => {
    return filter2.impl.appliesTo(check);
  };
  filter() {
    return new Filter({
      impl: this,
      appliesFn: OrFilter.#filterApplies
    });
  }
}
function any(first_filter, ...filters) {
  if (filters.length === 0) return first_filter;
  if (first_filter.impl instanceof OrFilter) {
    return new OrFilter({ filters: [...first_filter.impl.filters, ...filters] }).filter();
  }
  return new OrFilter({ filters: [first_filter, ...filters] }).filter();
}
function anyAsync(first_filter, ...filters) {
  if (filters.length === 0) return first_filter;
  if (first_filter.impl instanceof AsyncOrFilter) {
    return new AsyncOrFilter({ filters: [...first_filter.impl.filters, ...filters] }).filter();
  }
  return new AsyncOrFilter({ filters: [first_filter, ...filters] }).filter();
}
class AsyncOrFilter {
  filters;
  constructor(def) {
    this.filters = def.filters;
  }
  async appliesTo(check) {
    const all2 = await Promise.all(
      this.filters.map((it) => it.appliesTo(check))
    );
    return all2.some((it) => it);
  }
  static #filterApplies = (filter2, check) => {
    return filter2.impl.appliesTo(check);
  };
  filter() {
    return new AsyncFilter({
      impl: this,
      appliesFn: AsyncOrFilter.#filterApplies
    });
  }
}
function negate$1(filter2) {
  if (filter2.impl instanceof Negation) {
    return filter2.impl.negated;
  }
  return new Negation({ filter: filter2 }).filter();
}
function negateAsync(filter2) {
  if (filter2.impl instanceof AsyncNegation) {
    return filter2.impl.negated;
  }
  return new AsyncNegation({ filter: filter2 }).filter();
}
class Negation {
  negated;
  constructor(def) {
    this.negated = def.filter;
  }
  static #filterApplies(filter2, check) {
    return !filter2.impl.negated.appliesTo(check);
  }
  filter() {
    return new Filter({
      impl: this,
      appliesFn: Negation.#filterApplies
    });
  }
}
class AsyncNegation {
  negated;
  constructor(def) {
    this.negated = def.filter;
  }
  static async #filterApplies(filter2, check) {
    return !await filter2.impl.negated.appliesTo(check);
  }
  filter() {
    return new AsyncFilter({
      impl: this,
      appliesFn: AsyncNegation.#filterApplies
    });
  }
}
class Filter {
  impl;
  appliesFn;
  constructor(def) {
    this.impl = def.impl;
    this.appliesFn = def.appliesFn;
  }
  appliesTo(check) {
    return this.appliesFn(this, check);
  }
  and(other) {
    return all(this, other);
  }
  or(other) {
    if (other.impl instanceof OrFilter) {
      return any(this, ...other.impl.filters);
    }
    return any(this, other);
  }
  negated() {
    return negate$1(this);
  }
  static #asyncApplies = async (filter2, check) => {
    return filter2.impl.appliesTo(check);
  };
  async() {
    return new AsyncFilter({
      impl: this,
      appliesFn: Filter.#asyncApplies
    });
  }
}
class AsyncFilter {
  impl;
  appliesFn;
  constructor(def) {
    this.impl = def.impl;
    this.appliesFn = def.appliesFn;
  }
  appliesTo(check) {
    return this.appliesFn(this, check);
  }
  and(other) {
    return allAsync(this, other);
  }
  or(other) {
    if (other.impl instanceof AsyncOrFilter) {
      return anyAsync(this, ...other.impl.filters);
    }
    return anyAsync(this, other);
  }
  negated() {
    return negateAsync(this);
  }
}
function content(matcher) {
  return new ContentFilter({ matcher }).filter();
}
class ContentFilter {
  matcher;
  constructor(def) {
    this.matcher = def.matcher;
  }
  static #filterApplies = (filter2, check) => {
    return filter2.impl.appliesTo(check);
  };
  filter() {
    return new AsyncFilter({
      impl: this,
      appliesFn: ContentFilter.#filterApplies
    });
  }
  async appliesTo(file2) {
    return this.matcher.matches(await file2.vault.cachedRead(file2));
  }
}
function file(checker) {
  return new NameFilter({ matcher: checker }).filter();
}
class NameFilter {
  matcher;
  constructor(def) {
    this.matcher = def.matcher;
  }
  static #filterApplies = (filter2, file2) => {
    return filter2.impl.appliesTo(file2);
  };
  filter() {
    return new Filter({
      impl: this,
      appliesFn: NameFilter.#filterApplies
    });
  }
  appliesTo(file2) {
    return this.matcher.matches(file2.basename);
  }
}
function path(matcher) {
  return new PathFilter({ matcher }).filter();
}
class PathFilter {
  matcher;
  constructor(def) {
    this.matcher = def.matcher;
  }
  appliesTo(file2) {
    return this.matcher.matches(file2.path);
  }
  static #filterApplies = async (filter2, file2) => {
    return filter2.impl.appliesTo(file2);
  };
  filter() {
    return new Filter({
      impl: this,
      appliesFn: PathFilter.#filterApplies
    });
  }
}
class PropertyNameFilter {
  matcher;
  constructor(def) {
    this.matcher = def.matcher;
  }
  static #filterApplies = (filter2, frontmatter) => {
    return filter2.impl.appliesTo(frontmatter);
  };
  appliesTo(frontmatter) {
    for (const key of Object.keys(frontmatter)) {
      if (this.matcher.matches(key)) return true;
    }
    return false;
  }
  filter() {
    return new Filter({
      impl: this,
      appliesFn: PropertyNameFilter.#filterApplies
    });
  }
}
function propertyName(matcher) {
  return new PropertyNameFilter({ matcher }).filter();
}
function property(prop_matcher, metadataCache) {
  return new PropertyFilter({ property: prop_matcher, value: null, metadataCache }).fileFilter();
}
class PropertyFilter {
  name;
  value;
  matadataCache;
  constructor(def) {
    this.name = def.property;
    this.value = def.value;
    this.matadataCache = def.metadataCache;
  }
  static #filterApplies = (filter2, file2) => {
    return filter2.impl.appliesTo(file2);
  };
  appliesTo(file2) {
    const metadata = this.matadataCache.getFileCache(file2) ?? {};
    const frontmatter = metadata.frontmatter;
    if (!frontmatter) return false;
    return this.name.appliesTo(frontmatter);
  }
  fileFilter() {
    return new Filter({
      impl: this,
      appliesFn: PropertyFilter.#filterApplies
    });
  }
}
function tag(matcher, metadataCache) {
  return new TagFilter({ matcher, metadataCache }).filter();
}
class TagFilter {
  matcher;
  metadataCache;
  constructor(def) {
    this.matcher = def.matcher;
    this.metadataCache = def.metadataCache;
  }
  appliesTo(file2) {
    const metadata = this.metadataCache.getFileCache(file2);
    if (!metadata) return false;
    {
      const frontmatter = metadata.frontmatter ?? {};
      const tags2 = frontmatter.tags;
      if (Array.isArray(tags2)) {
        if (tags2.some((it) => typeof it === "string" && this.matcher.matches(it))) {
          return true;
        }
      }
    }
    const tags = metadata.tags;
    if (!tags) return false;
    return tags.some((it) => this.matcher.matches(it.tag));
  }
  static #filterApplies = async (filter2, file2) => {
    return filter2.impl.appliesTo(file2);
  };
  filter() {
    return new Filter({
      impl: this,
      appliesFn: TagFilter.#filterApplies
    });
  }
}
class StringMatcher {
  impl;
  matchesFn;
  constructor({ impl, matchesFn }) {
    this.impl = impl;
    this.matchesFn = matchesFn;
  }
  matches(string) {
    return this.matchesFn(this, string);
  }
}
class BasicStringMatcher {
  string;
  constructor({ string }) {
    this.string = string;
  }
  static #matchString = (matcher, string) => {
    return matcher.impl.matchesString(string);
  };
  matchesString(string) {
    return string.includes(this.string);
  }
  stringMatcher() {
    return new StringMatcher({
      impl: this,
      matchesFn: BasicStringMatcher.#matchString
    });
  }
}
function basic(string) {
  return new BasicStringMatcher({ string }).stringMatcher();
}
class RegexMatcher {
  regex;
  constructor({ regex: regex2 }) {
    this.regex = regex2;
  }
  static #matchString = (matcher, string) => {
    return matcher.impl.matchesString(string);
  };
  matchesString(string) {
    return this.regex.test(string);
  }
  stringMatcher() {
    return new StringMatcher({
      impl: this,
      matchesFn: RegexMatcher.#matchString
    });
  }
}
function regex(regex2) {
  return new RegexMatcher({ regex: regex2 }).stringMatcher();
}
class NegatedStringMatcher {
  matcher;
  constructor({ matcher }) {
    this.matcher = matcher;
  }
  static #matchString = (matcher, string) => {
    return matcher.impl.matchesString(string);
  };
  matchesString(string) {
    return !this.matcher.matches(string);
  }
  stringMatcher() {
    return new StringMatcher({
      impl: this,
      matchesFn: NegatedStringMatcher.#matchString
    });
  }
}
function negate(matcher) {
  return new NegatedStringMatcher({ matcher }).stringMatcher();
}
class Parser {
  metadataCache;
  constructor(def) {
    this.metadataCache = def.metadataCache;
  }
  filterFromQuery(query, logger) {
    const found_tokens = tokenizeQuery(query, logger);
    logger?.log({ found_tokens });
    return this.parseTokens(found_tokens, logger);
  }
  parseTokens(tokens, logger) {
    let is_async = false;
    const found_filters = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      logger?.log("parseTokens", { token, i });
      if (token.kind === 3 && token.symbol === Symbols.Type.RParen) {
        const { filter: filter22, end: end2 } = this.parseGroup(tokens, i + 1, logger);
        found_filters.push(filter22);
        i = end2;
        continue;
      }
      if (token.kind === 2 && token.word === "OR") {
        if (found_filters.length > 0) {
          const a = found_filters.pop();
          const { filter: b, end: end2 } = this.parseFilter(tokens, i + 1, logger);
          if (b instanceof AsyncFilter) {
            is_async = true;
            const async_a = a instanceof AsyncFilter ? a : a.async();
            found_filters.push(anyAsync(async_a, b));
          } else if (a instanceof AsyncFilter) {
            found_filters.push(anyAsync(a, b.async()));
          } else {
            found_filters.push(any(a, b));
          }
          i = end2;
          continue;
        } else {
          throw new Error("unexpected keyword OR");
        }
      }
      if (token.kind === 3 && token.symbol === Symbols.Type.Negate) {
        const { filter: filter22, end: end2 } = this.parseFilter(tokens, i + 1, logger);
        if (filter22 instanceof AsyncFilter) {
          is_async = true;
          found_filters.push(filter22.negated());
        } else {
          found_filters.push(filter22.negated());
        }
        i = end2;
        continue;
      }
      const { filter: filter2, end } = this.parseFilter(tokens, i, logger);
      if (filter2 instanceof AsyncFilter) {
        is_async = true;
      }
      found_filters.push(filter2);
      i = end;
    }
    if (is_async) {
      const async_filters = found_filters.map((it) => it instanceof AsyncFilter ? it : it.async());
      return allAsync(async_filters[0], ...async_filters.slice(1));
    }
    return all(found_filters[0], ...found_filters.slice(1));
  }
  parseFilter(tokens, start, logger) {
    const token = tokens[start];
    logger?.log("parseFilter", { token, start });
    switch (token.kind) {
      case 0:
        return { filter: content(basic(token.phrase)), end: start };
      case 1:
        return { filter: content(regex(token.regex)), end: start };
      case 2: {
        if (token.word === "OR") {
          throw new Error("unexpected keyword OR");
        }
        return { filter: content(basic(token.word)), end: start };
      }
      case 3: {
        switch (token.symbol) {
          case Symbols.Type.LParen:
            return this.parseGroup(tokens, start + 1, logger);
          case Symbols.Type.LBracket:
            return this.parseProperty(tokens, start + 1, logger);
          case Symbols.Type.Negate: {
            const { filter: filter2, end } = this.parseFilter(tokens, start + 1, logger);
            return { filter: filter2.negated(), end };
          }
          default:
            throw new Error(`Unexpected symbol ${Symbols.Type[token.symbol]}`);
        }
      }
      case 4: {
        const next_token = tokens[start + 1];
        if (next_token.kind !== 3 || next_token.symbol !== Symbols.Type.Colon) {
          throw new Error("expected colon to follow keyword");
        }
        switch (token.keyword) {
          case Keyword.Kind.File: {
            const { matcher, end } = this.parseFileKeyword(tokens, start + 2, logger);
            return { filter: file(matcher), end };
          }
          case Keyword.Kind.Path: {
            const { matcher, end } = this.parsePathKeyword(tokens, start + 2, logger);
            return { filter: path(matcher), end };
          }
          case Keyword.Kind.Tag: {
            const { matcher, end } = this.parseTagKeyword(tokens, start + 2, logger);
            return { filter: tag(matcher, this.metadataCache), end };
          }
        }
      }
      default: {
        throw new Error("unexpected token " + TokenType[
          // @ts-ignore
          token.kind
        ]);
      }
    }
  }
  parseFileKeyword(tokens, start, logger) {
    const token = tokens[start];
    switch (token.kind) {
      case 2: {
        return { matcher: basic(token.word), end: start };
      }
      case 3: {
        switch (token.symbol) {
          case Symbols.Type.Negate: {
            const { matcher: negated, end } = this.parseFileKeyword(tokens, start + 1, logger);
            return { matcher: negate(negated), end };
          }
          case Symbols.Type.LParen: {
            return this.parseGroupedFileSubquery(tokens, start + 1, logger);
          }
          default:
            throw new Error(`Unexpected symbol ${Symbols.Type[token.symbol]}`);
        }
      }
      case 4: {
        switch (token.keyword) {
          case Keyword.Kind.File: {
            throw new Error(`Operator "file" cannot be nested within "file"`);
          }
        }
      }
      default: {
        throw new Error("unsupported token for file keyword: " + TokenType[token.kind]);
      }
    }
  }
  parsePathKeyword(tokens, start, logger) {
    const token = tokens[start];
    switch (token.kind) {
      case 2: {
        return { matcher: basic(token.word), end: start };
      }
      case 3: {
        switch (token.symbol) {
          case Symbols.Type.Negate: {
            const { matcher: negated, end } = this.parsePathKeyword(tokens, start + 1, logger);
            return { matcher: negate(negated), end };
          }
          case Symbols.Type.LParen: {
            return this.parseGroupedFileSubquery(tokens, start + 1, logger);
          }
          default:
            throw new Error(`Unexpected symbol ${Symbols.Type[token.symbol]}`);
        }
      }
      case 4: {
        switch (token.keyword) {
          case Keyword.Kind.File: {
            throw new Error(`Operator "file" cannot be nested within "path"`);
          }
          case Keyword.Kind.Path: {
            throw new Error(`Operator "path" cannot be nested within "path"`);
          }
        }
      }
      default: {
        throw new Error("unsupported token for file keyword: " + TokenType[token.kind]);
      }
    }
  }
  parseTagKeyword(tokens, start, logger) {
    const token = tokens[start];
    switch (token.kind) {
      case 2: {
        let word = token.word;
        if (word.startsWith("#")) {
          word = word.slice(1);
        }
        return { matcher: basic(word), end: start };
      }
      default: {
        throw new Error(`Operator "tag" can only be followed by text`);
      }
    }
  }
  parseProperty(tokens, start, logger) {
    const { filter: prop_name, end } = this.parsePropertyName(tokens, start, logger);
    logger?.log("parseProperty", { prop_name });
    return { filter: property(prop_name, this.metadataCache), end };
  }
  parsePropertyName(tokens, start, logger) {
    let buffer = "";
    let i = start;
    const negated = tokens[start]?.kind === 3 && tokens[start].symbol === Symbols.Type.Negate;
    if (negated) i++;
    loop: for (; i < tokens.length; i++) {
      const token = tokens[i];
      switch (token.kind) {
        case 0: {
          if (buffer.length > 0) buffer += " ";
          buffer += '"' + token.phrase + '"';
          continue loop;
        }
        case 1: {
          if (buffer.length > 0) buffer += " ";
          buffer += "/" + token.regex + "/";
          continue loop;
        }
        case 2: {
          if (token.word === "OR" && buffer.length > 0) {
            const { filter: next_filter, end } = this.parsePropertyName(tokens, i + 1, logger);
            let first_filter = propertyName(basic(buffer));
            if (negated) {
              first_filter = first_filter.negated();
            }
            return { filter: first_filter.or(next_filter), end };
          }
          if (buffer.length > 0) {
            switch (tokens[i - 1].kind) {
              case 0:
              case 1:
              case 2:
                buffer += " ";
            }
          }
          buffer += token.word;
          continue loop;
        }
        case 3: {
          if (token.symbol === Symbols.Type.RBracket) break loop;
          if (token.symbol === Symbols.Type.Colon) break loop;
          if (token.symbol === Symbols.Type.Negate) {
            const { end } = this.parsePropertyName(tokens, i, logger);
            i = end;
            break loop;
          }
          buffer += token.raw;
          continue loop;
        }
        case 4: {
          if (buffer.length > 0) buffer += " ";
          buffer += token.raw + ":";
          continue loop;
        }
      }
    }
    let filter2 = propertyName(basic(buffer));
    if (negated) {
      filter2 = filter2.negated();
    }
    return { filter: filter2, end: i };
  }
  parseGroupedFileSubquery(tokens, start, logger) {
    let buffer = "";
    for (let i = start; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.kind === 3 && token.symbol === Symbols.Type.RParen) {
        break;
      }
      if (buffer.length > 0) {
        buffer += " ";
      }
      buffer += token.raw;
    }
    return { matcher: basic("(" + buffer + ")"), end: tokens.length };
  }
  parseGroup(tokens, start, logger) {
    let is_async = false;
    const found_filters = [];
    let i = start;
    for (; i < tokens.length; i++) {
      const token = tokens[i];
      logger?.log("parseGroup", { token, i });
      if (token.kind === 3 && token.symbol === Symbols.Type.RParen) {
        i += 1;
        break;
      }
      const { filter: filter2, end } = this.parseFilter(tokens, i, logger);
      if (filter2 instanceof AsyncFilter) {
        is_async = true;
      }
      found_filters.push(filter2);
      i = end;
    }
    if (is_async) {
      const async_filters = found_filters.map((it) => it instanceof AsyncFilter ? it : it.async());
      return {
        filter: allAsync(
          async_filters[0],
          ...async_filters.slice(1)
        ),
        end: i
      };
    }
    return {
      filter: all(
        found_filters[0],
        ...found_filters.slice(1)
      ),
      end: i
    };
  }
}
function tokenizeQuery(query, logger) {
  query = query.trim();
  const found_tokens = [];
  let buf_start = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    logger?.log({ char, i, buf_start });
    if (char === "-") {
      found_tokens.push(Symbols.Negate);
      buf_start += 1;
      continue;
    }
    if (char === "(") {
      found_tokens.push(Symbols.LParen);
      buf_start += 1;
      continue;
    }
    if (char === ")") {
      if (buf_start < i) {
        found_tokens.push(new Word({ word: query.slice(buf_start, i) }));
      }
      found_tokens.push(Symbols.RParen);
      buf_start = i + 1;
      continue;
    }
    if (char === "/") {
      const { regex: regex2, end } = tokenizeRegex(query, i + 1);
      logger?.log({ regex: regex2 });
      found_tokens.push(new RegexToken({ regex: regex2 }));
      buf_start = end + 1;
      i = end;
      continue;
    }
    if (char === '"' && buf_start === i) {
      const { quote, end } = consumeQuote(query, i + 1);
      logger?.log({ quote });
      found_tokens.push(new Phrase({ phrase: quote }));
      buf_start = end + 1;
      i = end;
      continue;
    }
    if (char === "[") {
      found_tokens.push(Symbols.LBracket);
      buf_start = i + 1;
      continue;
    }
    if (char === "]") {
      if (buf_start < i) {
        found_tokens.push(new Word({ word: query.slice(buf_start, i) }));
      }
      found_tokens.push(Symbols.RBracket);
      buf_start = i + 1;
      continue;
    }
    if (char === ":") {
      const word = query.slice(buf_start, i);
      switch (word) {
        case "file": {
          found_tokens.push(Keyword.File);
          break;
        }
        case "path": {
          found_tokens.push(Keyword.Path);
          break;
        }
        case "tag": {
          found_tokens.push(Keyword.Tag);
          break;
        }
        default:
          found_tokens.push(new Word({ word }));
      }
      found_tokens.push(Symbols.Colon);
      buf_start = i + 1;
      continue;
    }
    if (char === " ") {
      found_tokens.push(new Word({ word: query.slice(buf_start, i) }));
      buf_start = i + 1;
      continue;
    }
  }
  if (buf_start < query.length) {
    found_tokens.push(new Word({ word: query.slice(buf_start) }));
  }
  return found_tokens;
}
function consumeQuote(query, start) {
  const buffer = [];
  let escaped = false;
  let i = start;
  for (i; i < query.length; i++) {
    const char = query[i];
    if (escaped) {
      escaped = false;
      buffer.push(char);
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      i++;
      break;
    }
    buffer.push(char);
  }
  return { quote: buffer.join(""), end: i };
}
function tokenizeRegex(query, start) {
  const buffer = [];
  let i = start;
  for (i; i < query.length; i++) {
    const char = query[i];
    if (char === "/") {
      if (buffer.length > 0 && buffer[buffer.length - 1] === "\\") {
        buffer.push(char);
        continue;
      }
      i++;
      break;
    }
    buffer.push(char);
  }
  return { regex: new RegExp(buffer.join("")), end: i };
}
var TokenType = /* @__PURE__ */ ((TokenType2) => {
  TokenType2[TokenType2["Phrase"] = 0] = "Phrase";
  TokenType2[TokenType2["Regex"] = 1] = "Regex";
  TokenType2[TokenType2["Word"] = 2] = "Word";
  TokenType2[TokenType2["Symbol"] = 3] = "Symbol";
  TokenType2[TokenType2["Keyword"] = 4] = "Keyword";
  return TokenType2;
})(TokenType || {});
var Keyword;
((Keyword2) => {
  ((Kind2) => {
    Kind2[Kind2["File"] = 0] = "File";
    Kind2[Kind2["Path"] = 1] = "Path";
    Kind2[Kind2["Tag"] = 2] = "Tag";
  })(Keyword2.Kind || (Keyword2.Kind = {}));
  Keyword2.File = Object.freeze({ kind: 4, keyword: 0, raw: "file" });
  Keyword2.Path = Object.freeze({ kind: 4, keyword: 1, raw: "path" });
  Keyword2.Tag = Object.freeze({ kind: 4, keyword: 2, raw: "tag" });
})(Keyword || (Keyword = {}));
var Symbols;
((Symbols2) => {
  ((Type2) => {
    Type2[Type2["Negate"] = 0] = "Negate";
    Type2[Type2["LParen"] = 1] = "LParen";
    Type2[Type2["RParen"] = 2] = "RParen";
    Type2[Type2["LBracket"] = 3] = "LBracket";
    Type2[Type2["RBracket"] = 4] = "RBracket";
    Type2[Type2["Colon"] = 5] = "Colon";
  })(Symbols2.Type || (Symbols2.Type = {}));
  Symbols2.Negate = Object.freeze({ kind: 3, symbol: 0, raw: "-" });
  Symbols2.Colon = Object.freeze({ kind: 3, symbol: 5, raw: ":" });
  Symbols2.LParen = Object.freeze({ kind: 3, symbol: 1, raw: "(" });
  Symbols2.RParen = Object.freeze({ kind: 3, symbol: 2, raw: ")" });
  Symbols2.LBracket = Object.freeze({ kind: 3, symbol: 3, raw: "[" });
  Symbols2.RBracket = Object.freeze({ kind: 3, symbol: 4, raw: "]" });
})(Symbols || (Symbols = {}));
class Phrase {
  get kind() {
    return 0;
  }
  phrase;
  get raw() {
    return this.phrase;
  }
  constructor(def) {
    this.phrase = def.phrase;
  }
}
class RegexToken {
  get kind() {
    return 1;
  }
  regex;
  get raw() {
    return this.regex.source;
  }
  constructor(def) {
    this.regex = def.regex;
  }
}
class Word {
  get kind() {
    return 2;
  }
  word;
  get raw() {
    return this.word;
  }
  constructor(def) {
    this.word = def.word;
  }
}
function search(query, app) {
  const allFiles = app.vault.getMarkdownFiles();
  return filter(query, app.metadataCache, allFiles);
}
async function* filter(query, metadata_cache, files2) {
  let parsed_filter;
  try {
    parsed_filter = parse(query, metadata_cache);
  } catch (e) {
    console.log(e);
    return [];
  }
  for (const file2 of files2) {
    if (await parsed_filter.appliesTo(file2)) {
      yield file2;
    }
  }
}
function parse(query, metadata) {
  return new Parser({ metadataCache: metadata }).filterFromQuery(query);
}
class Compliance extends SocketReporterPlugin {
  onload() {
    const runner = new Runner({
      reporter: new StartStopReporter({
        output: new Writer({
          impl: this.socket,
          write(writer, data) {
            writer.impl.write(data);
          }
        })
      }).reporter()
    });
    this.app.workspace.onLayoutReady(async () => {
      try {
        const passed = await runTests(runner, files(this.app), new Search(
          this,
          async function(query) {
            const matches = [];
            for await (const file2 of search(query, this.impl.app)) {
              matches.push({
                name: file2.name,
                path: file2.path,
                basename: file2.basename,
                content: await file2.vault.cachedRead(file2),
                metadata: this.impl.app.metadataCache.getFileCache(file2)?.frontmatter
              });
            }
            return matches;
          }
        ));
        sendResultSignal(this.socket, passed);
      } catch (e) {
        this.socket.write("catastrophic error: " + util.inspect(e));
      }
    });
  }
}
module.exports = Compliance;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzaWRpYW4tc2VhcmNoLmNqcyIsInNvdXJjZXMiOlsiLi4vdGVzdC9jb250cmFjdC90ZXN0cy9hbmQudHMiLCIuLi90ZXN0L2NvbnRyYWN0L3Rlc3RzL2NvbG9uLnRzIiwiLi4vdGVzdC9jb250cmFjdC90ZXN0cy9maWxlLnRzIiwiLi4vdGVzdC9jb250cmFjdC90ZXN0cy9uZWdhdGlvbi50cyIsIi4uL3Rlc3QvY29udHJhY3QvdGVzdHMvb3IudHMiLCIuLi90ZXN0L2NvbnRyYWN0L3Rlc3RzL3BhdGgudHMiLCIuLi90ZXN0L3Rlc3RpbmcvZmlsZXMudHMiLCIuLi90ZXN0L2NvbnRyYWN0L3Rlc3RzL3Byb3BlcnR5LnRzIiwiLi4vc3JjL2xpYi9zdHJpbmdzLnRzIiwiLi4vdGVzdC9jb250cmFjdC90ZXN0cy90YWdzLnRzIiwiLi4vdGVzdC9jb250cmFjdC90ZXN0cy93b3Jkcy50cyIsIi4uL3Rlc3QvZnJhbWV3b3JrLnRzIiwiLi4vdGVzdC9jb250cmFjdC90ZXN0cy9pbmRleC50cyIsIi4uL3Rlc3QvZW1iZWRkZWQvcGx1Z2luLnRzIiwiLi4vdGVzdC9lbWJlZGRlZC90ZXN0aW5nLnRzIiwiLi4vdGVzdC9lbWJlZGRlZC9zb2NrZXRzLmpzIiwiLi4vdGVzdC90ZXN0aW5nL3NlYXJjaC50cyIsIi4uL3NyYy9maWx0ZXJzL01hdGNoQWxsRmlsdGVyLnRzIiwiLi4vc3JjL2ZpbHRlcnMvT3JGaWx0ZXIudHMiLCIuLi9zcmMvZmlsdGVycy9OZWdhdGlvbi50cyIsIi4uL3NyYy9maWx0ZXJzL0ZpbGVGaWx0ZXIudHMiLCIuLi9zcmMvZmlsdGVycy9GaWxlQ29udGVudEZpbHRlci50cyIsIi4uL3NyYy9maWx0ZXJzL0ZpbGVOYW1lRmlsdGVyLnRzIiwiLi4vc3JjL2ZpbHRlcnMvRmlsZVBhdGhGaWx0ZXIudHMiLCIuLi9zcmMvZmlsdGVycy9GaWxlUHJvcGVydHlGaWx0ZXIudHMiLCIuLi9zcmMvZmlsdGVycy9GaWxlVGFnc0ZpbHRlci50cyIsIi4uL3NyYy9tYXRjaGVycy50cyIsIi4uL3NyYy9wYXJzZXIudHMiLCIuLi9zcmMvaW5kZXgudHMiLCIuLi90ZXN0L2NvbXBsaWFuY2UvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCAqIGFzIHRlc3RpbmcgZnJvbSBcIi4uLy4uL2ZyYW1ld29ya1wiO1xuaW1wb3J0IHR5cGUgeyBGaWxlcyB9IGZyb20gXCIuLi8uLi90ZXN0aW5nL2ZpbGVzXCJcbmltcG9ydCB0eXBlIHsgU2VhcmNoIH0gZnJvbSBcIi4uLy4uL3Rlc3Rpbmcvc2VhcmNoXCJcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdGVzdEFuZDxGaWxlPihydW46IHRlc3RpbmcuVGVzdCwgb2JzaWRpYW46IEZpbGVzPEZpbGU+LCBzZWFyY2g6IFNlYXJjaCkge1xuXHRydW4udGVzdChcImltcGxpY2l0XCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwidGVzdC5tZFwiLCBgb25lIHR3byB0aHJlZWApO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZShmaWxlKSlcblxuXHRcdGNvbnN0IGZpbGVfd2l0aF9vbmx5X29uZSA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ0ZXN0MS5tZFwiLCBcIm9uZVwiKTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUoZmlsZV93aXRoX29ubHlfb25lKSlcblxuXHRcdGNvbnN0IHF1ZXJ5ID0gXCJvbmUgdGhyZWVcIlxuXHRcdHQubG9nKHsgcXVlcnkgfSlcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSlcblx0XHR0LmxvZyh7IG1hdGNoZXMgfSlcblxuXHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIHRvIGZpbmQgJ3Rlc3QubWQnIGluIG1hdGNoZXNcIilcblx0XHRcdHQubG9nKFwiICAgIGNvbnRlbnQ6XCIsIGF3YWl0IG9ic2lkaWFuLnJlYWRGaWxlKGZpbGUpKVxuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCIndGVzdDEubWQnIG9ubHkgaGFzICdvbmUnIGluIGl0cyBib2R5LCBidXQgd2FzIGluXCIpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwiZXhwbGljaXQgJ0FORCcgaXMgbm90IHJlY29nbml6ZWRcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgZmlsZSA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ0ZXN0Lm1kXCIsIGBvbmUgdHdvIHRocmVlIEFORGApO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZShmaWxlKSlcblxuXHRcdGNvbnN0IGZpbGVfd2l0aF9vbmx5X29uZSA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ0ZXN0MS5tZFwiLCBcIm9uZSB0aHJlZVwiKTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUoZmlsZV93aXRoX29ubHlfb25lKSlcblxuXHRcdGNvbnN0IHF1ZXJ5ID0gXCJvbmUgQU5EIHRocmVlXCJcblx0XHR0LmxvZyhcInF1ZXJ5OlwiLCBxdWVyeSlcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSlcblx0XHR0LmxvZyhcIm1hdGNoZXM6XCIsIG1hdGNoZXMpXG5cblx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoYGZpbGUgY29udGFpbmluZyAnb25lJywgJ0FORCcsIGFuZCAndGhyZWUnIHNob3VsZCBoYXZlIG1hdGNoZWRgKVxuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoYGZpbGUgY29udGFpbmluZyBvbmx5ICdvbmUnIGFuZCAndGhyZWUnIHNob3VsZCBOT1QgaGF2ZSBtYXRjaGVkYClcblx0XHR9XG5cdH0pXG59XG4iLCJpbXBvcnQgKiBhcyB0ZXN0aW5nIGZyb20gXCIuLi8uLi9mcmFtZXdvcmtcIjtcbmltcG9ydCB0eXBlIHsgRmlsZXMgfSBmcm9tIFwiLi4vLi4vdGVzdGluZy9maWxlc1wiXG5pbXBvcnQgdHlwZSB7IFNlYXJjaCB9IGZyb20gXCIuLi8uLi90ZXN0aW5nL3NlYXJjaFwiXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRlc3RGaWxlT3BlcmF0b3I8RmlsZT4oXG5cdHQ6IHRlc3RpbmcuVGVzdCxcblx0ZmlsZXM6IEZpbGVzPEZpbGU+LFxuXHRzZWFyY2g6IFNlYXJjaCxcbikge1xuXHR0LnRlc3QoXCJub24ta2V5d29yZFwiLCBhc3luYyB0ID0+IHtcblx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgYGtleXdvcmQ6Zm9vYClcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZSkpXG5cblx0XHRjb25zdCBxdWVyeSA9IFwia2V5d29yZDpmb29cIjtcblx0XHR0LmxvZyh7IHF1ZXJ5IH0pXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IocXVlcnkpO1xuXHRcdGNvbnN0IGV4cGVjdGVkX21lc3NhZ2UgPSBgT3BlcmF0b3IgXCJrZXl3b3JkXCIgbm90IHJlY29nbml6ZWRgO1xuXHRcdGNvbnN0IGxvZ2dlZF9lcnIgPSB0LmxvZ3MuZmluZExhc3QoaXQgPT4gaXQuYXJncy5zb21lKGl0ID0+IGl0LmluY2x1ZGVzKGV4cGVjdGVkX21lc3NhZ2UpKSk7XG5cdFx0dC5sb2coeyBtYXRjaGVzIH0pO1xuXG5cdFx0aWYgKCFsb2dnZWRfZXJyKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwic2hvdWxkIGhhdmUgbG9nZ2VkIGFuIGVycm9yXCIpXG5cdFx0fVxuXG5cdFx0aWYgKG1hdGNoZXMubGVuZ3RoICE9PSAwKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwic2hvdWxkIG5vdCBoYXZlIGZvdW5kIGFueSBtYXRjaGVzXCIpXG5cdFx0fVxuXHR9KVxufVxuIiwiaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vLi4vZnJhbWV3b3JrXCI7XG5pbXBvcnQgdHlwZSB7IEZpbGVzIH0gZnJvbSBcIi4uLy4uL3Rlc3RpbmcvZmlsZXNcIlxuaW1wb3J0IHR5cGUgeyBTZWFyY2ggfSBmcm9tIFwiLi4vLi4vdGVzdGluZy9zZWFyY2hcIlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0ZXN0RmlsZU9wZXJhdG9yPEZpbGU+KFxuXHR0OiB0ZXN0aW5nLlRlc3QsXG5cdGZpbGVzOiBGaWxlczxGaWxlPixcblx0c2VhcmNoOiBTZWFyY2gsXG4pIHtcblx0dC50ZXN0KFwiZmlsZSBrZXl3b3JkXCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IHF1ZXJ5ID0gXCJmaWxlOnRlc3RcIjtcblx0XHRjb25zdCBtYXRjaGluZ19maWxlcyA9IFtcblx0XHRcdHsgcGF0aDogXCJkaXIvdGVzdC5tZFwiLCBjb250ZW50OiBcIlwiIH0sXG5cdFx0XTtcblx0XHRjb25zdCBub25fbWF0Y2hpbmdfZmlsZXMgPSBbXG5cdFx0XHR7IHBhdGg6IFwidGVzdC9mb28ubWRcIiwgY29udGVudDogXCJcIiB9LFxuXHRcdF1cblx0XHRmb3IgKGNvbnN0IHsgcGF0aCwgY29udGVudCB9IG9mIFsuLi5tYXRjaGluZ19maWxlcywgLi4ubm9uX21hdGNoaW5nX2ZpbGVzXSkge1xuXHRcdFx0Y29uc3QgZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUocGF0aCwgY29udGVudCk7XG5cdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZSkpO1xuXHRcdH1cblxuXHRcdHQubG9nKHsgcXVlcnkgfSlcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSlcblx0XHR0LmxvZyh7IG1hdGNoZXMgfSlcblxuXHRcdGZvciAoY29uc3QgeyBwYXRoLCB9IG9mIG1hdGNoaW5nX2ZpbGVzKSB7XG5cdFx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5wYXRoID09PSBwYXRoKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKGBleHBlY3RlZCB0byBtYXRjaCBmaWxlIHdpdGggcGF0aCBcIiR7cGF0aH1cImApXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCB7IHBhdGgsIH0gb2Ygbm9uX21hdGNoaW5nX2ZpbGVzKSB7XG5cdFx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0LnBhdGggPT09IHBhdGgpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoYGV4cGVjdGVkIE5PVCB0byBoYXZlIG1hdGNoZWQgZmlsZSB3aXRoIHBhdGggXCIke3BhdGh9XCJgKVxuXHRcdFx0fVxuXHRcdH1cblx0fSlcblxuXHR0LnRlc3QoXCJuZXN0aW5nIG9wZXJhdG9yIHdpdGhpbiBvcGVyYXRvclwiLCBhc3luYyAodDogdGVzdGluZy5UZXN0KSA9PiB7XG5cdFx0Y29uc3QgcXVlcnkgPSBcImZpbGU6ZmlsZTpcIlxuXHRcdGNvbnN0IGZpbGVfbGlzdCA9IFtcblx0XHRcdHsgcGF0aDogXCJmaWxlLm1kXCIsIGNvbnRlbnQ6IFwiXCIgfSxcblx0XHRdO1xuXHRcdGZvciAoY29uc3QgeyBwYXRoLCBjb250ZW50IH0gb2YgZmlsZV9saXN0KSB7XG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShwYXRoLCBjb250ZW50KTtcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlKSlcblx0XHR9XG5cblx0XHR0LmxvZyh7IHF1ZXJ5IH0pXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IocXVlcnkpXG5cdFx0Y29uc3QgZXhwZWN0ZWRfbWVzc2FnZSA9IGBPcGVyYXRvciBcImZpbGVcIiBjYW5ub3QgYmUgbmVzdGVkIHdpdGhpbiBcImZpbGVcImBcblx0XHRjb25zdCBsb2dnZWRfZXJyID0gdC5sb2dzLmZpbmRMYXN0KGl0ID0+IGl0LmFyZ3Muc29tZShpdCA9PiBpdC5pbmNsdWRlcyhleHBlY3RlZF9tZXNzYWdlKSkpO1xuXHRcdHQubG9nKHsgbWF0Y2hlcyB9KVxuXG5cdFx0aWYgKG1hdGNoZXMubGVuZ3RoICE9PSAwKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwic2hvdWxkIG5vdCBoYXZlIGZvdW5kIGFueSBtYXRjaGVzXCIpXG5cdFx0fVxuXHRcdGlmICghbG9nZ2VkX2Vycikge1xuXHRcdFx0dC5mYWlsTm93V2l0aChcInNob3VsZCBoYXZlIGxvZ2dlZCBhbiBlcnJvclwiKVxuXHRcdH1cblxuXHR9KVxuXG5cdHQudGVzdChcImZpbGUga2V5d29yZCB3aXRoIGFkZGl0aW9uYWwgcXVlcnlcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgcXVlcnkgPSBcImZpbGU6dGVzdCBzb21ldGhpbmdcIjtcblx0XHRjb25zdCBtYXRjaGluZ19maWxlcyA9IFtcblx0XHRcdHsgcGF0aDogXCJkaXIvdGVzdC5tZFwiLCBjb250ZW50OiBcInNvbWV0aGluZ1wiIH0sXG5cdFx0XTtcblx0XHRjb25zdCBub25fbWF0Y2hpbmdfZmlsZXMgPSBbXG5cdFx0XHR7IHBhdGg6IFwiZGlyMS90ZXN0Lm1kXCIsIGNvbnRlbnQ6IFwiXCIgfSxcblx0XHRcdHsgcGF0aDogXCJ0ZXN0L2Zvby5tZFwiLCBjb250ZW50OiBcIlwiIH0sXG5cdFx0XVxuXHRcdGZvciAoY29uc3QgeyBwYXRoLCBjb250ZW50IH0gb2YgWy4uLm1hdGNoaW5nX2ZpbGVzLCAuLi5ub25fbWF0Y2hpbmdfZmlsZXNdKSB7XG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShwYXRoLCBjb250ZW50KTtcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlKSk7XG5cdFx0fVxuXG5cdFx0dC5sb2coeyBxdWVyeSB9KVxuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBzZWFyY2guc2VhcmNoRm9yKHF1ZXJ5KVxuXHRcdHQubG9nKHsgbWF0Y2hlcyB9KVxuXG5cdFx0Zm9yIChjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSBvZiBtYXRjaGluZ19maWxlcykge1xuXHRcdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQucGF0aCA9PT0gcGF0aCkpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChgZXhwZWN0ZWQgdG8gbWF0Y2ggZmlsZSB3aXRoIHBhdGggXCIke3BhdGh9XCIgYW5kIGNvbnRlbnQ6ICR7Y29udGVudH1gKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgeyBwYXRoLCBjb250ZW50IH0gb2Ygbm9uX21hdGNoaW5nX2ZpbGVzKSB7XG5cdFx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0LnBhdGggPT09IHBhdGgpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoYGV4cGVjdGVkIE5PVCB0byBoYXZlIG1hdGNoZWQgZmlsZSB3aXRoIHBhdGggXCIke3BhdGh9XCIgYW5kIGNvbnRlbnQ6ICR7Y29udGVudH1gKVxuXHRcdFx0fVxuXHRcdH1cblx0fSlcblxuXHR0LnRlc3QoXCJuZWdhdGUgd2l0aGluIHN1YnF1ZXJ5XCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IHRlc3RfZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0Lm1kXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZSh0ZXN0X2ZpbGUpKVxuXG5cdFx0Y29uc3Qgb3RoZXJfZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJvdGhlci5tZFwiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUob3RoZXJfZmlsZSkpXG5cblx0XHRjb25zdCBxdWVyeSA9IGBmaWxlOi10ZXN0YDtcblx0XHR0LmxvZyh7IHF1ZXJ5IH0pO1xuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBzZWFyY2guc2VhcmNoRm9yKHF1ZXJ5KTtcblx0XHR0LmxvZyh7IG1hdGNoZXMgfSlcblxuXHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwib3RoZXIubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoYGV4cGVjdGVkIHRvIGZpbmQgZmlsZSBcIm90aGVyLm1kXCJgKVxuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChgc2hvdWxkIE5PVCBoYXZlIG1hdGNoZWQgXCJ0ZXN0Lm1kXCJgKVxuXHRcdH1cblx0fSlcblxuXHR0LnRlc3QoXCJncm91cCB3aXRoaW4gc3VicXVlcnlcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgcXVlcnkgPSBgZmlsZTooc29tZSB0aGluZylgO1xuXHRcdC8vIGdyb3VwIGlzIHRyZWF0ZWQgYWxtb3N0IGxpa2UgYSBwaHJhc2UuICBUaGUgc3BhY2UgZG9lcyBub3QgZW5kIHRoZSBzdWJxdWVyeSBsaWtlIGBmaWxlOnNvbWUgdGhpbmdgIHdvdWxkXG5cdFx0Y29uc3QgbWF0Y2hpbmdfZmlsZXMgPSBbXG5cdFx0XHR7IHBhdGg6IFwiKHNvbWUgdGhpbmcpLm1kXCIsIGNvbnRlbnQ6ICcnIH0sXG5cdFx0XTtcblx0XHRjb25zdCBub25fbWF0Y2hpbmdfZmlsZXMgPSBbXG5cdFx0XHR7IHBhdGg6IFwic29tZS90aGluZy5tZFwiLCBjb250ZW50OiAnJyB9LFxuXHRcdFx0eyBwYXRoOiBcInRoaW5nL3NvbWUubWRcIiwgY29udGVudDogJycgfSxcblx0XHRcdHsgcGF0aDogXCJzb21lLm1kXCIsIGNvbnRlbnQ6ICcnIH0sXG5cdFx0XHR7IHBhdGg6IFwidGhpbmcubWRcIiwgY29udGVudDogJycgfSxcblx0XHRcdHsgcGF0aDogXCIoc29tZS5tZFwiLCBjb250ZW50OiAndGhpbmcpJyB9LFxuXHRcdF1cblx0XHRmb3IgKGNvbnN0IHsgcGF0aCwgY29udGVudCB9IG9mIFsuLi5ub25fbWF0Y2hpbmdfZmlsZXMsIC4uLm1hdGNoaW5nX2ZpbGVzXSkge1xuXHRcdFx0Y29uc3QgZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUocGF0aCwgY29udGVudCk7XG5cdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZSkpXG5cdFx0fVxuXG5cdFx0dC5sb2coeyBxdWVyeSB9KTtcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSk7XG5cdFx0dC5sb2coeyBtYXRjaGVzIH0pXG5cblx0XHRmb3IgKGNvbnN0IHsgcGF0aCwgY29udGVudCB9IG9mIG1hdGNoaW5nX2ZpbGVzKSB7XG5cdFx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5wYXRoID09PSBwYXRoKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKGBleHBlY3RlZCB0byBtYXRjaCBmaWxlIHdpdGggcGF0aCBcIiR7cGF0aH1cIiBhbmQgY29udGVudDogJHtjb250ZW50fWApXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSBvZiBub25fbWF0Y2hpbmdfZmlsZXMpIHtcblx0XHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQucGF0aCA9PT0gcGF0aCkpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChgZXhwZWN0ZWQgTk9UIGhhdmUgbWF0Y2hlZCBmaWxlIHdpdGggcGF0aCBcIiR7cGF0aH1cIiBhbmQgY29udGVudDogJHtjb250ZW50fWApXG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxuXG5cdHQudGVzdChcIm5lZ2F0ZWQgZ3JvdXAgd2l0aGluIHN1YnF1ZXJ5XCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IHF1ZXJ5ID0gYGZpbGU6LShzb21lIHRoaW5nKWA7XG5cdFx0Ly8gZ3JvdXAgaXMgdHJlYXRlZCBhbG1vc3QgbGlrZSBhIHBocmFzZS4gIFRoZSBzcGFjZSBkb2VzIG5vdCBlbmQgdGhlIHN1YnF1ZXJ5IGxpa2UgYGZpbGU6c29tZSB0aGluZ2Agd291bGRcblx0XHRjb25zdCBtYXRjaGluZ19maWxlcyA9IFtcblx0XHRcdHsgcGF0aDogXCJzb21lL3RoaW5nLm1kXCIsIGNvbnRlbnQ6ICcnIH0sXG5cdFx0XHR7IHBhdGg6IFwidGhpbmcvc29tZS5tZFwiLCBjb250ZW50OiAnJyB9LFxuXHRcdFx0eyBwYXRoOiBcInNvbWUubWRcIiwgY29udGVudDogJycgfSxcblx0XHRcdHsgcGF0aDogXCJ0aGluZy5tZFwiLCBjb250ZW50OiAnJyB9LFxuXHRcdFx0eyBwYXRoOiBcIihzb21lLm1kXCIsIGNvbnRlbnQ6ICd0aGluZyknIH0sXG5cdFx0XVxuXHRcdGNvbnN0IG5vbl9tYXRjaGluZ19maWxlcyA9IFtcblx0XHRcdHsgcGF0aDogXCIoc29tZSB0aGluZykubWRcIiwgY29udGVudDogJycgfSxcblx0XHRdO1xuXHRcdGZvciAoY29uc3QgeyBwYXRoLCBjb250ZW50IH0gb2YgWy4uLm1hdGNoaW5nX2ZpbGVzLCAuLi5ub25fbWF0Y2hpbmdfZmlsZXNdKSB7XG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShwYXRoLCBjb250ZW50KTtcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlKSlcblx0XHR9XG5cblx0XHR0LmxvZyh7IHF1ZXJ5IH0pO1xuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBzZWFyY2guc2VhcmNoRm9yKHF1ZXJ5KTtcblx0XHR0LmxvZyh7IG1hdGNoZXMgfSlcblxuXHRcdGZvciAoY29uc3QgeyBwYXRoLCBjb250ZW50IH0gb2YgbWF0Y2hpbmdfZmlsZXMpIHtcblx0XHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0LnBhdGggPT09IHBhdGgpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoYGV4cGVjdGVkIHRvIG1hdGNoIGZpbGUgd2l0aCBwYXRoIFwiJHtwYXRofVwiIGFuZCBjb250ZW50OiAke2NvbnRlbnR9YClcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IHsgcGF0aCwgY29udGVudCB9IG9mIG5vbl9tYXRjaGluZ19maWxlcykge1xuXHRcdFx0aWYgKG1hdGNoZXMuc29tZShpdCA9PiBpdC5wYXRoID09PSBwYXRoKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKGBleHBlY3RlZCBOT1QgaGF2ZSBtYXRjaGVkIGZpbGUgd2l0aCBwYXRoIFwiJHtwYXRofVwiIGFuZCBjb250ZW50OiAke2NvbnRlbnR9YClcblx0XHRcdH1cblx0XHR9XG5cdH0pXG5cblx0dC50ZXN0KFwicGF0aDpcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgbWF0Y2hpbmdfZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJkaXIvdGVzdC5tZFwiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUobWF0Y2hpbmdfZmlsZSkpO1xuXG5cdFx0Y29uc3QgZmlsZV9pbl9kaXIgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdC9mb28ubWRcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGVfaW5fZGlyKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihcInBhdGg6dGVzdFwiKVxuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZGlkIG5vdCBtYXRjaCBmaWxlIG5hbWVcIilcblx0XHR9XG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJmb28ubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJkaWQgbm90IG1hdGNoIGRpcmVjdG9yeSBuYW1lXCIpXG5cdFx0fVxuXHR9KVxufVxuIiwiaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vLi4vZnJhbWV3b3JrXCI7XG5pbXBvcnQgdHlwZSB7IEZpbGVzIH0gZnJvbSBcIi4uLy4uL3Rlc3RpbmcvZmlsZXNcIlxuaW1wb3J0IHR5cGUgeyBTZWFyY2ggfSBmcm9tIFwiLi4vLi4vdGVzdGluZy9zZWFyY2hcIlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0ZXN0TmVnYXRpb248RmlsZT4ocnVuOiB0ZXN0aW5nLlRlc3QsIG9ic2lkaWFuOiBGaWxlczxGaWxlPiwgc2VhcmNoOiBTZWFyY2gpIHtcblx0cnVuLnRlc3QoXCJub3Qgd29yZFwiLCBhc3luYyB0ID0+IHtcblx0XHRjb25zdCBmaWxlID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcImhhcyB3b3JkLm1kXCIsIFwid29yZFwiKTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUoZmlsZSkpO1xuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IoYC13b3JkYClcblxuXHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJoYXMgd29yZC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcImZpbGUgd2l0aCB3b3JkIHNob3VsZCBOT1QgbWF0Y2ggYmVjYXVzZSBpdCB3YXMgbmVnYXRlZFwiKVxuXHRcdH1cblx0fSlcbn1cbiIsIlxuaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vLi4vZnJhbWV3b3JrXCI7XG5pbXBvcnQgdHlwZSB7IEZpbGVzIH0gZnJvbSBcIi4uLy4uL3Rlc3RpbmcvZmlsZXNcIlxuaW1wb3J0IHR5cGUgeyBTZWFyY2ggfSBmcm9tIFwiLi4vLi4vdGVzdGluZy9zZWFyY2hcIlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0ZXN0T3I8RmlsZT4ocnVuOiB0ZXN0aW5nLlRlc3QsIG9ic2lkaWFuOiBGaWxlczxGaWxlPiwgc2VhcmNoOiBTZWFyY2gpIHtcblx0cnVuLnRlc3QoXCJiYXNpYyB1c2FnZVwiLCBhc3luYyB0ID0+IHtcblx0XHRjb25zdCBtYXRjaDEgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwibWF0Y2gxLm1kXCIsIFwidmFsdWUxXCIpXG5cdFx0dC5hZnRlcigoKSA9PiBvYnNpZGlhbi5kZWxldGVGaWxlKG1hdGNoMSkpXG5cdFx0Y29uc3QgbWF0Y2gyID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcIm1hdGNoMi5tZFwiLCBcInZhbHVlMlwiKVxuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZShtYXRjaDIpKVxuXHRcdGNvbnN0IG5vbl9tYXRjaCA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJub25fbWF0Y2gubWRcIiwgXCJ2YWx1ZTNcIilcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUobm9uX21hdGNoKSlcblxuXHRcdGNvbnN0IHF1ZXJ5ID0gXCJ2YWx1ZTEgT1IgdmFsdWUyXCJcblx0XHR0LmxvZyhcInF1ZXJ5OlwiLCBxdWVyeSlcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSk7XG5cdFx0dC5sb2coXCJtYXRjaGVzOlwiLCBtYXRjaGVzKVxuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJtYXRjaDEubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJmaWxlIGNvbnRhaW5pbmcgYHZhbHVlMWAgbm90IGZvdW5kXCIpXG5cdFx0fVxuXHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwibWF0Y2gyLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZmlsZSBjb250YWluaW5nIGB2YWx1ZTJgIG5vdCBmb3VuZFwiKVxuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwibm9uX21hdGNoLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZmlsZSBub3QgY29udGFpbmluZyBlaXRoZXIgdmFsdWUgd2FzIGZvdW5kXCIpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwibG93ZXJjYXNlICdvcicgaXMgY29uc2lkZXJlZCBhIHJlZ3VsYXIgd29yZFwiLCBhc3luYyB0ID0+IHtcblx0XHRjb25zdCBtYXRjaDEgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwibWF0Y2gxLm1kXCIsIFwidmFsdWUxXCIpXG5cdFx0dC5hZnRlcigoKSA9PiBvYnNpZGlhbi5kZWxldGVGaWxlKG1hdGNoMSkpXG5cdFx0Y29uc3QgbWF0Y2gyID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcIm1hdGNoMi5tZFwiLCBcInZhbHVlMlwiKVxuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZShtYXRjaDIpKVxuXHRcdGNvbnN0IG9yX21hdGNoID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcIm9yX21hdGNoLm1kXCIsIFwib3IgdmFsdWUyIHZhbHVlMVwiKVxuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZShvcl9tYXRjaCkpXG5cblx0XHRjb25zdCBxdWVyeSA9IFwidmFsdWUxIG9yIHZhbHVlMlwiXG5cdFx0dC5sb2coXCJxdWVyeTpcIiwgcXVlcnkpXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IocXVlcnkpO1xuXHRcdHQubG9nKFwibWF0Y2hlczpcIiwgbWF0Y2hlcylcblxuXHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJtYXRjaDEubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJmaWxlIGNvbnRhaW5pbmcgb25seSBgdmFsdWUxYCBzaG91bGQgbm90IGhhdmUgYmVlbiBmb3VuZFwiKVxuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwibWF0Y2gyLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZmlsZSBjb250YWluaW5nIG9ubHkgYHZhbHVlMmAgc2hvdWxkIG5vdCBoYXZlIGZvdW5kXCIpXG5cdFx0fVxuXHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwib3JfbWF0Y2gubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJmaWxlIGNvbnRhaW5pbmcgYWxsIHRoZSB3b3JkcyBzaG91bGQgaGF2ZSBiZWVuIGluY2x1ZGVkIGluIG1hdGNoXCIpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwiT1IgYnkgaXRzZWxmXCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IGZpbGVfd2l0aG91dF9vciA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ3aXRob3V0Lm1kXCIsIFwiXCIpXG5cdFx0dC5hZnRlcigoKSA9PiBvYnNpZGlhbi5kZWxldGVGaWxlKGZpbGVfd2l0aG91dF9vcikpXG5cdFx0Y29uc3QgZmlsZV93aXRoX29yID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcIndpdGgubWRcIiwgXCJPUlwiKVxuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZShmaWxlX3dpdGhfb3IpKVxuXG5cdFx0Y29uc3QgcXVlcnkgPSBcIk9SXCJcblx0XHR0LmxvZyh7IHF1ZXJ5IH0pXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IocXVlcnkpXG5cdFx0dC5sb2coeyBtYXRjaGVzIH0pXG5cblx0XHRpZiAobWF0Y2hlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwic2hvdWxkIG5vdCBoYXZlIGZvdW5kIGFueSBtYXRjaGVzXCIpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwiT1IgcXVvdGVkXCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IGZpbGVfd2l0aG91dF9vciA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ3aXRob3V0Lm1kXCIsIFwiXCIpXG5cdFx0dC5hZnRlcigoKSA9PiBvYnNpZGlhbi5kZWxldGVGaWxlKGZpbGVfd2l0aG91dF9vcikpXG5cdFx0Y29uc3QgZmlsZV93aXRoX29yID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcIndpdGgubWRcIiwgXCJPUlwiKVxuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZShmaWxlX3dpdGhfb3IpKVxuXG5cdFx0Y29uc3QgcXVlcnkgPSBgXCJPUlwiYFxuXHRcdHQubG9nKHsgcXVlcnkgfSlcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSlcblx0XHR0LmxvZyh7IG1hdGNoZXMgfSlcblxuXHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0LnBhdGggPT09IFwid2l0aC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcInNob3VsZCBoYXZlIG1hdGNoZWQgZmlsZSAnd2l0aC5tZCcgd2l0aCBjb250ZW50OjogXCIgKyBhd2FpdCBvYnNpZGlhbi5yZWFkRmlsZShmaWxlX3dpdGhfb3IpKVxuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0LnBhdGggPT09IFwid2l0aG91dC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcInNob3VsZCBOT1QgaGF2ZSBtYXRjaGVkIGZpbGUgJ3dpdGhvdXQubWQnXCIpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwibmVnYXRlZCBPUlwiLCBhc3luYyB0ID0+IHtcblx0XHRjb25zdCBmaWxlX3dpdGhvdXRfb3IgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwid2l0aG91dC5tZFwiLCBcIlwiKVxuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZShmaWxlX3dpdGhvdXRfb3IpKVxuXHRcdGNvbnN0IGZpbGVfd2l0aF9vciA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ3aXRoLm1kXCIsIFwiT1JcIilcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUoZmlsZV93aXRoX29yKSlcblxuXHRcdGNvbnN0IHF1ZXJ5ID0gXCItT1JcIlxuXHRcdHQubG9nKHsgcXVlcnkgfSlcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSlcblx0XHR0LmxvZyh7IG1hdGNoZXMgfSlcblxuXHRcdGlmIChtYXRjaGVzLmxlbmd0aCA+IDApIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJzaG91bGQgbm90IGhhdmUgZm91bmQgYW55IG1hdGNoZXNcIilcblx0XHR9XG5cdH0pXG59XG4iLCJpbXBvcnQgKiBhcyB0ZXN0aW5nIGZyb20gXCIuLi8uLi9mcmFtZXdvcmtcIjtcbmltcG9ydCB0eXBlIHsgRmlsZXMgfSBmcm9tIFwiLi4vLi4vdGVzdGluZy9maWxlc1wiXG5pbXBvcnQgdHlwZSB7IFNlYXJjaCB9IGZyb20gXCIuLi8uLi90ZXN0aW5nL3NlYXJjaFwiXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRlc3RGaWxlT3BlcmF0b3I8RmlsZT4oXG5cdHQ6IHRlc3RpbmcuVGVzdCxcblx0ZmlsZXM6IEZpbGVzPEZpbGU+LFxuXHRzZWFyY2g6IFNlYXJjaCxcbikge1xuXHRhc3luYyBmdW5jdGlvbiBwYXRoVGVzdCh0OiB0ZXN0aW5nLlRlc3QsIHF1ZXJ5OiBzdHJpbmcsXG5cdFx0ZXhwZWN0ZWQ6IEFycmF5PHsgcGF0aDogc3RyaW5nLCBjb250ZW50Pzogc3RyaW5nIH0+LFxuXHRcdHVuZXhwZWN0ZWQ6IEFycmF5PHsgcGF0aDogc3RyaW5nLCBjb250ZW50Pzogc3RyaW5nIH0+LFxuXHQpIHtcblx0XHR0LmxvZyh7IHF1ZXJ5IH0pO1xuXG5cdFx0Y29uc3QgZXhwZWN0ZWRfbWF0Y2hlczogQXJyYXk8eyBwYXRoOiBzdHJpbmcsIGZpbGU6IEZpbGUgfT4gPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGV4cGVjdGVkLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSA9IGV4cGVjdGVkW2ldO1xuXHRcdFx0Y29uc3QgZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUocGF0aCwgY29udGVudClcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlKSk7XG5cdFx0XHRleHBlY3RlZF9tYXRjaGVzLnB1c2goeyBwYXRoLCBmaWxlIH0pO1xuXHRcdH1cblx0XHRjb25zdCB1bmV4cGVjdGVkX21hdGNoZXM6IEFycmF5PHsgcGF0aDogc3RyaW5nLCBmaWxlOiBGaWxlIH0+ID0gW107XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB1bmV4cGVjdGVkLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSA9IHVuZXhwZWN0ZWRbaV07XG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShwYXRoLCBjb250ZW50KVxuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGUpKTtcblx0XHRcdHVuZXhwZWN0ZWRfbWF0Y2hlcy5wdXNoKHsgcGF0aCwgZmlsZSB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSk7XG5cdFx0dC5sb2coeyBtYXRjaGVzIH0pXG5cblx0XHRmb3IgKGNvbnN0IHsgcGF0aCwgZmlsZSB9IG9mIGV4cGVjdGVkX21hdGNoZXMpIHtcblx0XHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0LnBhdGggPT09IHBhdGgpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoYGRpZCBub3QgZmluZCAke3BhdGh9IGluIG1hdGNoZXNgKVxuXHRcdFx0XHR0LmxvZyhcIiAgICBjb250ZW50OlwiLCBhd2FpdCBmaWxlcy5yZWFkRmlsZShmaWxlKSlcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IHsgcGF0aCB9IG9mIHVuZXhwZWN0ZWRfbWF0Y2hlcykge1xuXHRcdFx0aWYgKG1hdGNoZXMuc29tZShpdCA9PiBpdC5wYXRoID09PSBwYXRoKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKGBleHBlY3RlZCBOT1QgdG8gZmluZCAke3BhdGh9IGluIG1hdGNoZXNgKVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gbWF0Y2hlcztcblx0fVxuXHR0LnRlc3QoXCJwYXRoIGtleXdvcmRcIiwgYXN5bmMgdCA9PiB7XG5cdFx0YXdhaXQgcGF0aFRlc3QodCwgXCJwYXRoOnRlc3RcIixcblx0XHRcdC8vIGV4cGVjdGVkIG1hdGNoZXNcblx0XHRcdFtcblx0XHRcdFx0eyBwYXRoOiBcImRpci90ZXN0Lm1kXCIgfSxcblx0XHRcdFx0eyBwYXRoOiBcImRpci90ZXN0MS5tZFwiIH0sXG5cdFx0XHRcdHsgcGF0aDogXCJ0ZXN0L2Zvby5tZFwiIH0sXG5cdFx0XHRcdHsgcGF0aDogXCJ0ZXN0MS9mb28ubWRcIiB9LFxuXHRcdFx0XSxcblx0XHRcdC8vIHVuZXhwZWN0ZWQgbWF0Y2hlc1xuXHRcdFx0W1xuXHRcdFx0XHR7IHBhdGg6IFwiZGlyL3Rlcy5tZFwiIH0sXG5cdFx0XHRdKTtcblx0fSlcblxuXHR0LnRlc3QoXCJuZXN0aW5nIG9wZXJhdG9yIHdpdGhpbiBvcGVyYXRvclwiLCBhc3luYyAodDogdGVzdGluZy5UZXN0KSA9PiB7XG5cdFx0YXdhaXQgcGF0aFRlc3QodCwgXCJwYXRoOnBhdGg6XCIsXG5cdFx0XHQvLyBleHBlY3RlZCBtYXRjaGVzXG5cdFx0XHRbXSxcblx0XHRcdC8vIHVuZXhwZWN0ZWQgbWF0Y2hlc1xuXHRcdFx0W1xuXHRcdFx0XHR7IHBhdGg6IFwicGF0aC5tZFwiIH0sXG5cdFx0XHRcdHsgcGF0aDogXCJwYXRoL3BhdGgubWRcIiB9LFxuXHRcdFx0XSk7XG5cblx0XHRjb25zdCBleHBlY3RlZF9tZXNzYWdlID0gYE9wZXJhdG9yIFwicGF0aFwiIGNhbm5vdCBiZSBuZXN0ZWQgd2l0aGluIFwicGF0aFwiYFxuXHRcdGNvbnN0IGxvZ2dlZF9lcnIgPSB0LmxvZ3MuZmluZExhc3QoaXQgPT4gaXQuYXJncy5zb21lKGl0ID0+IGl0LmluY2x1ZGVzKGV4cGVjdGVkX21lc3NhZ2UpKSk7XG5cblx0XHRpZiAoIWxvZ2dlZF9lcnIpIHtcblx0XHRcdHQuZmFpbE5vd1dpdGgoXCJzaG91bGQgaGF2ZSBsb2dnZWQgYW4gZXJyb3JcIilcblx0XHR9XG5cdH0pXG5cblx0dC50ZXN0KFwicGF0aCBrZXl3b3JkIHdpdGggYWRkaXRpb25hbCBxdWVyeVwiLCBhc3luYyB0ID0+IHtcblx0XHRhd2FpdCBwYXRoVGVzdCh0LCBcInBhdGg6dGVzdCBzb21ldGhpbmdcIixcblx0XHRcdC8vIGV4cGVjdGVkIG1hdGNoZXNcblx0XHRcdFtcblx0XHRcdFx0eyBwYXRoOiBcImRpci90ZXN0Lm1kXCIsIGNvbnRlbnQ6IFwic29tZXRoaW5nXCIgfSxcblx0XHRcdFx0eyBwYXRoOiBcImRpci90ZXN0ZWQubWRcIiwgY29udGVudDogXCJzb21ldGhpbmdcIiB9LFxuXHRcdFx0XHR7IHBhdGg6IFwidGVzdC9mb28ubWRcIiwgY29udGVudDogXCJzb21ldGhpbmdcIiB9LFxuXHRcdFx0XHR7IHBhdGg6IFwidGVzdGluZy9mb28ubWRcIiwgY29udGVudDogXCJzb21ldGhpbmdcIiB9LFxuXHRcdFx0XSxcblx0XHRcdC8vIHVuZXhwZWN0ZWQgbWF0Y2hlc1xuXHRcdFx0W1xuXHRcdFx0XHR7IHBhdGg6IFwiZGlyL3Rlc3QxLm1kXCIsIGNvbnRlbnQ6IFwiXCIgfSxcblx0XHRcdFx0eyBwYXRoOiBcImRpci90ZXN0Mi5tZFwiLCBjb250ZW50OiBcIlwiIH0sXG5cdFx0XHRcdHsgcGF0aDogXCJ0ZXN0MS9mb28ubWRcIiwgY29udGVudDogXCJcIiB9LFxuXHRcdFx0XHR7IHBhdGg6IFwidGVzdDIvZm9vLm1kXCIsIGNvbnRlbnQ6IFwiXCIgfSxcblx0XHRcdFx0eyBwYXRoOiBcInRlcy9mb28ubWRcIiwgY29udGVudDogXCJzb21ldGhpbmdcIiB9LFxuXHRcdFx0XSk7XG5cdH0pXG5cblx0dC50ZXN0KFwibmVnYXRlIHdpdGhpbiBzdWJxdWVyeVwiLCBhc3luYyB0ID0+IHtcblx0XHRjb25zdCB0ZXN0X2ZpbGUgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdC5tZFwiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUodGVzdF9maWxlKSlcblxuXHRcdGNvbnN0IG90aGVyX2ZpbGUgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwib3RoZXIubWRcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKG90aGVyX2ZpbGUpKVxuXG5cdFx0Y29uc3QgcXVlcnkgPSBgZmlsZTotdGVzdGA7XG5cdFx0dC5sb2coeyBxdWVyeSB9KTtcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSk7XG5cdFx0dC5sb2coeyBtYXRjaGVzIH0pXG5cblx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcIm90aGVyLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKGBleHBlY3RlZCB0byBmaW5kIGZpbGUgXCJvdGhlci5tZFwiYClcblx0XHR9XG5cdFx0aWYgKG1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoYHNob3VsZCBOT1QgaGF2ZSBtYXRjaGVkIFwidGVzdC5tZFwiYClcblx0XHR9XG5cdH0pXG5cblx0dC50ZXN0KFwiZ3JvdXAgd2l0aGluIHN1YnF1ZXJ5XCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IHF1ZXJ5ID0gYGZpbGU6KHNvbWUgdGhpbmcpYDtcblx0XHQvLyBncm91cCBpcyB0cmVhdGVkIGFsbW9zdCBsaWtlIGEgcGhyYXNlLiAgVGhlIHNwYWNlIGRvZXMgbm90IGVuZCB0aGUgc3VicXVlcnkgbGlrZSBgZmlsZTpzb21lIHRoaW5nYCB3b3VsZFxuXHRcdGNvbnN0IG1hdGNoaW5nX2ZpbGVzID0gW1xuXHRcdFx0eyBwYXRoOiBcIihzb21lIHRoaW5nKS5tZFwiLCBjb250ZW50OiAnJyB9LFxuXHRcdF07XG5cdFx0Y29uc3Qgbm9uX21hdGNoaW5nX2ZpbGVzID0gW1xuXHRcdFx0eyBwYXRoOiBcInNvbWUvdGhpbmcubWRcIiwgY29udGVudDogJycgfSxcblx0XHRcdHsgcGF0aDogXCJ0aGluZy9zb21lLm1kXCIsIGNvbnRlbnQ6ICcnIH0sXG5cdFx0XHR7IHBhdGg6IFwic29tZS5tZFwiLCBjb250ZW50OiAnJyB9LFxuXHRcdFx0eyBwYXRoOiBcInRoaW5nLm1kXCIsIGNvbnRlbnQ6ICcnIH0sXG5cdFx0XHR7IHBhdGg6IFwiKHNvbWUubWRcIiwgY29udGVudDogJ3RoaW5nKScgfSxcblx0XHRdXG5cdFx0Zm9yIChjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSBvZiBbLi4ubm9uX21hdGNoaW5nX2ZpbGVzLCAuLi5tYXRjaGluZ19maWxlc10pIHtcblx0XHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKHBhdGgsIGNvbnRlbnQpO1xuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGUpKVxuXHRcdH1cblxuXHRcdHQubG9nKHsgcXVlcnkgfSk7XG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IocXVlcnkpO1xuXHRcdHQubG9nKHsgbWF0Y2hlcyB9KVxuXG5cdFx0Zm9yIChjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSBvZiBtYXRjaGluZ19maWxlcykge1xuXHRcdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQucGF0aCA9PT0gcGF0aCkpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChgZXhwZWN0ZWQgdG8gbWF0Y2ggZmlsZSB3aXRoIHBhdGggXCIke3BhdGh9XCIgYW5kIGNvbnRlbnQ6ICR7Y29udGVudH1gKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgeyBwYXRoLCBjb250ZW50IH0gb2Ygbm9uX21hdGNoaW5nX2ZpbGVzKSB7XG5cdFx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0LnBhdGggPT09IHBhdGgpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoYGV4cGVjdGVkIE5PVCBoYXZlIG1hdGNoZWQgZmlsZSB3aXRoIHBhdGggXCIke3BhdGh9XCIgYW5kIGNvbnRlbnQ6ICR7Y29udGVudH1gKVxuXHRcdFx0fVxuXHRcdH1cblx0fSlcblxuXHR0LnRlc3QoXCJuZWdhdGVkIGdyb3VwIHdpdGhpbiBzdWJxdWVyeVwiLCBhc3luYyB0ID0+IHtcblx0XHRjb25zdCBxdWVyeSA9IGBmaWxlOi0oc29tZSB0aGluZylgO1xuXHRcdC8vIGdyb3VwIGlzIHRyZWF0ZWQgYWxtb3N0IGxpa2UgYSBwaHJhc2UuICBUaGUgc3BhY2UgZG9lcyBub3QgZW5kIHRoZSBzdWJxdWVyeSBsaWtlIGBmaWxlOnNvbWUgdGhpbmdgIHdvdWxkXG5cdFx0Y29uc3QgbWF0Y2hpbmdfZmlsZXMgPSBbXG5cdFx0XHR7IHBhdGg6IFwic29tZS90aGluZy5tZFwiLCBjb250ZW50OiAnJyB9LFxuXHRcdFx0eyBwYXRoOiBcInRoaW5nL3NvbWUubWRcIiwgY29udGVudDogJycgfSxcblx0XHRcdHsgcGF0aDogXCJzb21lLm1kXCIsIGNvbnRlbnQ6ICcnIH0sXG5cdFx0XHR7IHBhdGg6IFwidGhpbmcubWRcIiwgY29udGVudDogJycgfSxcblx0XHRcdHsgcGF0aDogXCIoc29tZS5tZFwiLCBjb250ZW50OiAndGhpbmcpJyB9LFxuXHRcdF1cblx0XHRjb25zdCBub25fbWF0Y2hpbmdfZmlsZXMgPSBbXG5cdFx0XHR7IHBhdGg6IFwiKHNvbWUgdGhpbmcpLm1kXCIsIGNvbnRlbnQ6ICcnIH0sXG5cdFx0XTtcblx0XHRmb3IgKGNvbnN0IHsgcGF0aCwgY29udGVudCB9IG9mIFsuLi5tYXRjaGluZ19maWxlcywgLi4ubm9uX21hdGNoaW5nX2ZpbGVzXSkge1xuXHRcdFx0Y29uc3QgZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUocGF0aCwgY29udGVudCk7XG5cdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZSkpXG5cdFx0fVxuXG5cdFx0dC5sb2coeyBxdWVyeSB9KTtcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSk7XG5cdFx0dC5sb2coeyBtYXRjaGVzIH0pXG5cblx0XHRmb3IgKGNvbnN0IHsgcGF0aCwgY29udGVudCB9IG9mIG1hdGNoaW5nX2ZpbGVzKSB7XG5cdFx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5wYXRoID09PSBwYXRoKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKGBleHBlY3RlZCB0byBtYXRjaCBmaWxlIHdpdGggcGF0aCBcIiR7cGF0aH1cIiBhbmQgY29udGVudDogJHtjb250ZW50fWApXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCB7IHBhdGgsIGNvbnRlbnQgfSBvZiBub25fbWF0Y2hpbmdfZmlsZXMpIHtcblx0XHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQucGF0aCA9PT0gcGF0aCkpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChgZXhwZWN0ZWQgTk9UIGhhdmUgbWF0Y2hlZCBmaWxlIHdpdGggcGF0aCBcIiR7cGF0aH1cIiBhbmQgY29udGVudDogJHtjb250ZW50fWApXG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxuXG5cdHQudGVzdChcInBhdGg6XCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IG1hdGNoaW5nX2ZpbGUgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwiZGlyL3Rlc3QubWRcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKG1hdGNoaW5nX2ZpbGUpKTtcblxuXHRcdGNvbnN0IGZpbGVfaW5fZGlyID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QvZm9vLm1kXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX2luX2RpcikpO1xuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IoXCJwYXRoOnRlc3RcIilcblxuXHRcdGlmICghbWF0Y2hlcy5zb21lKG1hdGNoID0+IG1hdGNoLm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcImRpZCBub3QgbWF0Y2ggZmlsZSBuYW1lXCIpXG5cdFx0fVxuXHRcdGlmICghbWF0Y2hlcy5zb21lKG1hdGNoID0+IG1hdGNoLm5hbWUgPT09IFwiZm9vLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZGlkIG5vdCBtYXRjaCBkaXJlY3RvcnkgbmFtZVwiKVxuXHRcdH1cblx0fSlcbn1cbiIsImV4cG9ydCBjbGFzcyBGaWxlczxGaWxlLCBJbXBsID0gYW55PiB7XG5cdHJlYWRvbmx5IGltcGw6IEltcGw7XG5cdHJlYWRvbmx5IGNyZWF0ZUZpbGU6ICh0aGlzOiBGaWxlczxGaWxlLCBJbXBsPiwgcGF0aDogc3RyaW5nLCBib2R5Pzogc3RyaW5nLCBmcm9udG1hdHRlcj86IEZyb250bWF0dGVyKSA9PiBQcm9taXNlPEZpbGU+O1xuXHRyZWFkb25seSByZWFkRmlsZTogKHRoaXM6IEZpbGVzPEZpbGUsIEltcGw+LCBmaWxlOiBGaWxlKSA9PiBQcm9taXNlPHN0cmluZz47XG5cdHJlYWRvbmx5IGRlbGV0ZUZpbGU6ICh0aGlzOiBGaWxlczxGaWxlLCBJbXBsPiwgZmlsZTogRmlsZSkgPT4gdm9pZDtcblxuXHRjb25zdHJ1Y3RvcihkZWY6IHtcblx0XHRpbXBsOiBhbnksXG5cdFx0Y3JlYXRlRmlsZSh0aGlzOiBGaWxlczxGaWxlLCBJbXBsPiwgcGF0aDogc3RyaW5nLCBib2R5Pzogc3RyaW5nLCBmcm9udG1hdHRlcj86IHtcblx0XHRcdHRhZ3M/OiBBcnJheTxzdHJpbmc+LFxuXHRcdFx0YWxpYXNlcz86IEFycmF5PHN0cmluZz4sXG5cdFx0XHRwcm9wZXJ0aWVzPzogUmVjb3JkPHN0cmluZywgYW55Pixcblx0XHR9KTogUHJvbWlzZTxGaWxlPixcblx0XHRyZWFkRmlsZSh0aGlzOiBGaWxlczxGaWxlLCBJbXBsPiwgZmlsZTogRmlsZSk6IFByb21pc2U8c3RyaW5nPixcblx0XHRkZWxldGVGaWxlKHRoaXM6IEZpbGVzPEZpbGUsIEltcGw+LCBmaWxlOiBGaWxlKTogdm9pZCxcblx0fSkge1xuXHRcdHRoaXMuaW1wbCA9IGRlZi5pbXBsO1xuXHRcdHRoaXMuY3JlYXRlRmlsZSA9IGRlZi5jcmVhdGVGaWxlO1xuXHRcdHRoaXMucmVhZEZpbGUgPSBkZWYucmVhZEZpbGU7XG5cdFx0dGhpcy5kZWxldGVGaWxlID0gZGVmLmRlbGV0ZUZpbGU7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIEZyb250bWF0dGVyIHtcblx0dGFnczogQXJyYXk8c3RyaW5nPjtcblx0YWxpYXNlczogQXJyYXk8c3RyaW5nPjtcblx0Y3NzY2xhc3NlczogQXJyYXk8c3RyaW5nPjtcblx0cHJvcGVydGllczogUmVjb3JkPHN0cmluZywgYW55PjtcblxuXHRjb25zdHJ1Y3RvcihkZWY6IHtcblx0XHR0YWdzPzogQXJyYXk8c3RyaW5nPixcblx0XHRhbGlhc2VzPzogQXJyYXk8c3RyaW5nPixcblx0XHRjc3NjbGFzc2VzPzogQXJyYXk8c3RyaW5nPixcblx0XHRwcm9wZXJ0aWVzPzogUmVjb3JkPHN0cmluZywgYW55Pixcblx0fSkge1xuXHRcdHRoaXMudGFncyA9IGRlZi50YWdzID8/IFtdO1xuXHRcdHRoaXMuYWxpYXNlcyA9IGRlZi5hbGlhc2VzID8/IFtdO1xuXHRcdHRoaXMuY3NzY2xhc3Nlcz0gZGVmLmNzc2NsYXNzZXM/PyBbXTtcblx0XHR0aGlzLnByb3BlcnRpZXMgPSBkZWYucHJvcGVydGllcyA/PyB7fTtcblx0fVxufVxuIiwiaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vLi4vZnJhbWV3b3JrXCI7XG5pbXBvcnQgeyBGcm9udG1hdHRlciwgdHlwZSBGaWxlcyB9IGZyb20gXCIuLi8uLi90ZXN0aW5nL2ZpbGVzXCJcbmltcG9ydCB0eXBlIHsgU2VhcmNoIH0gZnJvbSBcIi4uLy4uL3Rlc3Rpbmcvc2VhcmNoXCJcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gdGVzdFByb3BlcnR5PEY+KFxuXHR0OiB0ZXN0aW5nLlRlc3QsXG5cdGZpbGVzOiBGaWxlczxGPixcblx0c2VhcmNoOiBTZWFyY2gsXG4pIHtcblxuXHRhc3luYyBmdW5jdGlvbiBwcm9wZXJ0eVRlc3QodDogdGVzdGluZy5UZXN0LCBxdWVyeTogc3RyaW5nLFxuXHRcdGV4cGVjdGVkOiBBcnJheTxGcm9udG1hdHRlcj4sXG5cdFx0dW5leHBlY3RlZDogQXJyYXk8RnJvbnRtYXR0ZXI+LFxuXHQpIHtcblx0XHR0LmxvZyh7IHF1ZXJ5IH0pO1xuXG5cdFx0Y29uc3QgZXhwZWN0ZWRfbWF0Y2hlczogQXJyYXk8eyBwYXRoOiBzdHJpbmcsIGZpbGU6IEYgfT4gPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGV4cGVjdGVkLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCBwYXRoID0gYGV4cGVjdGVkICR7aX0ubWRgXG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShwYXRoLCAnJywgZXhwZWN0ZWRbaV0pXG5cdFx0XHRleHBlY3RlZF9tYXRjaGVzLnB1c2goeyBwYXRoLCBmaWxlIH0pO1xuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGUpKTtcblx0XHR9XG5cdFx0Y29uc3QgdW5leHBlY3RlZF9tYXRjaGVzOiBBcnJheTx7IHBhdGg6IHN0cmluZywgZmlsZTogRiB9PiA9IFtdO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdW5leHBlY3RlZC5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgcGF0aCA9IGB1bmV4cGVjdGVkICR7aX0ubWRgXG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShwYXRoLCAnJywgdW5leHBlY3RlZFtpXSlcblx0XHRcdHVuZXhwZWN0ZWRfbWF0Y2hlcy5wdXNoKHsgcGF0aCwgZmlsZSB9KTtcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlKSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IocXVlcnkpO1xuXHRcdHQubG9nKHsgbWF0Y2hlcyB9KVxuXG5cdFx0Zm9yIChjb25zdCB7IHBhdGgsIGZpbGUgfSBvZiBleHBlY3RlZF9tYXRjaGVzKSB7XG5cdFx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5wYXRoID09PSBwYXRoKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKGBkaWQgbm90IGZpbmQgJHtwYXRofSBpbiBtYXRjaGVzYClcblx0XHRcdFx0dC5sb2coXCIgICAgY29udGVudDpcIiwgYXdhaXQgZmlsZXMucmVhZEZpbGUoZmlsZSkpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCB7IHBhdGggfSBvZiB1bmV4cGVjdGVkX21hdGNoZXMpIHtcblx0XHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQucGF0aCA9PT0gcGF0aCkpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChgZXhwZWN0ZWQgTk9UIHRvIGZpbmQgJHtwYXRofSBpbiBtYXRjaGVzYClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR0LnN1aXRlKFwiW3Byb3BlcnR5XVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdHQudGVzdChcIlt0YWdzXVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdFx0dC5sb2coXCJtYXRjaCBmaWxlcyB0aGF0IGhhdmUgdGhlICd0YWdzJyBwcm9wZXJ0eVwiKTtcblx0XHRcdGF3YWl0IHByb3BlcnR5VGVzdCh0LCBcIlt0YWdzXVwiLFxuXHRcdFx0XHQvKiBzaG91bGQgbWF0Y2ggKi9bXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgdGFnczogW1wiZm9vXCJdIH0pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgdGFnczE6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSxcblx0XHRcdFx0Lyogc2hvdWxkIE5PVCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoe30pLFxuXHRcdFx0XHRdKVxuXHRcdH0pXG5cdFx0dC50ZXN0KFwiW2FsaWFzZXNdXCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0XHR0LmxvZyhcIm1hdGNoIGZpbGVzIHRoYXQgaGF2ZSB0aGUgJ2FsaWFzZXMnIHByb3BlcnR5XCIpO1xuXHRcdFx0YXdhaXQgcHJvcGVydHlUZXN0KHQsIFwiW2FsaWFzZXNdXCIsXG5cdFx0XHRcdC8qIHNob3VsZCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBhbGlhc2VzOiBbXCJmb29cIl0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBhbGlhc2VzMTogXCJcIiB9IH0pLFxuXHRcdFx0XHRdLFxuXHRcdFx0XHQvKiBzaG91bGQgTk9UIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7fSksXG5cdFx0XHRcdF0pXG5cdFx0fSlcblx0XHR0LnRlc3QoXCJbY3NzY2xhc3Nlc11cIiwgYXN5bmMgKHQpID0+IHtcblx0XHRcdHQubG9nKFwibWF0Y2ggZmlsZXMgdGhhdCBoYXZlIHRoZSAnY3NzY2xhc3NlcycgcHJvcGVydHlcIik7XG5cdFx0XHRhd2FpdCBwcm9wZXJ0eVRlc3QodCwgXCJbY3NzY2xhc3Nlc11cIixcblx0XHRcdFx0Lyogc2hvdWxkIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IGNzc2NsYXNzZXM6IFtcImZvb1wiXSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IGNzc2NsYXNzZXMxOiBcIlwiIH0gfSksXG5cdFx0XHRcdF0sXG5cdFx0XHRcdC8qIHNob3VsZCBOT1QgbWF0Y2ggKi9bXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHt9KSxcblx0XHRcdFx0XSlcblx0XHR9KVxuXG5cdFx0dC50ZXN0KFwiYXJiaXRyYXJ5IHByb3BlcnR5XCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0XHR0LmxvZyhcIm1hdGNoIGZpbGVzIHRoYXQgaGF2ZSBwcm9wZXJ0eSBuYW1lIGNvbnRhaW5pbmcgJ3Byb3AnXCIpXG5cdFx0XHRhd2FpdCBwcm9wZXJ0eVRlc3QodCwgXCJbcHJvcF1cIixcblx0XHRcdFx0Lyogc2hvdWxkIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDogXCJcIiB9IH0pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDE6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IFwic29tZS1wcm9wXCI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSxcblx0XHRcdFx0Lyogc2hvdWxkIE5PVCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoe30pLFxuXHRcdFx0XHRdKVxuXHRcdH0pXG5cblx0XHR0LnRlc3QoXCJuZWdhdGVkIHByb3BlcnR5IG5hbWVcIiwgYXN5bmMgdCA9PiB7XG5cdFx0XHR0LmxvZyhcIm1hdGNoIGZpbGVzIHRoYXQgaGF2ZSBwcm9wZXJ0eSBuYW1lIE5PVCBjb250YWluaW5nICdwcm9wMSdcIilcblx0XHRcdGF3YWl0IHByb3BlcnR5VGVzdCh0LCBgWy1wcm9wMV1gLFxuXHRcdFx0XHQvKiBzaG91bGQgbWF0Y2ggKi9bXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgdGFnczogW1wiZm9vXCJdIH0pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSxcblx0XHRcdFx0Lyogc2hvdWxkIE5PVCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoe30pLCAvLyBmaWxlIGhhcyBubyBmcm9udG1hdHRlciwgc28gY2hlY2sgaXMgc2tpcHBlZFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDE6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AxMTogXCJcIiB9IH0pLFxuXHRcdFx0XHRdKVxuXHRcdH0pXG5cblx0XHR0LnRlc3QoXCJtdWx0aXBsZSBwcm9wZXJ0eSBuYW1lc1wiLCBhc3luYyB0ID0+IHtcblx0XHRcdHQubG9nKFwibWF0Y2ggZmlsZXMgdGhhdCBoYXZlIHByb3BlcnR5IG5hbWUgY29udGFpbmluZyAncHJvcDEgcHJvcDInXCIpXG5cdFx0XHRhd2FpdCBwcm9wZXJ0eVRlc3QodCwgYFtwcm9wMSBwcm9wMl1gLFxuXHRcdFx0XHQvKiBzaG91bGQgbWF0Y2ggKi9bXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBcInByb3AxIHByb3AyXCI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IFwicHJvcDEgcHJvcDIyXCI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSxcblx0XHRcdFx0Lyogc2hvdWxkIE5PVCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoe30pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDE6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AyOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMTogXCJcIiwgcHJvcDI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AxOiBcIlwiLCBwcm9wMjogXCJcIiwgcHJvcDM6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AxOiBcIlwiLCBwcm9wMzogXCJcIiB9IH0pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDI6IFwiXCIsIHByb3AzOiBcIlwiIH0gfSksXG5cdFx0XHRcdF0pXG5cdFx0fSlcblxuXHRcdHQudGVzdChcImZpcnN0IHByb3AgbmFtZSBuZWdhdGVkXCIsIGFzeW5jIHQgPT4ge1xuXHRcdFx0dC5sb2coXCJtYXRjaCBmaWxlcyB0aGF0IGhhdmUgcHJvcGVydHkgbmFtZSBOT1QgY29udGFpbmluZyAncHJvcDEgcHJvcDInXCIpXG5cdFx0XHRhd2FpdCBwcm9wZXJ0eVRlc3QodCwgYFstcHJvcDEgcHJvcDJdYCxcblx0XHRcdFx0Lyogc2hvdWxkIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDE6IFwiXCIsIHByb3AyOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMjogXCJcIiB9IH0pLFxuXHRcdFx0XHRdLFxuXHRcdFx0XHQvKiBzaG91bGQgTk9UIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7fSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBbXCItcHJvcDEgcHJvcDJcIl06IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IFtcInByb3AxIHByb3AyXCJdOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMTogXCJcIiB9IH0pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgW1wiLXByb3AxXCJdOiBcIlwiIH0gfSksXG5cdFx0XHRcdF0pXG5cdFx0XHR0LmxvZyhcImZpbGVzIHdpdGhvdXQgcHJvcGVydHkgJ3Byb3AxIHByb3AyJyBzaG91bGQgbWF0Y2hcIilcblx0XHR9KVxuXG5cdFx0dC50ZXN0KFwic2Vjb25kIHByb3AgbmFtZSBuZWdhdGVkXCIsIGFzeW5jIHQgPT4ge1xuXHRcdFx0dC5sb2coXCJtYXRjaCBmaWxlcyB3aXRoIHByb3BlcnR5IG5hbWUgY29udGFpbmluZyAncHJvcDEnIChzZWNvbmQgbmVnYXRpb24gYnJlYWtzIHBhcnNlciwgc28gJy1wcm9wMicgaXMgaWdub3JlZClcIilcblx0XHRcdGF3YWl0IHByb3BlcnR5VGVzdCh0LCBgW3Byb3AxIC1wcm9wMl1gLFxuXHRcdFx0XHQvKiBzaG91bGQgbWF0Y2ggKi9bXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMTogXCJcIiwgcHJvcDI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AxOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMTE6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSxcblx0XHRcdFx0Lyogc2hvdWxkIE5PVCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoe30pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IFtcIi1wcm9wMlwiXTogXCJcIiB9IH0pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgW1wicHJvcDEgLXByb3AyXCJdOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBbXCJwcm9wMSBwcm9wMlwiXTogXCJcIiB9IH0pLFxuXHRcdFx0XHRdKVxuXHRcdH0pXG5cblx0XHR0LnRlc3QoXCJncm91cGVkIHByb3BlcnR5IG5hbWVcIiwgYXN5bmMgdCA9PiB7XG5cdFx0XHR0LmxvZyhcIm1hdGNoIGZpbGVzIHRoYXQgaGF2ZSBwcm9wZXJ0eSBuYW1lIGNvbnRhaW5pbmcgJyhwcm9wMSBwcm9wMiknXCIpXG5cdFx0XHRhd2FpdCBwcm9wZXJ0eVRlc3QodCwgYFsocHJvcDEgcHJvcDIpXWAsXG5cdFx0XHRcdC8qIHNob3VsZCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IFwiKHByb3AxIHByb3AyKVwiOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBcIihwcm9wMSBwcm9wMikpXCI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSxcblx0XHRcdFx0Lyogc2hvdWxkIE5PVCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoe30pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDE6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AyOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMTogXCJcIiwgcHJvcDI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSlcblx0XHR9KVxuXG5cdFx0dC50ZXN0KFwibmVnYXRlZCBncm91cGVkIHByb3BlcnR5IG5hbWVcIiwgYXN5bmMgdCA9PiB7XG5cdFx0XHR0LmxvZyhcIm1hdGNoIGZpbGVzIHRoYXQgaGF2ZSBwcm9wZXJ0eSBuYW1lIE5PVCBjb250YWluaW5nICcocHJvcDEgcHJvcDIpJ1wiKVxuXHRcdFx0YXdhaXQgcHJvcGVydHlUZXN0KHQsIGBbLShwcm9wMSBwcm9wMildYCxcblx0XHRcdFx0Lyogc2hvdWxkIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDE6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AyOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMTogXCJcIiwgcHJvcDI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSxcblx0XHRcdFx0Lyogc2hvdWxkIE5PVCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoe30pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgXCIocHJvcDEgcHJvcDIpXCI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSlcblx0XHR9KVxuXG5cdFx0dC50ZXN0KFwiZWl0aGVyIHByb3BlcnR5IG5hbWVcIiwgYXN5bmMgdCA9PiB7XG5cdFx0XHR0LmxvZyhcIm1hdGNoIGZpbGVzIHdpdGggcHJvcGVydHkgbmFtZSBjb250YWluaW5nICdwcm9wMScgb3IgJ3Byb3AyJ1wiKVxuXHRcdFx0YXdhaXQgcHJvcGVydHlUZXN0KHQsIGBbcHJvcDEgT1IgcHJvcDJdYCxcblx0XHRcdFx0Lyogc2hvdWxkIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDE6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AyOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMTogXCJcIiwgcHJvcDI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSxcblx0XHRcdFx0Lyogc2hvdWxkIE5PVCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoe30pLFxuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDM6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSlcblx0XHR9KVxuXG5cdFx0dC50ZXN0KFwibmVnYXRlZCBlaXRoZXIgcHJvcGVydHkgbmFtZVwiLCBhc3luYyB0ID0+IHtcblx0XHRcdHQubG9nKFwibWF0Y2ggZmlsZXMgd2l0aCBwcm9wZXJ0eSBuYW1lIE5PVCBjb250YWluaW5nICdwcm9wMScgb3IgY29udGFpbmluZyAncHJvcDInXCIpXG5cdFx0XHRhd2FpdCBwcm9wZXJ0eVRlc3QodCwgYFstcHJvcDEgT1IgcHJvcDJdYCxcblx0XHRcdFx0Lyogc2hvdWxkIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AxOiBcIlwiLCBwcm9wMjogXCJcIiB9IH0pLCAvLyBPUiBjb250YWluaW5nIHByb3AyXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMTogXCJcIiwgcHJvcDIyOiBcIlwiIH0gfSksIC8vIE9SIGNvbnRhaW5pbmcgcHJvcDJcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AzOiBcIlwiIH0gfSksIC8vIGRvZXMgTk9UIGNvbnRhaW4gcHJvcDFcblx0XHRcdFx0XSxcblx0XHRcdFx0Lyogc2hvdWxkIE5PVCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoe30pLCAvLyBubyBmcm9udG1hdHRlciBpcyBhbHdheXMgYSBub24tbWF0Y2hcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AxOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMTE6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSlcblx0XHR9KVxuXG5cdFx0dC50ZXN0KFwiZWl0aGVyIHByb3BlcnR5IG5hbWUsIGJ1dCBzZWNvbmQgaXMgbmVnYXRlZFwiLCBhc3luYyB0ID0+IHtcblx0XHRcdHQubG9nKFwibWF0Y2ggZmlsZXMgd2l0aCBwcm9wZXJ0eSBuYW1lIGNvbnRhaW5pbmcgJ3Byb3AxJyBvciBOT1QgY29udGFpbmluZyAncHJvcDInXCIpXG5cdFx0XHRhd2FpdCBwcm9wZXJ0eVRlc3QodCwgYFtwcm9wMSBPUiAtcHJvcDJdYCxcblx0XHRcdFx0Lyogc2hvdWxkIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDE6IFwiXCIgfSB9KSwgLy8gY29udGFpbnMgcHJvcDFcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AxOiBcIlwiLCBwcm9wMjogXCJcIiB9IH0pLCAvLyBPUiBjb250YWluaW5nIHByb3AxXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMTE6IFwiXCIsIHByb3AyOiBcIlwiIH0gfSksIC8vIE9SIGNvbnRhaW5pbmcgcHJvcDFcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AzOiBcIlwiIH0gfSksIC8vIGRvZXMgTk9UIGNvbnRhaW4gcHJvcDJcblx0XHRcdFx0XSxcblx0XHRcdFx0Lyogc2hvdWxkIE5PVCBtYXRjaCAqL1tcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoe30pLCAvLyBubyBmcm9udG1hdHRlciBpcyBhbHdheXMgYSBub24tbWF0Y2hcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AyOiBcIlwiIH0gfSksXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMjI6IFwiXCIgfSB9KSxcblx0XHRcdFx0XSlcblx0XHR9KVxuXG5cdFx0dC50ZXN0KFwiZ3JvdXBpbmcgYWZ0ZXIgT1JcIiwgYXN5bmMgdCA9PiB7XG5cdFx0XHR0LmxvZyhcIm1hdGNoIGZpbGVzIHdpdGggcHJvcGVydHkgbmFtZSBjb250YWluaW5nICdwcm9wMScgb3IgY29udGFpbmluZyAnKHByb3AyIHByb3AzKSdcIilcblx0XHRcdGF3YWl0IHByb3BlcnR5VGVzdCh0LCBgW3Byb3AxIE9SIChwcm9wMiBwcm9wMyldYCxcblx0XHRcdFx0Lyogc2hvdWxkIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDE6IFwiXCIgfSB9KSwgLy8gY29udGFpbnMgcHJvcDFcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IFwiKHByb3AyIHByb3AzKVwiOiBcIlwiIH0gfSksIC8vIGNvbnRhaW5zIFwiKHByb3AyIHByb3AzKVwiXG5cdFx0XHRcdF0sXG5cdFx0XHRcdC8qIHNob3VsZCBOT1QgbWF0Y2ggKi9bXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHt9KSwgLy8gbm8gZnJvbnRtYXR0ZXIgaXMgYWx3YXlzIGEgbm9uLW1hdGNoXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMjogXCJcIiwgcHJvcDM6IFwiXCIgfSB9KSwgLy8gZ3JvdXAgaXMgbm90IHRyZWF0ZWQgYXMgQU5EXG5cdFx0XHRcdF0pXG5cdFx0fSlcblx0XHR0LnRlc3QoXCJlaXRoZXIgb2YgdGhyZWUgcHJvcGVydHkgbmFtZXNcIiwgYXN5bmMgdCA9PiB7XG5cdFx0XHR0LmxvZyhcIm1hdGNoIGZpbGVzIHdpdGggcHJvcGVydHkgbmFtZSBjb250YWluaW5nICdwcm9wMScsICdwcm9wMicgb3IgJ3Byb3AzJ1wiKVxuXHRcdFx0YXdhaXQgcHJvcGVydHlUZXN0KHQsIGBbcHJvcDEgT1IgcHJvcDIgT1IgcHJvcDNdYCxcblx0XHRcdFx0Lyogc2hvdWxkIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDE6IFwiXCIgfSB9KSwgLy8gY29udGFpbnMgcHJvcDFcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AyOiBcIlwiIH0gfSksIC8vIGNvbnRhaW5zIHByb3AyXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMzogXCJcIiB9IH0pLCAvLyBjb250YWlucyBwcm9wM1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDExOiBcIlwiIH0gfSksIC8vIGNvbnRhaW5zIHByb3AyXG5cdFx0XHRcdFx0bmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wMjI6IFwiXCIgfSB9KSwgLy8gY29udGFpbnMgcHJvcDJcblx0XHRcdFx0XHRuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3AzMzogXCJcIiB9IH0pLCAvLyBjb250YWlucyBwcm9wMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHQvKiBzaG91bGQgTk9UIG1hdGNoICovW1xuXHRcdFx0XHRcdG5ldyBGcm9udG1hdHRlcih7fSksIC8vIG5vIGZyb250bWF0dGVyIGlzIGFsd2F5cyBhIG5vbi1tYXRjaFxuXHRcdFx0XHRdKVxuXHRcdH0pXG5cblxuXHR9KVxuXG5cdHQuc3VpdGUoXCJbcHJvcGVydHk6dmFsdWVdXCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0dC50ZXN0KFwiW2FsaWFzZXM6TmFtZV1cIiwgYXN5bmMgKHQpID0+IHtcblx0XHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdC5tZFwiLCBcIlwiLCBuZXcgRnJvbnRtYXR0ZXIoe1xuXHRcdFx0XHRhbGlhc2VzOiBbXG5cdFx0XHRcdFx0XCJOYW1lXCJcblx0XHRcdFx0XSxcblx0XHRcdH0pKTtcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlKSlcblxuXHRcdFx0Y29uc3Qgbm9uX21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QxLm1kXCIsIFwiXCIsIG5ldyBGcm9udG1hdHRlcih7XG5cdFx0XHRcdGFsaWFzZXM6IFtcblx0XHRcdFx0XHRcIk90aGVyXCJcblx0XHRcdFx0XSxcblx0XHRcdH0pKTtcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShub25fbWF0Y2gpKTtcblxuXHRcdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IoXCJbYWxpYXNlczpOYW1lXVwiKTtcblxuXHRcdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoXCJleHBlY3RlZCB0byBmaW5kICd0ZXN0Lm1kJyBpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblx0XHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgTk9UIHRvIGZpbmQgJ3Rlc3QxLm1kJyBpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblx0XHR9KVxuXG5cdFx0dC50ZXN0KFwiW2FsaWFzZXM6dmFsdWUxIE9SIHZhbHVlMl1cIiwgYXN5bmMgdCA9PiB7XG5cdFx0XHRjb25zdCBtYXRjaDEgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdC5tZFwiLCBcIlwiLCBuZXcgRnJvbnRtYXR0ZXIoe1xuXHRcdFx0XHRhbGlhc2VzOiBbXG5cdFx0XHRcdFx0XCJ2YWx1ZTFcIlxuXHRcdFx0XHRdXG5cdFx0XHR9KSlcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShtYXRjaDEpKTtcblxuXHRcdFx0Y29uc3QgbWF0Y2gyID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QxLm1kXCIsIFwiXCIsIG5ldyBGcm9udG1hdHRlcih7XG5cdFx0XHRcdGFsaWFzZXM6IFtcblx0XHRcdFx0XHRcInZhbHVlMlwiXG5cdFx0XHRcdF1cblx0XHRcdH0pKVxuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKG1hdGNoMikpO1xuXG5cdFx0XHRjb25zdCBub25fbWF0Y2ggPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdDIubWRcIiwgXCJcIiwgbmV3IEZyb250bWF0dGVyKHtcblx0XHRcdFx0YWxpYXNlczogW1xuXHRcdFx0XHRcdFwidmFsdWUzXCJcblx0XHRcdFx0XVxuXHRcdFx0fSkpXG5cdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUobm9uX21hdGNoKSk7XG5cblx0XHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBzZWFyY2guc2VhcmNoRm9yKFwiW2FsaWFzZXM6dmFsdWUxIE9SIHZhbHVlMl1cIik7XG5cblx0XHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgdG8gZmluZCB0ZXN0Lm1kIGluXCIsIG1hdGNoZXMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgdG8gZmluZCAndGVzdDEubWQnIGluXCIsIG1hdGNoZXMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKG1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRlc3QzLm1kXCIpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoXCJleHBlY3RlZCBOT1QgdG8gZmluZCAndGVzdDMubWQnIGluXCIsIG1hdGNoZXMpO1xuXHRcdFx0fVxuXG5cdFx0fSlcblxuXHRcdGNvbnN0IGtleXdvcmRzID0gW1xuXHRcdFx0YGZpbGVgLFxuXHRcdFx0YHBhdGhgLFxuXHRcdFx0YGNvbnRlbnRgLFxuXHRcdFx0YHRhZ2AsXG5cdFx0XHRgaWdub3JlLWNhc2VgLFxuXHRcdFx0YG1hdGNoLWNhc2VgLFxuXHRcdFx0YGJsb2NrYCxcblx0XHRcdGBsaW5lYCxcblx0XHRcdGBzZWN0aW9uYCxcblx0XHRcdGB0YXNrYCxcblx0XHRcdGB0YXNrLXRvZG9gLFxuXHRcdFx0YHRhc2stZG9uZWBcblx0XHRdO1xuXHRcdHQuc3VpdGUoXCJrZXl3b3JkIGFzIHByb3BlcnR5IG5hbWVcIiwgYXN5bmMgcnVuID0+IHtcblx0XHRcdGZvciAoY29uc3Qga2V5d29yZCBvZiBrZXl3b3Jkcykge1xuXHRcdFx0XHRydW4uc3VpdGUoYGtleXdvcmQgJyR7a2V5d29yZH0nYCwgYXN5bmMgcnVuID0+IHtcblx0XHRcdFx0XHRmb3IgKGNvbnN0IHF1ZXJ5IG9mIFtcblx0XHRcdFx0XHRcdGBbJHtrZXl3b3JkfV1gLCBgWyR7a2V5d29yZH06XWAsIGBbJHtrZXl3b3JkfTp2YWx1ZV1gXG5cdFx0XHRcdFx0XSkge1xuXHRcdFx0XHRcdFx0cnVuLnRlc3QocXVlcnksIGFzeW5jIHQgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcImZpbGUubWRcIiwgXCJcIiwgbmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBba2V5d29yZF06IFwidmFsdWVcIiB9IH0pKTtcblx0XHRcdFx0XHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGUpKVxuXG5cdFx0XHRcdFx0XHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBzZWFyY2guc2VhcmNoRm9yKHF1ZXJ5KVxuXHRcdFx0XHRcdFx0XHR0LmxvZyhcIm1hdGNoZXM6XCIsIG1hdGNoZXMpXG5cblx0XHRcdFx0XHRcdFx0aWYgKG1hdGNoZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0dC5mYWlsV2l0aChcInNob3VsZCBoYXZlIGZvdW5kIGZpbGUgd2l0aCBwcm9wZXJ0eVwiKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9KVxuXG5cdFx0dC5zdWl0ZShcImtleXdvcmQgaW4gcHJvcGVydHkgdmFsdWVcIiwgYXN5bmMgdCA9PiB7XG5cdFx0XHRmb3IgKGNvbnN0IGtleXdvcmQgb2Yga2V5d29yZHMpIHtcblx0XHRcdFx0Y29uc3QgcXVlcnkgPSBgW3Byb3A6JHtrZXl3b3JkfV1gXG5cdFx0XHRcdHQudGVzdChxdWVyeSwgYXN5bmMgdCA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgZmlsZTEgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKGAke2tleXdvcmR9Lm1kYCwgXCJcIiwgbmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wOiBgJHtrZXl3b3JkfWAgfSB9KSk7XG5cdFx0XHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGUxKSlcblx0XHRcdFx0XHRjb25zdCBmaWxlMiA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoYCR7a2V5d29yZH1fdmFsdWUubWRgLCBcIlwiLCBuZXcgRnJvbnRtYXR0ZXIoeyBwcm9wZXJ0aWVzOiB7IHByb3A6IGAke2tleXdvcmR9OnZhbHVlYCB9IH0pKTtcblx0XHRcdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZTIpKVxuXHRcdFx0XHRcdGNvbnN0IGZpbGUzID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShgcHJvcF8ke2tleXdvcmR9Lm1kYCwgXCJcIiwgbmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBbYHByb3A6JHtrZXl3b3JkfWBdOiBgdmFsdWVgIH0gfSkpO1xuXHRcdFx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlMykpXG5cblx0XHRcdFx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSlcblx0XHRcdFx0XHR0LmxvZyhcIm1hdGNoZXM6XCIsIG1hdGNoZXMpXG5cblx0XHRcdFx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBgJHtrZXl3b3JkfS5tZGApKSB7XG5cdFx0XHRcdFx0XHR0LmZhaWxXaXRoKFwic2hvdWxkIGhhdmUgbWF0Y2hlZCBhZ2FpbnN0IGZpbGUgd2l0aCBrZXl3b3JkIGFzIHRoZSBwcm9wZXJ0eSB2YWx1ZVwiKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBgJHtrZXl3b3JkfV92YWx1ZS5tZGApKSB7XG5cdFx0XHRcdFx0XHR0LmZhaWxXaXRoKFwic2hvdWxkIGhhdmUgbWF0Y2hlZCBhZ2FpbnN0IGZpbGUgd2l0aCBrZXl3b3JkIElOIHRoZSBwcm9wZXJ0eSB2YWx1ZVwiKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IGBwcm9wXyR7a2V5d29yZH0ubWRgKSkge1xuXHRcdFx0XHRcdFx0dC5mYWlsV2l0aChcInNob3VsZCBOT1QgaGF2ZSBtYXRjaGVkIGFnYWluc3QgZmlsZSB3aXRoIGtleXdvcmQgaW4gcHJvcGVydHkgbmFtZVxcblwiICtcblx0XHRcdFx0XHRcdFx0XCIoZmlyc3QgY29sb24gaXMgdHJlYXRlZCBhcyB0aGUgZGVsaW5lYXRpb24gYmV0d2VlbiBwcm9wIG5hbWUgYW5kIHZhbHVlKVwiKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0Y29uc3QgcXVlcnkxID0gYFtwcm9wOiR7a2V5d29yZH06dmFsdWVdYFxuXHRcdFx0XHR0LnRlc3QocXVlcnkxLCBhc3luYyB0ID0+IHtcblx0XHRcdFx0XHR0LnNraXAoKTtcblxuXHRcdFx0XHRcdGNvbnN0IGZpbGUxID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShgJHtrZXl3b3JkfS5tZGAsIFwiXCIsIG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgcHJvcDogYCR7a2V5d29yZH1gIH0gfSkpO1xuXHRcdFx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlMSkpXG5cdFx0XHRcdFx0Y29uc3QgZmlsZTIgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKGAke2tleXdvcmR9X3ZhbHVlLm1kYCwgXCJcIiwgbmV3IEZyb250bWF0dGVyKHsgcHJvcGVydGllczogeyBwcm9wOiBgJHtrZXl3b3JkfTp2YWx1ZWAgfSB9KSk7XG5cdFx0XHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGUyKSlcblx0XHRcdFx0XHRjb25zdCBmaWxlMyA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoYHByb3BfJHtrZXl3b3JkfS5tZGAsIFwiXCIsIG5ldyBGcm9udG1hdHRlcih7IHByb3BlcnRpZXM6IHsgW2Bwcm9wOiR7a2V5d29yZH1gXTogYHZhbHVlYCB9IH0pKTtcblx0XHRcdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZTMpKVxuXG5cdFx0XHRcdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IocXVlcnkxKVxuXHRcdFx0XHRcdHQubG9nKFwibWF0Y2hlczpcIiwgbWF0Y2hlcylcblxuXHRcdFx0XHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IGAke2tleXdvcmR9Lm1kYCkpIHtcblx0XHRcdFx0XHRcdHQuZmFpbFdpdGgoYHNob3VsZCBoYXZlIG1hdGNoZWQgYWdhaW5zdCBmaWxlIHdpdGgganVzdCBrZXl3b3JkIGluIHByb3BlcnR5IHZhbHVlIChjb2xvbiBtYWtlcyBzZWFyY2ggYW1iaWd1b3VzKVxcbmAgK1xuXHRcdFx0XHRcdFx0XHRgZXhwZWN0ZWQgZmlsZTpgLCBhd2FpdCBmaWxlcy5yZWFkRmlsZShmaWxlMSkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBgJHtrZXl3b3JkfV92YWx1ZS5tZGApKSB7XG5cdFx0XHRcdFx0XHR0LmZhaWxXaXRoKGBzaG91bGQgaGF2ZSBtYXRjaGVkIGFnYWluc3QgZmlsZSB3aXRoICcke2tleXdvcmR9OnZhbHVlJyBJTiB0aGUgcHJvcGVydHkgdmFsdWVgKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IGBwcm9wXyR7a2V5d29yZH0ubWRgKSkge1xuXHRcdFx0XHRcdFx0dC5mYWlsV2l0aChcInNob3VsZCBOT1QgaGF2ZSBtYXRjaGVkIGFnYWluc3QgZmlsZSB3aXRoIGtleXdvcmQgaW4gcHJvcGVydHkgbmFtZVxcblwiICtcblx0XHRcdFx0XHRcdFx0XCIoZmlyc3QgY29sb24gaXMgdHJlYXRlZCBhcyB0aGUgZGVsaW5lYXRpb24gYmV0d2VlbiBwcm9wIG5hbWUgYW5kIHZhbHVlKVwiKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9KVxuXHR9KVxuXG59XG5cbiIsIlxuZXhwb3J0IGZ1bmN0aW9uIHRyaW1JbmRlbnQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBsaW5lcyA9IHN0ci5zcGxpdChcIlxcblwiKVxuXHRjb25zdCBmaXJzdF9pbmRleCA9IGxpbmVzLmZpbmRJbmRleChpdCA9PiBpdC5sZW5ndGggPiAwICYmIGl0ICE9PSBcIlxcblwiKTtcblx0aWYgKGZpcnN0X2luZGV4IDwgMCkge1xuXHRcdHJldHVybiBzdHI7XG5cdH1cblx0Y29uc3QgZmlyc3QgPSBsaW5lc1tmaXJzdF9pbmRleF07XG5cdGNvbnN0IHdoaXRlc3BhY2UgPSBmaXJzdC5sZW5ndGggLSBmaXJzdC50cmltU3RhcnQoKS5sZW5ndGhcblx0cmV0dXJuIGxpbmVzLnNsaWNlKGZpcnN0X2luZGV4KS5tYXAoaXQgPT4gaXQuc3Vic3RyaW5nKHdoaXRlc3BhY2UpKS5qb2luKFwiXFxuXCIpO1xufVxuIiwiaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vLi4vZnJhbWV3b3JrXCI7XG5pbXBvcnQgeyBGcm9udG1hdHRlciwgdHlwZSBGaWxlcyB9IGZyb20gXCIuLi8uLi90ZXN0aW5nL2ZpbGVzXCJcbmltcG9ydCB0eXBlIHsgU2VhcmNoIH0gZnJvbSBcIi4uLy4uL3Rlc3Rpbmcvc2VhcmNoXCJcbmltcG9ydCB7IHRyaW1JbmRlbnQgfSBmcm9tIFwic3JjL2xpYi9zdHJpbmdzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIDxGaWxlPihydW46IHRlc3RpbmcuVGVzdCwgb2JzaWRpYW46IEZpbGVzPEZpbGU+LCBzZWFyY2g6IFNlYXJjaCkge1xuXHRydW4udGVzdChcInRhZ3MgaW4gYm9keVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdGNvbnN0IHRhZ2dlZCA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ0YWdnZWQubWRcIiwgXCIjbWVldGluZ1wiKTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUodGFnZ2VkKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihcInRhZzojbWVldGluZ1wiKTtcblxuXHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGFnZ2VkLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwidGFnZ2VkLm1kIGhhcyB0YWcgJyNtZWV0aW5nJyBpbiBib2R5LCBidXQgaXQgd2FzIG5vdCBmb3VuZCBpblwiLCBtYXRjaGVzKVxuXHRcdH1cblx0fSlcblxuXHRydW4udGVzdChcInByZWZpeGVkIHRhZ3MgaW4gZnJvbnRtYXR0ZXJcIiwgYXN5bmMgKHQpID0+IHtcblx0XHRjb25zdCB0YWdnZWQgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwidGFnZ2VkLm1kXCIsIFwiXCIsIG5ldyBGcm9udG1hdHRlcih7XG5cdFx0XHR0YWdzOiBbXCIjbWVldGluZ1wiXVxuXHRcdH0pKTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUodGFnZ2VkKSk7XG5cdFx0Y29uc3QgY29udGVudCA9IGF3YWl0IG9ic2lkaWFuLnJlYWRGaWxlKHRhZ2dlZCk7XG5cdFx0dC5sb2coXCJ0YWdnZWQubWRcIiwgY29udGVudClcblxuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBzZWFyY2guc2VhcmNoRm9yKFwidGFnOiNtZWV0aW5nXCIpO1xuXG5cdFx0aWYgKG1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRhZ2dlZC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcInRhZ3Mgb2YgYSBmaWxlIGRvIG5vdCBoYXZlIGhhc2hlcyBhdCB0aGUgc3RhcnQsIHNvIHRoZSBmb2xsb3dpbmcgc2hvdWxkIE5PVCBtYXRjaFwiLCBtYXRjaGVzKVxuXHRcdH1cblx0fSlcblxuXHRydW4udGVzdChcInJhdyB0YWcgaW4gZnJvbnRtYXR0ZXJcIiwgYXN5bmMgKHQpID0+IHtcblx0XHRjb25zdCB0YWdnZWQgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwidGFnZ2VkLm1kXCIsIFwiXCIsIG5ldyBGcm9udG1hdHRlcih7XG5cdFx0XHR0YWdzOiBbXCJtZWV0aW5nXCJdXG5cdFx0fSkpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZSh0YWdnZWQpKTtcblxuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBzZWFyY2guc2VhcmNoRm9yKFwidGFnOiNtZWV0aW5nXCIpO1xuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0YWdnZWQubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJ0YWdnZWQubWQgaGFzIHRhZyAnbWVldGluZycgaW4gZnJvbnRtYXR0ZXIsIGJ1dCBpdCB3YXMgbm90IGZvdW5kIGluXCIsIG1hdGNoZXMpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwibm8gaGFzaCBhZnRlciB0YWcgb3BlcmF0b3JcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgdGFnZ2VkID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcInRhZ2dlZC5tZFwiLCBcIlwiLCBuZXcgRnJvbnRtYXR0ZXIoeyB0YWdzOiBbXCJtZWV0aW5nXCJdIH0pKTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUodGFnZ2VkKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihcInRhZzptZWV0aW5nXCIpO1xuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0YWdnZWQubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJ0YWdnZWQubWQgaGFzIHRhZyAnbWVldGluZycgaW4gZnJvbnRtYXR0ZXIsIGJ1dCBpdCB3YXMgbm90IGZvdW5kIGluXCIsIG1hdGNoZXMpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwidGFnIGluIGNvZGVibG9ja1wiLCBhc3luYyAodCkgPT4ge1xuXHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwidGFnZ2VkIGluIGNvZGVibG9jay5tZFwiLCB0cmltSW5kZW50KGBcblx0XHRcdFxcYFxcYFxcYFxuXHRcdFx0I21lZXRpbmdcblx0XHRcdFxcYFxcYFxcYFxuXHRcdGApKTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUoZmlsZSkpXG5cblx0XHRjb25zdCByYXdfbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IoXCIjbWVldGluZ1wiKTtcblx0XHRjb25zdCB0YWdfbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IoXCJ0YWc6I21lZXRpbmdcIik7XG5cdFx0Y29uc3Qgbm9faGFzaCA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IoXCJ0YWc6bWVldGluZ1wiKTtcblxuXHRcdGlmICghcmF3X21hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRhZ2dlZCBpbiBjb2RlYmxvY2subWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJyYXcgc2VhcmNoIGZvciAnI21lZXRpbmcnIGRpZCBub3QgZmluZCBmaWxlIHdpdGggJyNtZWV0aW5nJyBpbiBjb2RlYmxvY2tcIilcblx0XHR9XG5cdFx0aWYgKHRhZ19tYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0YWdnZWQgaW4gY29kZWJsb2NrLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwidGFnIHNlYXJjaCBmb3IgJyNtZWV0aW5nJyBpbmNvcnJlY3RseSBtYXRjaGVkIGZpbGUgd2l0aCAnI21lZXRpbmcnIGluIGNvZGVibG9ja1wiKVxuXHRcdH1cblx0XHRpZiAobm9faGFzaC5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGFnZ2VkIGluIGNvZGVibG9jay5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcInRhZyBzZWFyY2ggZm9yICcjbWVldGluZycgaW5jb3JyZWN0bHkgbWF0Y2hlZCBmaWxlIHdpdGggJyNtZWV0aW5nJyBpbiBjb2RlYmxvY2tcIilcblx0XHR9XG5cdH0pXG5cblx0cnVuLnRlc3QoXCJncm91cGVkIHRhZyBxdWVyeVwiLCBhc3luYyAodDogdGVzdGluZy5UZXN0KSA9PiB7XG5cdFx0Y29uc3QgcXVlcnkgPSBcInRhZzoobWVldGluZyBwZXJzb25hbClcIjtcblx0XHR0LmxvZyhcInF1ZXJ5OlwiLCBxdWVyeSlcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSlcblx0XHR0LmxvZyhcIm1hdGNoZXM6XCIsIG1hdGNoZXMpXG5cblx0XHRjb25zdCBleHBlY3RlZF9tZXNzYWdlID0gYE9wZXJhdG9yIFwidGFnXCIgY2FuIG9ubHkgYmUgZm9sbG93ZWQgYnkgdGV4dGA7XG5cdFx0Y29uc3QgbG9nZ2VkX2Vycm9yID0gdC5sb2dzLmZpbmRMYXN0KGl0ID0+IGl0LmFyZ3Muc29tZShpdCA9PiBpdC5pbmNsdWRlcyhleHBlY3RlZF9tZXNzYWdlKSkpO1xuXHRcdGlmICghbG9nZ2VkX2Vycm9yKSB7XG5cdFx0XHR0LmZhaWxOb3dXaXRoKFwiZXhwZWN0ZWQgc2VhcmNoIHRvIGhhdmUgbG9nZ2VkIGFuIGVycm9yXCIpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwibmVnYXRlZCB0YWcgc3VicXVlcnlcIiwgYXN5bmMgKHQ6IHRlc3RpbmcuVGVzdCkgPT4ge1xuXHRcdGNvbnN0IHF1ZXJ5ID0gXCJ0YWc6LXBlcnNvbmFsXCI7XG5cdFx0dC5sb2coXCJxdWVyeTpcIiwgcXVlcnkpXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IocXVlcnkpXG5cdFx0dC5sb2coXCJtYXRjaGVzOlwiLCBtYXRjaGVzKVxuXG5cdFx0Y29uc3QgZXhwZWN0ZWRfbWVzc2FnZSA9IGBPcGVyYXRvciBcInRhZ1wiIGNhbiBvbmx5IGJlIGZvbGxvd2VkIGJ5IHRleHRgO1xuXHRcdGNvbnN0IGxvZ2dlZF9lcnJvciA9IHQubG9ncy5maW5kTGFzdChpdCA9PiBpdC5hcmdzLnNvbWUoaXQgPT4gaXQuaW5jbHVkZXMoZXhwZWN0ZWRfbWVzc2FnZSkpKTtcblx0XHRpZiAoIWxvZ2dlZF9lcnJvcikge1xuXHRcdFx0dC5mYWlsTm93V2l0aChcImV4cGVjdGVkIHNlYXJjaCB0byBoYXZlIGxvZ2dlZCBhbiBlcnJvclwiKVxuXHRcdH1cblx0fSlcblxuXHRydW4udGVzdChcIm9wZXJhdG9yIGluIHRhZyBzdWJxdWVyeVwiLCBhc3luYyAodDogdGVzdGluZy5UZXN0KSA9PiB7XG5cdFx0Y29uc3QgcXVlcnkgPSBcInRhZzptYXRjaC1jYXNlOndvcmRcIjtcblx0XHR0LmxvZyhcInF1ZXJ5OlwiLCBxdWVyeSlcblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihxdWVyeSlcblx0XHR0LmxvZyhcIm1hdGNoZXM6XCIsIG1hdGNoZXMpXG5cblx0XHRjb25zdCBleHBlY3RlZF9tZXNzYWdlID0gYE9wZXJhdG9yIFwidGFnXCIgY2FuIG9ubHkgYmUgZm9sbG93ZWQgYnkgdGV4dGA7XG5cdFx0Y29uc3QgbG9nZ2VkX2Vycm9yID0gdC5sb2dzLmZpbmRMYXN0KGl0ID0+IGl0LmFyZ3Muc29tZShpdCA9PiBpdC5pbmNsdWRlcyhleHBlY3RlZF9tZXNzYWdlKSkpO1xuXHRcdGlmICghbG9nZ2VkX2Vycm9yKSB7XG5cdFx0XHR0LmZhaWxOb3dXaXRoKFwiZXhwZWN0ZWQgc2VhcmNoIHRvIGhhdmUgbG9nZ2VkIGFuIGVycm9yXCIpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwicGhyYXNlIGFzIHRhZyBzdWJxdWVyeVwiLCBhc3luYyAodDogdGVzdGluZy5UZXN0KSA9PiB7XG5cdFx0Y29uc3QgcXVlcnkgPSBgdGFnOlwic29tZSBwaHJhc2VcImA7XG5cdFx0dC5sb2coXCJxdWVyeTpcIiwgcXVlcnkpXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IocXVlcnkpXG5cdFx0dC5sb2coXCJtYXRjaGVzOlwiLCBtYXRjaGVzKVxuXG5cdFx0Y29uc3QgZXhwZWN0ZWRfbWVzc2FnZSA9IGBPcGVyYXRvciBcInRhZ1wiIGNhbiBvbmx5IGJlIGZvbGxvd2VkIGJ5IHRleHRgO1xuXHRcdGNvbnN0IGxvZ2dlZF9lcnJvciA9IHQubG9ncy5maW5kTGFzdChpdCA9PiBpdC5hcmdzLnNvbWUoaXQgPT4gaXQuaW5jbHVkZXMoZXhwZWN0ZWRfbWVzc2FnZSkpKTtcblx0XHRpZiAoIWxvZ2dlZF9lcnJvcikge1xuXHRcdFx0dC5mYWlsTm93V2l0aChcImV4cGVjdGVkIHNlYXJjaCB0byBoYXZlIGxvZ2dlZCBhbiBlcnJvclwiKVxuXHRcdH1cblx0fSlcblxuXHRydW4udGVzdChcInJlZ2V4IGFzIHRhZyBzdWJxdWVyeVwiLCBhc3luYyAodDogdGVzdGluZy5UZXN0KSA9PiB7XG5cdFx0Y29uc3QgcXVlcnkgPSBgdGFnOi9zb21lIHJlZ2V4L2A7XG5cdFx0dC5sb2coXCJxdWVyeTpcIiwgcXVlcnkpXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IHNlYXJjaC5zZWFyY2hGb3IocXVlcnkpXG5cdFx0dC5sb2coXCJtYXRjaGVzOlwiLCBtYXRjaGVzKVxuXG5cdFx0Y29uc3QgZXhwZWN0ZWRfbWVzc2FnZSA9IGBPcGVyYXRvciBcInRhZ1wiIGNhbiBvbmx5IGJlIGZvbGxvd2VkIGJ5IHRleHRgO1xuXHRcdGNvbnN0IGxvZ2dlZF9lcnJvciA9IHQubG9ncy5maW5kTGFzdChpdCA9PiBpdC5hcmdzLnNvbWUoaXQgPT4gaXQuaW5jbHVkZXMoZXhwZWN0ZWRfbWVzc2FnZSkpKTtcblx0XHRpZiAoIWxvZ2dlZF9lcnJvcikge1xuXHRcdFx0dC5mYWlsTm93V2l0aChcImV4cGVjdGVkIHNlYXJjaCB0byBoYXZlIGxvZ2dlZCBhbiBlcnJvclwiKVxuXHRcdH1cblx0fSlcblxuXG5cbn1cbiIsImltcG9ydCAqIGFzIHRlc3RpbmcgZnJvbSBcIi4uLy4uL2ZyYW1ld29ya1wiO1xuaW1wb3J0IHsgRmlsZXMgfSBmcm9tIFwiLi4vLi4vdGVzdGluZy9maWxlc1wiO1xuaW1wb3J0IHsgU2VhcmNoIH0gZnJvbSBcIi4uLy4uL3Rlc3Rpbmcvc2VhcmNoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIDxGaWxlPih0OiB0ZXN0aW5nLlRlc3QsIGZpbGVzOiBGaWxlczxGaWxlPiwgc2VhcmNoOiBTZWFyY2gpIHtcblx0dC50ZXN0KFwid29yZCBpbiBib2R5XCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0Y29uc3QgZmlsZV93aXRoX21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgXCJmb29cIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGVfd2l0aF9tYXRjaCkpO1xuXG5cdFx0Y29uc3QgZmlsZV93aXRob3V0X21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QxLm1kXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX3dpdGhvdXRfbWF0Y2gpKTtcblxuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBzZWFyY2guc2VhcmNoRm9yKFwiZm9vXCIpXG5cblx0XHRpZiAoIW1hdGNoZXMuc29tZShtYXRjaCA9PiBtYXRjaC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdHQubG9nKFwiZXhwZWN0ZWQgdG8gZmluZCAndGVzdC5tZCcgaW4gbWF0Y2hlc1wiLCBtYXRjaGVzKTtcblx0XHRcdHQuZmFpbCgpO1xuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKG1hdGNoID0+IG1hdGNoLm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdHQubG9nKFwiZXhwZWN0ZWQgTk9UIHRvIGZpbmQgJ3Rlc3QxLm1kJyBpbiBtYXRjaGVzXCIsIG1hdGNoZXMpO1xuXHRcdFx0dC5mYWlsKCk7XG5cdFx0fVxuXHR9KVxuXG5cdHQudGVzdChcInBocmFzZSBpbiBib2R5XCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0Y29uc3QgZmlsZV93aXRoX21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgXCJmb28gYmFyXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX3dpdGhfbWF0Y2gpKTtcblxuXHRcdGNvbnN0IGZpbGVfd2l0aG91dF9tYXRjaCA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0MS5tZFwiLCBcImZvb1wiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZV93aXRob3V0X21hdGNoKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihgXCJmb28gYmFyXCJgKVxuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgdG8gZmluZCAndGVzdC5tZCcgaW5cIiwgbWF0Y2hlcylcblx0XHR9XG5cdFx0aWYgKG1hdGNoZXMuc29tZShtYXRjaCA9PiBtYXRjaC5uYW1lID09PSBcInRlc3QxLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgTk9UIHRvIGZpbmQgJ3Rlc3QxLm1kJyBpblwiLCBtYXRjaGVzKVxuXHRcdH1cblx0fSlcblxuXHR0LnRlc3QoXCJ1bmNsb3NlZCBwaHJhc2VcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgZmlsZV93aXRoX21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgXCJmb28gYmFyXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX3dpdGhfbWF0Y2gpKTtcblxuXHRcdGNvbnN0IGZpbGVfd2l0aG91dF9tYXRjaCA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0MS5tZFwiLCBcImZvb1wiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZV93aXRob3V0X21hdGNoKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgc2VhcmNoLnNlYXJjaEZvcihgXCJmb28gYmFyYClcblxuXHRcdGlmICghbWF0Y2hlcy5zb21lKG1hdGNoID0+IG1hdGNoLm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIHRvIGZpbmQgJ3Rlc3QubWQnIGluXCIsIG1hdGNoZXMpXG5cdFx0fVxuXHRcdGlmIChtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIE5PVCB0byBmaW5kICd0ZXN0MS5tZCcgaW5cIiwgbWF0Y2hlcylcblx0XHR9XG5cdH0pXG5cblx0dC50ZXN0KFwicGhyYXNlIHN0YXJ0IG5leHQgdG8gd29yZFwiLCBhc3luYyB0ID0+IHtcblx0XHRjb25zdCBmaWxlX3dpdGhvdXRfcXVvdGVzID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgYGZvbyBiYXJgKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZV93aXRob3V0X3F1b3RlcykpXG5cdFx0Y29uc3QgZmlsZV93aXRoX3F1b3RlcyA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0MS5tZFwiLCBgZm9vXCJiYXJcImApO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX3dpdGhfcXVvdGVzKSlcblxuXHRcdGNvbnN0IHF1ZXJ5ID0gYGZvb1wiYmFyXCJgXG5cdFx0dC5sb2coeyBxdWVyeSB9KVxuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBzZWFyY2guc2VhcmNoRm9yKGBmb29cImJhclwiYCk7XG5cdFx0dC5sb2coeyBtYXRjaGVzIH0pXG5cblx0XHR0LmxvZyhcIndpdGhvdXQgc3BhY2UgYmVmb3JlIHN0YXJ0IG9mIHF1b3RlLCBxdWVyeSBzaG91bGQgYmUgdHJlYXRlZCBsaWtlIGEgJ3dvcmQnXCIpXG5cdFx0aWYgKG1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJzaG91bGQgbm90IGhhdmUgZm91bmQgZmlsZSB3aXRob3V0IGV4YWN0IG1hdGNoIHRvIHF1ZXJ5LCBidXQgZm91bmQ6IFwiLCBhd2FpdCBmaWxlcy5yZWFkRmlsZShmaWxlX3dpdGhvdXRfcXVvdGVzKSlcblx0XHR9XG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcInNob3VsZCBoYXZlIGZvdW5kIGZpbGUgd2l0aCBleGFjdCBtYXRjaCB0byBxdWVyeVwiKVxuXHRcdH1cblx0fSlcbn1cbiIsImltcG9ydCAqIGFzIHV0aWwgZnJvbSAndXRpbCdcblxuZnVuY3Rpb24gY2FsbGluZ0xvY2F0aW9uKCkge1xuXHQvLyBzdGFja1swXSAtIG1lc3NhZ2Vcblx0Ly8gc3RhY2tbMV0gLSBgY2FsbGluZ0xvY2F0aW9uYFxuXHQvLyBzdGFja1syXSAtIGZ1bmN0aW9uIHVzaW5nIGNhbGxpbmdMb2NhdGlvblxuXHQvLyBzdGFja1szXSAtIGFjdHVhbCBsb2NhdGlvblxuXHRyZXR1cm4gKG5ldyBFcnJvcigpLnN0YWNrID8/IFwibWVzc2FnZVxcbmNhbGxpbmdMb2NhdGlvblxcbmNhbGxlclxcblwiKS5zcGxpdChcIlxcblwiKVszXS50cmltU3RhcnQoKTtcbn1cblxuY29uc3QgRkFJTF9OT1cgPSBTeW1ib2woKTtcbmNvbnN0IFNLSVAgPSBTeW1ib2woKTtcblxuZXhwb3J0IGNsYXNzIFJlcG9ydGVyPEltcGwgPSBhbnk+IHtcblx0aW1wbDtcblx0dnRhYmxlO1xuXG5cdGNvbnN0cnVjdG9yKHtcblx0XHRpbXBsLFxuXHRcdC4uLnZ0YWJsZVxuXHR9OiB7XG5cdFx0aW1wbDogSW1wbCxcblx0XHR0ZXN0U3RhcnRlZChyZXBvcnRlcjogUmVwb3J0ZXI8SW1wbD4sIG5hbWU6IHN0cmluZywgdGVzdDogVGVzdCk6IHZvaWQ7XG5cdFx0dGVzdENvbXBsZXRlZChyZXBvcnRlcjogUmVwb3J0ZXI8SW1wbD4sIG5hbWU6IHN0cmluZywgdGVzdDogVGVzdCwgcmVzdWx0OiBSZXN1bHQpOiB2b2lkO1xuXHR9KSB7XG5cdFx0dGhpcy5pbXBsID0gaW1wbDtcblx0XHR0aGlzLnZ0YWJsZSA9IHZ0YWJsZTtcblx0fVxuXG5cdHRlc3RTdGFydGVkKHRoaXM6IFJlcG9ydGVyLCBuYW1lOiBzdHJpbmcsIHRlc3Q6IFRlc3QpOiB2b2lkIHtcblx0XHR0aGlzLnZ0YWJsZS50ZXN0U3RhcnRlZCh0aGlzLCBuYW1lLCB0ZXN0KVxuXHR9XG5cblx0dGVzdENvbXBsZXRlZCh0aGlzOiBSZXBvcnRlciwgbmFtZTogc3RyaW5nLCB0ZXN0OiBUZXN0LCByZXN1bHQ6IFJlc3VsdCk6IHZvaWQge1xuXHRcdHRoaXMudnRhYmxlLnRlc3RDb21wbGV0ZWQodGhpcywgbmFtZSwgdGVzdCwgcmVzdWx0KVxuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBXcml0ZXI8SW1wbCA9IGFueT4ge1xuXHRpbXBsO1xuXHRkYXRhOiBzdHJpbmcgPSBcIlwiO1xuXHR3cml0ZV9mbjtcblxuXHRjb25zdHJ1Y3RvcihkZWY6IHtcblx0XHRpbXBsOiBJbXBsLFxuXHRcdHdyaXRlOiAod3JpdGVyOiBXcml0ZXI8SW1wbD4sIGRhdGE6IHN0cmluZykgPT4gdm9pZCxcblx0fSkge1xuXHRcdHRoaXMuaW1wbCA9IGRlZi5pbXBsO1xuXHRcdHRoaXMud3JpdGVfZm4gPSBkZWYud3JpdGU7XG5cdH1cblxuXHR3cml0ZSh0aGlzOiBXcml0ZXI8SW1wbD4sIGRhdGE6IHN0cmluZyk6IHZvaWQge1xuXHRcdHRoaXMuZGF0YSArPSBkYXRhO1xuXHR9XG5cblx0Zmx1c2godGhpczogV3JpdGVyPEltcGw+KTogdm9pZCB7XG5cdFx0Y29uc3QgZGF0YSA9IHRoaXMuZGF0YTtcblx0XHR0aGlzLmRhdGEgPSBcIlwiO1xuXHRcdHRoaXMud3JpdGVfZm4odGhpcywgZGF0YSk7XG5cdH1cblxufVxuXG4vKiogUmVwb3J0cyBhcyB0ZXN0cyBzdGFydCBhbmQgdGhlbiBlbmQuICBPbmx5IGZhaWxlZCB0ZXN0cyBwcmludCBsb2dzICovXG5leHBvcnQgY2xhc3MgU3RhcnRTdG9wUmVwb3J0ZXIge1xuXHRzdGF0aWMgaW5kZW50ID0gXCIgICAgXCI7XG5cblx0b3V0cHV0O1xuXG5cdGNvbnN0cnVjdG9yKGRlZjoge1xuXHRcdG91dHB1dDogV3JpdGVyLFxuXHR9KSB7XG5cdFx0dGhpcy5vdXRwdXQgPSBkZWYub3V0cHV0O1xuXHR9XG5cblx0YW5jZXN0b3JzOiB7IG5hbWU6IHN0cmluZywgd3JpdHRlbjogYm9vbGVhbiB9W10gPSBbXTtcblx0Y3VycmVudDogeyBuYW1lOiBzdHJpbmcsIHdyaXR0ZW46IGJvb2xlYW4gfSB8IG51bGwgPSBudWxsO1xuXG5cdHN0YXRpYyAjU3VtbWFyeVJlcG9ydGVyVlRhYmxlID0gT2JqZWN0LmZyZWV6ZSh7XG5cdFx0cmVwb3J0VGVzdFN0YXJ0ZWQ6IChyZXBvcnRlcjogUmVwb3J0ZXI8U3RhcnRTdG9wUmVwb3J0ZXI+LCBuYW1lOiBzdHJpbmcsIF90ZXN0OiBUZXN0KSA9PiB7XG5cdFx0XHRyZXR1cm4gcmVwb3J0ZXIuaW1wbC5yZXBvcnRUZXN0U3RhcnRlZChuYW1lKTtcblx0XHR9LFxuXHRcdHJlcG9ydFRlc3RDb21wbGV0ZWQ6IChyZXBvcnRlcjogUmVwb3J0ZXI8U3RhcnRTdG9wUmVwb3J0ZXI+LCBuYW1lOiBzdHJpbmcsIHRlc3Q6IFRlc3QsIHJlc3VsdDogUmVzdWx0KSA9PiB7XG5cdFx0XHRyZXR1cm4gcmVwb3J0ZXIuaW1wbC5yZXBvcnRUZXN0Q29tcGxldGVkKG5hbWUsIHRlc3QsIHJlc3VsdCk7XG5cdFx0fSxcblx0fSk7XG5cblx0cmVwb3J0VGVzdFN0YXJ0ZWQodGhpczogU3RhcnRTdG9wUmVwb3J0ZXIsIG5hbWU6IHN0cmluZykge1xuXHRcdGlmICh0aGlzLmN1cnJlbnQgIT09IG51bGwpIHtcblx0XHRcdHRoaXMuYW5jZXN0b3JzLnB1c2godGhpcy5jdXJyZW50KTtcblx0XHR9XG5cdFx0dGhpcy5jdXJyZW50ID0geyBuYW1lLCB3cml0dGVuOiBmYWxzZSB9O1xuXHR9XG5cblx0cmVwb3J0VGVzdENvbXBsZXRlZCh0aGlzOiBTdGFydFN0b3BSZXBvcnRlciwgbmFtZTogc3RyaW5nLCB0ZXN0OiBUZXN0LCByZXN1bHQ6IFJlc3VsdCkge1xuXHRcdGlmIChyZXN1bHQuc3RhdHVzID09PSBTdGF0dXMuUGFzc2VkICYmIHRoaXMuYW5jZXN0b3JzLmxlbmd0aCA+IDApIHtcblx0XHRcdHRoaXMuY3VycmVudCA9IHRoaXMuYW5jZXN0b3JzLnBvcCgpID8/IG51bGw7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuYW5jZXN0b3JzLmZvckVhY2goKGFuY2VzdG9yLCBpbmRleCkgPT4ge1xuXHRcdFx0aWYgKGFuY2VzdG9yLndyaXR0ZW4pIHJldHVybjtcblx0XHRcdHRoaXMub3V0cHV0LndyaXRlKFN0YXJ0U3RvcFJlcG9ydGVyLmluZGVudC5yZXBlYXQoaW5kZXgpKVxuXHRcdFx0bGV0IHByZWZpeCA9IFwiVEVTVFwiO1xuXHRcdFx0aWYgKHJlc3VsdC5zdGF0dXMgPT09IFN0YXR1cy5GYWlsZWQpIHtcblx0XHRcdFx0cHJlZml4ID0gXCJcXHUwMDFiWzMxbUZBSUxcXHUwMDFiWzM5bVwiO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5vdXRwdXQud3JpdGUoYCR7cHJlZml4fSAke2FuY2VzdG9yLm5hbWV9XFxuYCk7XG5cdFx0XHRhbmNlc3Rvci53cml0dGVuID0gdHJ1ZTtcblx0XHR9KVxuXG5cdFx0Y29uc3QgaW5kZW50ID0gU3RhcnRTdG9wUmVwb3J0ZXIuaW5kZW50LnJlcGVhdCh0aGlzLmFuY2VzdG9ycy5sZW5ndGgpO1xuXHRcdHRoaXMuY3VycmVudCA9IHRoaXMuYW5jZXN0b3JzLnBvcCgpID8/IG51bGw7XG5cblx0XHRsZXQgcHJlZml4ID0gXCJcIjtcblx0XHRzd2l0Y2ggKHJlc3VsdC5zdGF0dXMpIHtcblx0XHRcdGNhc2UgU3RhdHVzLkZhaWxlZDogeyBwcmVmaXggPSBcIlxcdTAwMWJbMzFtRkFJTFxcdTAwMWJbMzltXCI7IGJyZWFrOyB9XG5cdFx0XHRjYXNlIFN0YXR1cy5QYXNzZWQ6IHsgcHJlZml4ID0gXCJcXHUwMDFiWzMybVBBU1NcXHUwMDFiWzM5bVwiOyBicmVhazsgfVxuXHRcdFx0Y2FzZSBTdGF0dXMuU2tpcHBlZDogeyBwcmVmaXggPSBcIlxcdTAwMWJbMzNtU0tJUFxcdTAwMWJbMzltXCI7IGJyZWFrOyB9XG5cdFx0XHRkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoXCJyZXBvcnRlZCB0ZXN0IGNvbXBsZXRlZCwgYnV0IHN0YXR1cyBpcyBcIiArIFN0YXR1c1tyZXN1bHQuc3RhdHVzXSlcblx0XHR9XG5cblx0XHR0aGlzLm91dHB1dC53cml0ZShgJHtpbmRlbnR9JHtwcmVmaXh9ICR7bmFtZX1cXG5gKTtcblx0XHRpZiAodGhpcy5jdXJyZW50KSB7XG5cdFx0XHR0aGlzLmN1cnJlbnQud3JpdHRlbiA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHJlc3VsdC5zdGF0dXMgPT09IFN0YXR1cy5GYWlsZWQpIHtcblx0XHRcdGNvbnN0IGxvZ19pbmRlbnQgPSBpbmRlbnQgKyBTdGFydFN0b3BSZXBvcnRlci5pbmRlbnRcblx0XHRcdHRlc3QubG9ncy5mb3JFYWNoKCh7IGxvY2F0aW9uLCBhcmdzIH0pID0+IHtcblx0XHRcdFx0dGhpcy5vdXRwdXQud3JpdGUoYCR7bG9nX2luZGVudH0ke2xvY2F0aW9ufTogYCk7XG5cdFx0XHRcdGFyZ3MuZm9yRWFjaChhcmcgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGxpbmVzID0gYXJnLnNwbGl0KFwiXFxuXCIpO1xuXHRcdFx0XHRcdHRoaXMub3V0cHV0LndyaXRlKGxpbmVzWzBdICsgXCJcXG5cIilcblx0XHRcdFx0XHRsaW5lcy5zbGljZSgxKS5mb3JFYWNoKGxpbmUgPT4gdGhpcy5vdXRwdXQud3JpdGUobG9nX2luZGVudCArIGxpbmUgKyBcIlxcblwiKSlcblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0fVxuXHRcdHRoaXMub3V0cHV0LmZsdXNoKCk7XG5cdH1cblxuXHRyZXBvcnRlcih0aGlzOiBTdGFydFN0b3BSZXBvcnRlcik6IFJlcG9ydGVyPFN0YXJ0U3RvcFJlcG9ydGVyPiB7XG5cdFx0cmV0dXJuIG5ldyBSZXBvcnRlcih7XG5cdFx0XHRpbXBsOiB0aGlzLFxuXHRcdFx0dGVzdFN0YXJ0ZWQ6IFN0YXJ0U3RvcFJlcG9ydGVyLiNTdW1tYXJ5UmVwb3J0ZXJWVGFibGUucmVwb3J0VGVzdFN0YXJ0ZWQsXG5cdFx0XHR0ZXN0Q29tcGxldGVkOiBTdGFydFN0b3BSZXBvcnRlci4jU3VtbWFyeVJlcG9ydGVyVlRhYmxlLnJlcG9ydFRlc3RDb21wbGV0ZWQsXG5cdFx0fSlcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgU2NoZWR1bGVkVGVzdCB7XG5cdG5hbWU7XG5cdGZuO1xuXG5cdGNvbnN0cnVjdG9yKHsgbmFtZSwgZm4gfToge1xuXHRcdG5hbWU6IHN0cmluZyxcblx0XHRmbjogKHRlc3Q6IFRlc3QpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+XG5cdH0pIHtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuZm4gPSBmbjtcblx0fVxufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnlBcmdzKGFyZ3M6IGFueVtdKTogc3RyaW5nW10ge1xuXHRyZXR1cm4gYXJncy5tYXAoYXJnID0+IHtcblx0XHRpZiAodHlwZW9mIGFyZyA9PT0gXCJzdHJpbmdcIikge1xuXHRcdFx0cmV0dXJuIGFyZztcblx0XHR9XG5cdFx0cmV0dXJuIHV0aWwuaW5zcGVjdChhcmcpXG5cdH0pXG59XG5cbmV4cG9ydCBjbGFzcyBUZXN0IHtcblx0c3RhdHVzOiBTdGF0dXMgPSBTdGF0dXMuUnVubmluZztcblx0bG9nczogQXJyYXk8eyBsb2NhdGlvbjogc3RyaW5nLCBhcmdzOiBzdHJpbmdbXSB9PiA9IFtdO1xuXHRjbGVhbnVwX2ZuczogQXJyYXk8KHRlc3Q6IFRlc3QpID0+IGFueT4gPSBbXTtcblxuXHRyZXBvcnRlcjogUmVwb3J0ZXI7XG5cblx0Y29uc3RydWN0b3Ioe1xuXHRcdHJlcG9ydGVyXG5cdH06IHtcblx0XHRyZXBvcnRlcjogUmVwb3J0ZXJcblx0fSkge1xuXHRcdHRoaXMucmVwb3J0ZXIgPSByZXBvcnRlcjtcblx0fVxuXG5cdGNoaWxkcmVuOiBBcnJheTxTY2hlZHVsZWRUZXN0PiA9IFtdO1xuXG5cdHJ1bih0aGlzOiBUZXN0LCBuYW1lOiBzdHJpbmcsIGZuOiAodGVzdDogVGVzdCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD4pIHtcblx0XHR0aGlzLmNoaWxkcmVuLnB1c2gobmV3IFNjaGVkdWxlZFRlc3QoeyBuYW1lLCBmbiB9KSk7XG5cdH1cblx0dGVzdCh0aGlzOiBUZXN0LCBuYW1lOiBzdHJpbmcsIGZuOiAodGVzdDogVGVzdCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD4pIHtcblx0XHR0aGlzLnJ1bihuYW1lLCBmbik7XG5cdH1cblx0c3VpdGUodGhpczogVGVzdCwgbmFtZTogc3RyaW5nLCBmbjogKHRlc3Q6IFRlc3QpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+KSB7XG5cdFx0dGhpcy5ydW4obmFtZSwgZm4pO1xuXHR9XG5cblx0c2tpcCh0aGlzOiBUZXN0KTogbmV2ZXIge1xuXHRcdGlmICh0aGlzLnN0YXR1cyA+PSBTdGF0dXMuU2tpcHBlZCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IHNraXAgYSB0ZXN0IHRoYXQgaGFzIGFscmVhZHkgZmluaXNoZWQuICBEaWQgeW91IGNhbGwgJ3NraXAnIGluIGFuICdhZnRlcicgY2FsbD9cIilcblx0XHR9XG5cdFx0dGhpcy5zdGF0dXMgPSBTdGF0dXMuU2tpcHBlZDtcblx0XHR0aHJvdyBTS0lQO1xuXHR9XG5cblx0ZmFpbCh0aGlzOiBUZXN0KSB7XG5cdFx0dGhpcy5zdGF0dXMgPSBTdGF0dXMuRmFpbGVkO1xuXHR9XG5cblx0ZmFpbE5vdyh0aGlzOiBUZXN0KTogbmV2ZXIge1xuXHRcdHRoaXMuZmFpbCgpO1xuXHRcdHRocm93IEZBSUxfTk9XO1xuXHR9XG5cblx0ZmFpbFdpdGgodGhpczogVGVzdCwgLi4uYXJnczogYW55W10pIHtcblx0XHR0aGlzLmxvZ3MucHVzaCh7IGxvY2F0aW9uOiBjYWxsaW5nTG9jYXRpb24oKSwgYXJnczogc3RyaW5naWZ5QXJncyhhcmdzKSB9KVxuXHRcdHRoaXMuZmFpbCgpO1xuXHR9XG5cblx0ZmFpbE5vd1dpdGgodGhpczogVGVzdCwgLi4uYXJnczogYW55W10pOiBuZXZlciB7XG5cdFx0dGhpcy5sb2dzLnB1c2goeyBsb2NhdGlvbjogY2FsbGluZ0xvY2F0aW9uKCksIGFyZ3M6IHN0cmluZ2lmeUFyZ3MoYXJncykgfSlcblx0XHR0aGlzLmZhaWxOb3coKVxuXHR9XG5cblx0bG9nKHRoaXM6IFRlc3QsIC4uLmFyZ3M6IGFueVtdKSB7XG5cdFx0dGhpcy5sb2dzLnB1c2goeyBsb2NhdGlvbjogY2FsbGluZ0xvY2F0aW9uKCksIGFyZ3M6IHN0cmluZ2lmeUFyZ3MoYXJncykgfSlcblx0fVxuXG5cdGFmdGVyKHRoaXM6IFRlc3QsIGZuOiAodGVzdDogVGVzdCkgPT4gYW55KSB7XG5cdFx0dGhpcy5jbGVhbnVwX2Zucy5wdXNoKGZuKTtcblx0fVxufVxuXG5jbGFzcyBSZXN1bHQge1xuXHRzdGF0dXM7XG5cdGNoaWxkcmVuOiBSZXN1bHRbXTtcblxuXHRjb25zdHJ1Y3Rvcih7XG5cdFx0c3RhdHVzLFxuXHRcdGNoaWxkcmVuLFxuXHR9OiB7XG5cdFx0c3RhdHVzOiBTdGF0dXMsXG5cdFx0Y2hpbGRyZW4/OiBSZXN1bHRbXVxuXHR9KSB7XG5cdFx0dGhpcy5zdGF0dXMgPSBzdGF0dXM7XG5cdFx0dGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuID8/IFtdO1xuXHR9XG5cblx0I3N1bW1hcnk6IG51bGwgfCB7IHNraXBwZWQ6IG51bWJlciwgcGFzc2VkOiBudW1iZXIsIGZhaWxlZDogbnVtYmVyIH0gPSBudWxsO1xuXHRjaGlsZHJlblN1bW1hcnkodGhpczogUmVzdWx0KTogbnVsbCB8IHsgc2tpcHBlZDogbnVtYmVyLCBwYXNzZWQ6IG51bWJlciwgZmFpbGVkOiBudW1iZXIgfSB7XG5cdFx0aWYgKHRoaXMuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblx0XHRpZiAodGhpcy4jc3VtbWFyeSAhPT0gbnVsbCkgcmV0dXJuIHRoaXMuI3N1bW1hcnk7XG5cdFx0dGhpcy4jc3VtbWFyeSA9IHsgc2tpcHBlZDogMCwgcGFzc2VkOiAwLCBmYWlsZWQ6IDAgfTtcblx0XHRmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGRyZW4pIHtcblx0XHRcdGNvbnN0IGNoaWxkX3N1bW1hcnkgPSBjaGlsZC5jaGlsZHJlblN1bW1hcnkoKTtcblx0XHRcdGlmIChjaGlsZF9zdW1tYXJ5ID09PSBudWxsKSB7XG5cdFx0XHRcdHN3aXRjaCAoY2hpbGQuc3RhdHVzKSB7XG5cdFx0XHRcdFx0Y2FzZSBTdGF0dXMuU2tpcHBlZDoge1xuXHRcdFx0XHRcdFx0dGhpcy4jc3VtbWFyeS5za2lwcGVkICs9IDE7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y2FzZSBTdGF0dXMuUGFzc2VkOiB7XG5cdFx0XHRcdFx0XHR0aGlzLiNzdW1tYXJ5LnBhc3NlZCArPSAxO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNhc2UgU3RhdHVzLkZhaWxlZDoge1xuXHRcdFx0XHRcdFx0dGhpcy4jc3VtbWFyeS5mYWlsZWQgKz0gMTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy4jc3VtbWFyeS5za2lwcGVkICs9IGNoaWxkX3N1bW1hcnkuc2tpcHBlZCA/PyAwO1xuXHRcdFx0XHR0aGlzLiNzdW1tYXJ5LnBhc3NlZCArPSBjaGlsZF9zdW1tYXJ5LnBhc3NlZCA/PyAwO1xuXHRcdFx0XHR0aGlzLiNzdW1tYXJ5LmZhaWxlZCArPSBjaGlsZF9zdW1tYXJ5LmZhaWxlZCA/PyAwO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy4jc3VtbWFyeTtcblx0fVxuXG59XG5leHBvcnQgdHlwZSB7IFJlc3VsdCB9XG5cbmV4cG9ydCBjbGFzcyBSdW5uZXIge1xuXHRyZXBvcnRlcjogUmVwb3J0ZXI7XG5cblx0Y29uc3RydWN0b3Ioe1xuXHRcdHJlcG9ydGVyXG5cdH06IHtcblx0XHRyZXBvcnRlcj86IFJlcG9ydGVyXG5cdH0pIHtcblx0XHR0aGlzLnJlcG9ydGVyID0gcmVwb3J0ZXIgPz8gbmV3IFJlcG9ydGVyKHtcblx0XHRcdGltcGw6IG51bGwsXG5cdFx0XHR0ZXN0U3RhcnRlZDogKCkgPT4geyB9LFxuXHRcdFx0dGVzdENvbXBsZXRlZDogKCkgPT4geyB9LFxuXHRcdH0pO1xuXHR9XG5cblx0YXN5bmMgcnVuKHRoaXM6IFJ1bm5lciwgZm46ICh0ZXN0OiBUZXN0KSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPik6IFByb21pc2U8UmVzdWx0PiB7XG5cdFx0cmV0dXJuIHJ1blRlc3QobmV3IFRlc3QoeyByZXBvcnRlcjogdGhpcy5yZXBvcnRlciB9KSwgZm4pO1xuXHR9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blRlc3RzKHJlcG9ydGVyOiBSZXBvcnRlciwgc2NoZWR1bGVkOiBTY2hlZHVsZWRUZXN0W10pOiBQcm9taXNlPFJlc3VsdFtdPiB7XG5cdGNvbnN0IHJlc3VsdHM6IFJlc3VsdFtdID0gW107XG5cdGZvciAoY29uc3QgdGFzayBvZiBzY2hlZHVsZWQpIHtcblx0XHRyZXN1bHRzLnB1c2goYXdhaXQgcnVuKHJlcG9ydGVyLCB0YXNrLm5hbWUsIHRhc2suZm4pKTtcblx0fVxuXHRyZXR1cm4gcmVzdWx0cztcbn1cblxuYXN5bmMgZnVuY3Rpb24gcnVuKHJlcG9ydGVyOiBSZXBvcnRlciwgbmFtZTogc3RyaW5nLCBmbjogKHRlc3Q6IFRlc3QpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+KTogUHJvbWlzZTxSZXN1bHQ+IHtcblx0Y29uc3QgdGVzdCA9IG5ldyBUZXN0KHsgcmVwb3J0ZXIgfSk7XG5cdHJlcG9ydGVyLnRlc3RTdGFydGVkKG5hbWUsIHRlc3QpO1xuXG5cdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJ1blRlc3QodGVzdCwgZm4pO1xuXG5cdHJlcG9ydGVyLnRlc3RDb21wbGV0ZWQobmFtZSwgdGVzdCwgcmVzdWx0KVxuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1blRlc3QodGVzdDogVGVzdCwgZm46ICh0ZXN0OiBUZXN0KSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPik6IFByb21pc2U8UmVzdWx0PiB7XG5cdGNvbnN0IGxvZyA9IGNvbnNvbGUubG9nO1xuXHRjb25zb2xlLmxvZyA9ICguLi5hcmdzKSA9PiB0ZXN0LmxvZyguLi5hcmdzKTtcblx0dHJ5IHtcblx0XHRhd2FpdCBmbih0ZXN0KVxuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKGUgIT09IFNLSVAgJiYgZSAhPT0gRkFJTF9OT1cpIHtcblx0XHRcdHRlc3QubG9ncy5wdXNoKHsgbG9jYXRpb246IFwiXCIsIGFyZ3M6IHN0cmluZ2lmeUFyZ3MoW2VdKSB9KVxuXHRcdFx0dGVzdC5zdGF0dXMgPSBTdGF0dXMuRmFpbGVkO1xuXHRcdH1cblx0fSBmaW5hbGx5IHtcblx0XHRjb25zb2xlLmxvZyA9IGxvZztcblx0fVxuXHRpZiAodGVzdC5zdGF0dXMgIT09IFN0YXR1cy5GYWlsZWQgJiYgdGVzdC5zdGF0dXMgIT09IFN0YXR1cy5Ta2lwcGVkKSB7XG5cdFx0dGVzdC5zdGF0dXMgPSBTdGF0dXMuUGFzc2VkO1xuXHR9XG5cblx0Y29uc3QgcmVzdWx0ID0gbmV3IFJlc3VsdCh7XG5cdFx0c3RhdHVzOiB0ZXN0LnN0YXR1cyxcblx0XHRjaGlsZHJlbjogYXdhaXQgcnVuVGVzdHModGVzdC5yZXBvcnRlciwgdGVzdC5jaGlsZHJlbilcblx0fSk7XG5cblx0aWYgKHJlc3VsdC5jaGlsZHJlbi5zb21lKGl0ID0+IGl0LnN0YXR1cyA9PT0gU3RhdHVzLkZhaWxlZCkpIHtcblx0XHRyZXN1bHQuc3RhdHVzID0gdGVzdC5zdGF0dXMgPSBTdGF0dXMuRmFpbGVkO1xuXHR9XG5cblx0Zm9yIChjb25zdCBjbGVhbnVwIG9mIHRlc3QuY2xlYW51cF9mbnMpIHtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgY2xlYW51cCh0ZXN0KVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlICE9PSBTS0lQICYmIGUgIT09IEZBSUxfTk9XKSB7XG5cdFx0XHRcdHRlc3QubG9ncy5wdXNoKHsgbG9jYXRpb246IFwiQUZURVJcIiwgYXJnczogc3RyaW5naWZ5QXJncyhbZV0pIH0pXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGVudW0gU3RhdHVzIHtcblx0UnVubmluZyxcblxuXHRTa2lwcGVkLFxuXHRQYXNzZWQsXG5cdEZhaWxlZCxcbn1cblxuIiwiaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vLi4vLi4vdGVzdC9mcmFtZXdvcmtcIjtcbmltcG9ydCB7IEZpbGVzIH0gZnJvbSBcIi4uLy4uL3Rlc3RpbmcvZmlsZXNcIjtcbmltcG9ydCB7IFNlYXJjaCB9IGZyb20gXCIuLi8uLi90ZXN0aW5nL3NlYXJjaFwiO1xuXG50eXBlIFRlc3RGbjxGaWxlPiA9ICh0aGlzOiB2b2lkLCB0OiB0ZXN0aW5nLlRlc3QsIGZpbGVzOiBGaWxlczxGaWxlPiwgc2VhcmNoOiBTZWFyY2gpID0+IFByb21pc2U8dm9pZD5cblxuY29uc3QgYWxsX3Rlc3RzID0gaW1wb3J0Lm1ldGEuZ2xvYjx0cnVlLCBzdHJpbmcsIFRlc3RGbjxhbnk+PihbXCJ0ZXN0L2NvbnRyYWN0L3Rlc3RzLyoudHNcIiwgXCIhdGVzdC9jb250cmFjdC90ZXN0cy9pbmRleC50c1wiXSwgeyBlYWdlcjogdHJ1ZSwgaW1wb3J0OiBcImRlZmF1bHRcIiB9KVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsVGVzdHM8Rj4oKTogQXJyYXk8eyBmaWxlbmFtZTogc3RyaW5nLCBydW46IFRlc3RGbjxGPiB9PiB7XG5cdHJldHVybiBPYmplY3QuZW50cmllcyhhbGxfdGVzdHMpLm1hcCgoW2ZpbGVuYW1lLCBmbl0pID0+ICh7IGZpbGVuYW1lLCBydW46IGZuIH0pKVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuVGVzdHM8RmlsZT4ocnVubmVyOiB0ZXN0aW5nLlJ1bm5lciwgZmlsZXM6IEZpbGVzPEZpbGU+LCBzZWFyY2g6IFNlYXJjaCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRjb25zdCByZXN1bHQgPSBhd2FpdCBydW5uZXIucnVuKHQgPT4ge1xuXHRcdGZvciAoY29uc3QgW2ZpbGVuYW1lLCBmbl0gb2YgT2JqZWN0LmVudHJpZXMoYWxsX3Rlc3RzKSkge1xuXHRcdFx0dC50ZXN0KGZpbGVuYW1lLnNsaWNlKDEpLCB0ID0+IGZuKHQsIGZpbGVzLCBzZWFyY2gpKVxuXHRcdH1cblx0fSlcblxuXHRyZXR1cm4gcmVzdWx0LnN0YXR1cyA9PT0gdGVzdGluZy5TdGF0dXMuUGFzc2VkO1xufVxuIiwiaW1wb3J0ICogYXMgb2JzaWRpYW4gZnJvbSBcIm9ic2lkaWFuXCJcbmltcG9ydCAqIGFzIG5ldCBmcm9tIFwibmV0XCJcblxuaW1wb3J0IHsgaW5zcGVjdCB9IGZyb20gXCJ1dGlsXCI7XG5cbi8qKiBkZWZpbmVkIGJ5IHZpdGUgZHVyaW5nIGJ1aWxkICovXG5kZWNsYXJlIGNvbnN0IF9fVEVTVF9SVU5ORVJfUE9SVF9fOiBudW1iZXI7XG5cbmV4cG9ydCBjbGFzcyBTb2NrZXRSZXBvcnRlclBsdWdpbiBleHRlbmRzIG9ic2lkaWFuLlBsdWdpbiB7XG5cdHNvY2tldDtcblxuXHRjb25zdHJ1Y3RvcihhcHA6IG9ic2lkaWFuLkFwcCwgbWFuaWZlc3Q6IG9ic2lkaWFuLlBsdWdpbk1hbmlmZXN0KSB7XG5cdFx0c3VwZXIoYXBwLCBtYW5pZmVzdClcblx0XHR0cnkge1xuXHRcdFx0dGhpcy5zb2NrZXQgPSBuZXQuY3JlYXRlQ29ubmVjdGlvbih7IHBvcnQ6IF9fVEVTVF9SVU5ORVJfUE9SVF9fIH0pXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy5zb2NrZXQgPSB7XG5cdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0d3JpdGU6IGNvbnNvbGUubG9nLFxuXHRcdFx0fVxuXHRcdFx0bmV3IG9ic2lkaWFuLk5vdGljZShcIkZhaWxlZCB0byBjcmVhdGUgc29ja2V0IGNvbm5lY3Rpb25cXG5cIiArIGluc3BlY3QoZSkpXG5cdFx0XHR0aHJvdyBlO1xuXHRcdH1cblxuXHR9XG5cbn1cbiIsImltcG9ydCAqIGFzIG9ic2lkaWFuIGZyb20gXCJvYnNpZGlhblwiXG5pbXBvcnQgKiBhcyB0ZXN0aW5nIGZyb20gXCIuLi90ZXN0aW5nL2ZpbGVzXCJcbmltcG9ydCAqIGFzIHBhdGhzIGZyb20gXCJwYXRoXCJcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUZpbGUoXG5cdGFwcDogb2JzaWRpYW4uQXBwLFxuXHRwYXRoOiBzdHJpbmcsXG5cdGJvZHk6IHN0cmluZyA9IFwiXCIsXG5cdGZyb250bWF0dGVyPzogdGVzdGluZy5Gcm9udG1hdHRlcixcbik6IFByb21pc2U8b2JzaWRpYW4uVEZpbGU+IHtcblx0aWYgKGZyb250bWF0dGVyKSB7XG5cdFx0bGV0IHByZWZpeCA9IFwiLS0tXFxuXCI7XG5cdFx0aWYgKGZyb250bWF0dGVyLnRhZ3MubGVuZ3RoID4gMCkge1xuXHRcdFx0cHJlZml4ICs9IFwidGFnczpcXG5cIlxuXHRcdFx0ZnJvbnRtYXR0ZXIudGFncy5mb3JFYWNoKHRhZyA9PiBwcmVmaXggKz0gXCIgIC0gXCIgKyB0YWcgKyBcIlxcblwiKVxuXHRcdH1cblx0XHRpZiAoZnJvbnRtYXR0ZXIuYWxpYXNlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRwcmVmaXggKz0gXCJhbGlhc2VzOlxcblwiXG5cdFx0XHRmcm9udG1hdHRlci5hbGlhc2VzLmZvckVhY2goYWxpYXMgPT4gcHJlZml4ICs9IGAgIC0gJHthbGlhc31cXG5gKVxuXHRcdH1cblx0XHRpZiAoZnJvbnRtYXR0ZXIuY3NzY2xhc3Nlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRwcmVmaXggKz0gXCJjc3NjbGFzc2VzOlxcblwiXG5cdFx0XHRmcm9udG1hdHRlci5jc3NjbGFzc2VzLmZvckVhY2goY3NzY2xhc3MgPT4gcHJlZml4ICs9IGAgIC0gJHtjc3NjbGFzc31cXG5gKVxuXHRcdH1cblx0XHRpZiAoT2JqZWN0LmtleXMoZnJvbnRtYXR0ZXIucHJvcGVydGllcykubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yIChjb25zdCBbcHJvcCwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGZyb250bWF0dGVyLnByb3BlcnRpZXMpKSB7XG5cdFx0XHRcdHByZWZpeCArPSBgJHtwcm9wfTogJHt2YWx1ZX1cXG5gXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHByZWZpeCArPSBcIi0tLVxcblwiO1xuXHRcdGJvZHkgPSBwcmVmaXggKyBib2R5O1xuXHR9XG5cdGNvbnN0IHBhdGhfcGFydHMgPSBwYXRoLnNwbGl0KFwiL1wiKTtcblx0aWYgKHBhdGhfcGFydHMubGVuZ3RoID4gMSkge1xuXHRcdGNvbnN0IGZvbGRlcl9wYXRoID0gcGF0aHMuam9pbiguLi5wYXRoX3BhcnRzLnNsaWNlKDAsIC0xKSk7XG5cdFx0aWYgKCFhcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKGZvbGRlcl9wYXRoKSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJfcGF0aCk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGNvbnN0IGVyciA9IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjcmVhdGUgZm9sZGVyOiBcIiArIGZvbGRlcl9wYXRoKTtcblx0XHRcdFx0ZXJyLmNhdXNlID0gZTtcblx0XHRcdFx0dGhyb3cgZXJyO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRsZXQgZmlsZTogb2JzaWRpYW4uVEZpbGU7XG5cdHRyeSB7XG5cdFx0ZmlsZSA9IGF3YWl0IGFwcC52YXVsdC5jcmVhdGUocGF0aCwgYm9keSk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgZmlsZSBhdCBcIiR7cGF0aH1cImAsIHsgY2F1c2U6IGUgfSk7XG5cdH1cblx0aWYgKGFwcC5tZXRhZGF0YUNhY2hlLmdldENhY2hlKHBhdGgpID09IG51bGwpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG5cdFx0XHRjb25zdCByZWYgPSBhcHAubWV0YWRhdGFDYWNoZS5vbihcInJlc29sdmVkXCIsICgpID0+IHtcblx0XHRcdFx0aWYgKGFwcC5tZXRhZGF0YUNhY2hlLmdldENhY2hlKHBhdGgpICE9IG51bGwpIHtcblx0XHRcdFx0XHRhcHAubWV0YWRhdGFDYWNoZS5vZmZyZWYocmVmKTtcblx0XHRcdFx0XHRyZXNvbHZlKGZpbGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KVxuXHR9XG5cdHJldHVybiBmaWxlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsZXMoYXBwOiBvYnNpZGlhbi5BcHApOiB0ZXN0aW5nLkZpbGVzPG9ic2lkaWFuLlRGaWxlPiB7XG5cdHJldHVybiBuZXcgdGVzdGluZy5GaWxlczxvYnNpZGlhbi5URmlsZSwgb2JzaWRpYW4uQXBwPih7XG5cdFx0aW1wbDogYXBwLFxuXHRcdGNyZWF0ZUZpbGUoXG5cdFx0XHR0aGlzOiB0ZXN0aW5nLkZpbGVzPG9ic2lkaWFuLlRGaWxlLCBvYnNpZGlhbi5BcHA+LFxuXHRcdFx0cGF0aDogc3RyaW5nLFxuXHRcdFx0Ym9keT86IHN0cmluZyxcblx0XHRcdGZyb250bWF0dGVyPzogdGVzdGluZy5Gcm9udG1hdHRlclxuXHRcdCk6IFByb21pc2U8b2JzaWRpYW4uVEZpbGU+IHtcblx0XHRcdHJldHVybiBjcmVhdGVGaWxlKHRoaXMuaW1wbCwgcGF0aCwgYm9keSwgZnJvbnRtYXR0ZXIpO1xuXHRcdH0sXG5cdFx0YXN5bmMgZGVsZXRlRmlsZSh0aGlzOiB0ZXN0aW5nLkZpbGVzPG9ic2lkaWFuLlRGaWxlLCBvYnNpZGlhbi5BcHA+LCBmaWxlOiBvYnNpZGlhbi5URmlsZSkge1xuXHRcdFx0YXdhaXQgdGhpcy5pbXBsLnZhdWx0LmRlbGV0ZShmaWxlLCB0cnVlKVxuXHRcdFx0Y29uc3QgcGF0aF9wYXJ0cyA9IGZpbGUubmFtZS5zcGxpdChcIi9cIilcblx0XHRcdGlmIChwYXRoX3BhcnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0Y29uc3QgZm9sZGVyX3BhdGggPSBwYXRocy5qb2luKC4uLnBhdGhfcGFydHMuc2xpY2UoMCwgLTEpKVxuXHRcdFx0XHRjb25zdCBmb2xkZXIgPSB0aGlzLmltcGwudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKGZvbGRlcl9wYXRoKTtcblx0XHRcdFx0aWYgKCFmb2xkZXIpIHJldHVybjtcblx0XHRcdFx0aWYgKCFmb2xkZXIuY2hpbGRyZW4ubGVuZ3RoKSB7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5pbXBsLnZhdWx0LmRlbGV0ZShmb2xkZXIsIHRydWUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiZm9sZGVyIFwiLCBmb2xkZXIucGF0aCwgXCJzdGlsbCBoYXMgY2hpbGRyZW5cIiwgZm9sZGVyLmNoaWxkcmVuLmxlbmd0aClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0YXN5bmMgcmVhZEZpbGUodGhpczogdGVzdGluZy5GaWxlczxvYnNpZGlhbi5URmlsZSwgb2JzaWRpYW4uQXBwPiwgZmlsZTogb2JzaWRpYW4uVEZpbGUpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdFx0cmV0dXJuIHRoaXMuaW1wbC52YXVsdC5jYWNoZWRSZWFkKGZpbGUpXG5cdFx0fVxuXHR9KVxufVxuXG4iLCJjb25zdCBQQVNTRURfU0lHTkFMID0gXCI8PFBBU1NFRD4+XCJcbmNvbnN0IEZBSUxFRF9TSUdOQUwgPSBcIjw8RkFJTEVEPj5cIlxuY29uc3QgU0lHTkFMX0xFTkdUSCA9IE1hdGgubWF4KFBBU1NFRF9TSUdOQUwubGVuZ3RoLCBGQUlMRURfU0lHTkFMLmxlbmd0aClcblxuLyoqIFxuXHQqIGxvZ3MgcmVjZWl2ZWQgbWVzc2FnZXMgZnJvbSB0aGUgc29ja2V0LCBhbmQgcmVzb2x2ZXMgd2l0aCB0aGUgcmVjZWl2ZWQgc2lnbmFsXG5cdCpcblx0KiBAcGFyYW0ge2ltcG9ydChcIm5ldFwiKS5Tb2NrZXR9IHNvY2tldFxuXHQqIEBwYXJhbSB7aW1wb3J0KFwiLi4vaW8uanNcIikuTG9nZ2VyfSBsb2dnZXJcblx0KiBAcGFyYW0geyhwYXNzZWQ6IGJvb2xlYW4pID0+IHZvaWR9IHJlc29sdmUgXG5cdCogQHBhcmFtIHsoZXJyOiB1bmtub3duKSA9PiB2b2lkfSByZWplY3QgXG5cdCovXG5leHBvcnQgZnVuY3Rpb24gYXdhaXRSZXN1bHRTaWduYWwoc29ja2V0LCBsb2dnZXIsIHJlc29sdmUsIHJlamVjdCkge1xuXHRsZXQgYnVmZmVyID0gXCJcIjsgLy8gbW9zdCByZWNlbnQgY2hhcmFjdGVyc1xuXHRzb2NrZXQub24oXCJkYXRhXCIsIChkYXRhKSA9PiB7XG5cdFx0bGV0IHN0ciA9IGRhdGEudG9TdHJpbmcoKTtcblx0XHRidWZmZXIgPSAoYnVmZmVyICsgc3RyKS5zbGljZSgtU0lHTkFMX0xFTkdUSCkgLy8gb25seSBob2xkIHRoZSBsYXN0IGZldyBjaGFyc1xuXHRcdGZvciAoY29uc3QgbGluZSBvZiBzdHIuc3BsaXQoXCJcXG5cIikpIHtcblx0XHRcdGlmIChsaW5lLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0bG9nZ2VyLmluZm8obGluZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxuXHRzb2NrZXQub24oXCJlbmRcIiwgKCkgPT4ge1xuXHRcdGlmIChidWZmZXIuZW5kc1dpdGgoUEFTU0VEX1NJR05BTCkpIHtcblx0XHRcdHJlc29sdmUodHJ1ZSlcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKGJ1ZmZlci5lbmRzV2l0aChGQUlMRURfU0lHTkFMKSkge1xuXHRcdFx0cmVzb2x2ZShmYWxzZSlcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRyZWplY3QobmV3IEVycm9yKFwic29ja2V0IGVuZGVkIHdpdGggdW5rbm93biBzdGF0ZVwiKSkgLy8gaWYgd2UgbmV2ZXIgc2VudCBhIHNpZ25hbCwgcHJvYmFibHkgc29tZXRoaW5nIHdlbnQgd3Jvbmdcblx0fSlcbn1cblxuLyoqIFxuXHQqIEBwYXJhbSB7aW1wb3J0KFwibmV0XCIpLlNvY2tldH0gc29ja2V0XG5cdCogQHBhcmFtIHtib29sZWFufSBwYXNzZWRcblx0Ki9cbmV4cG9ydCBmdW5jdGlvbiBzZW5kUmVzdWx0U2lnbmFsKHNvY2tldCwgcGFzc2VkKSB7XG5cdHNvY2tldC53cml0ZShwYXNzZWQgPyBQQVNTRURfU0lHTkFMIDogRkFJTEVEX1NJR05BTCwgKCkgPT4gc29ja2V0LmVuZCgpKVxufVxuIiwiZXhwb3J0IGNsYXNzIFNlYXJjaDxUID0gYW55PiB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHB1YmxpYyByZWFkb25seSBpbXBsOiBULFxuXHRcdHB1YmxpYyByZWFkb25seSBzZWFyY2hGb3I6ICh0aGlzOiBTZWFyY2g8VD4sIHF1ZXJ5OiBzdHJpbmcpID0+IFByb21pc2U8QXJyYXk8TWF0Y2g+Pixcblx0KSB7IH1cbn1cblxuY2xhc3MgTWF0Y2gge1xuXHRuYW1lOiBzdHJpbmc7XG5cdHBhdGg6IHN0cmluZztcbn1cbiIsImltcG9ydCB7IEFzeW5jRmlsdGVyLCBGaWx0ZXIgfSBmcm9tIFwiLi9GaWxlRmlsdGVyXCI7XG5cbmV4cG9ydCBjbGFzcyBBbmRGaWx0ZXI8VD4ge1xuXHRmaWx0ZXJzO1xuXG5cdGNvbnN0cnVjdG9yKGRlZjogeyBmaWx0ZXJzOiBbRmlsdGVyPFQ+LCAuLi5GaWx0ZXI8VD5bXV0gfSkge1xuXHRcdHRoaXMuZmlsdGVycyA9IGRlZi5maWx0ZXJzO1xuXHR9XG5cblx0YXBwbGllc1RvKHRoaXM6IEFuZEZpbHRlcjxUPiwgY2hlY2s6IFQpOiBib29sZWFuIHtcblx0XHRmb3IgKGNvbnN0IGZpbHRlciBvZiB0aGlzLmZpbHRlcnMpIHtcblx0XHRcdGlmICghZmlsdGVyLmFwcGxpZXNUbyhjaGVjaykpIHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRzdGF0aWMgI2ZpbHRlckFwcGxpZXMgPSA8VD4oZmlsdGVyOiBGaWx0ZXI8VCwgQW5kRmlsdGVyPFQ+PiwgY2hlY2s6IFQpOiBib29sZWFuID0+IHtcblx0XHRyZXR1cm4gZmlsdGVyLmltcGwuYXBwbGllc1RvKGNoZWNrKTtcblx0fVxuXG5cdGZpbHRlcih0aGlzOiBBbmRGaWx0ZXI8VD4pOiBGaWx0ZXI8VCwgQW5kRmlsdGVyPFQ+PiB7XG5cdFx0cmV0dXJuIG5ldyBGaWx0ZXIoe1xuXHRcdFx0aW1wbDogdGhpcyxcblx0XHRcdGFwcGxpZXNGbjogQW5kRmlsdGVyLiNmaWx0ZXJBcHBsaWVzLFxuXHRcdH0pO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGw8VD4oZmlyc3RfZmlsdGVyOiBGaWx0ZXI8VD4sIC4uLmZpbHRlcnM6IEZpbHRlcjxUPltdKTogRmlsdGVyPFQ+IHtcblx0aWYgKGZpbHRlcnMubGVuZ3RoID09PSAwKSByZXR1cm4gZmlyc3RfZmlsdGVyO1xuXHRyZXR1cm4gbmV3IEFuZEZpbHRlcih7IGZpbHRlcnM6IFtmaXJzdF9maWx0ZXIsIC4uLmZpbHRlcnNdIH0pLmZpbHRlcigpO1xufVxuXG5leHBvcnQgY2xhc3MgQXN5bmNBbmRGaWx0ZXI8VD4ge1xuXHRmaWx0ZXJzO1xuXG5cdGNvbnN0cnVjdG9yKGRlZjogeyBmaWx0ZXJzOiBbQXN5bmNGaWx0ZXI8VD4sIC4uLkFzeW5jRmlsdGVyPFQ+W11dIH0pIHtcblx0XHR0aGlzLmZpbHRlcnMgPSBkZWYuZmlsdGVycztcblx0fVxuXG5cdGFzeW5jIGFwcGxpZXNUbyh0aGlzOiBBc3luY0FuZEZpbHRlcjxUPiwgY2hlY2s6IFQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCBhbGwgPSBhd2FpdCBQcm9taXNlLmFsbChcblx0XHRcdHRoaXMuZmlsdGVycy5tYXAoaXQgPT4gaXQuYXBwbGllc1RvKGNoZWNrKSlcblx0XHQpO1xuXHRcdHJldHVybiBhbGwuZXZlcnkoaXQgPT4gaXQpO1xuXHR9XG5cblx0c3RhdGljICNmaWx0ZXJBcHBsaWVzID0gPFQ+KGZpbHRlcjogQXN5bmNGaWx0ZXI8VCwgQXN5bmNBbmRGaWx0ZXI8VD4+LCBjaGVjazogVCk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuXHRcdHJldHVybiBmaWx0ZXIuaW1wbC5hcHBsaWVzVG8oY2hlY2spO1xuXHR9XG5cblx0ZmlsdGVyKHRoaXM6IEFzeW5jQW5kRmlsdGVyPFQ+KTogQXN5bmNGaWx0ZXI8VCwgQXN5bmNBbmRGaWx0ZXI8VD4+IHtcblx0XHRyZXR1cm4gbmV3IEFzeW5jRmlsdGVyKHtcblx0XHRcdGltcGw6IHRoaXMsXG5cdFx0XHRhcHBsaWVzRm46IEFzeW5jQW5kRmlsdGVyLiNmaWx0ZXJBcHBsaWVzLFxuXHRcdH0pO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxBc3luYzxUPihmaXJzdF9maWx0ZXI6IEFzeW5jRmlsdGVyPFQ+LCAuLi5maWx0ZXJzOiBBc3luY0ZpbHRlcjxUPltdKTogQXN5bmNGaWx0ZXI8VD4ge1xuXHRpZiAoZmlsdGVycy5sZW5ndGggPT09IDApIHJldHVybiBmaXJzdF9maWx0ZXI7XG5cdHJldHVybiBuZXcgQXN5bmNBbmRGaWx0ZXIoeyBmaWx0ZXJzOiBbZmlyc3RfZmlsdGVyLCAuLi5maWx0ZXJzXSB9KS5maWx0ZXIoKTtcbn1cblxuZXhwb3J0IHsgYWxsIGFzIG1hdGNoQWxsIH1cbiIsImltcG9ydCB7IEFzeW5jRmlsdGVyLCBGaWx0ZXIgfSBmcm9tIFwiLi9GaWxlRmlsdGVyXCI7XG5cbmV4cG9ydCBjbGFzcyBPckZpbHRlcjxUPiB7XG5cdGZpbHRlcnM7XG5cblx0Y29uc3RydWN0b3IoZGVmOiB7IGZpbHRlcnM6IFtGaWx0ZXI8VD4sIC4uLkZpbHRlcjxUPltdXSB9KSB7XG5cdFx0dGhpcy5maWx0ZXJzID0gZGVmLmZpbHRlcnM7XG5cdH1cblxuXHRhcHBsaWVzVG8odGhpczogT3JGaWx0ZXI8VD4sIGNoZWNrOiBUKTogYm9vbGVhbiB7XG5cdFx0Zm9yIChjb25zdCBmaWx0ZXIgb2YgdGhpcy5maWx0ZXJzKSB7XG5cdFx0XHRpZiAoZmlsdGVyLmFwcGxpZXNUbyhjaGVjaykpIHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRzdGF0aWMgI2ZpbHRlckFwcGxpZXMgPSA8VD4oZmlsdGVyOiBGaWx0ZXI8VCwgT3JGaWx0ZXI8VD4+LCBjaGVjazogVCk6IGJvb2xlYW4gPT4ge1xuXHRcdHJldHVybiBmaWx0ZXIuaW1wbC5hcHBsaWVzVG8oY2hlY2spO1xuXHR9XG5cblx0ZmlsdGVyKHRoaXM6IE9yRmlsdGVyPFQ+KTogRmlsdGVyPFQsIE9yRmlsdGVyPFQ+PiB7XG5cdFx0cmV0dXJuIG5ldyBGaWx0ZXIoe1xuXHRcdFx0aW1wbDogdGhpcyxcblx0XHRcdGFwcGxpZXNGbjogT3JGaWx0ZXIuI2ZpbHRlckFwcGxpZXMsXG5cdFx0fSk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFueTxUPihmaXJzdF9maWx0ZXI6IEZpbHRlcjxUPiwgLi4uZmlsdGVyczogRmlsdGVyPFQ+W10pOiBGaWx0ZXI8VD4ge1xuXHRpZiAoZmlsdGVycy5sZW5ndGggPT09IDApIHJldHVybiBmaXJzdF9maWx0ZXI7XG5cdGlmIChmaXJzdF9maWx0ZXIuaW1wbCBpbnN0YW5jZW9mIE9yRmlsdGVyKSB7XG5cdFx0cmV0dXJuIG5ldyBPckZpbHRlcih7IGZpbHRlcnM6IFsuLi5maXJzdF9maWx0ZXIuaW1wbC5maWx0ZXJzLCAuLi5maWx0ZXJzXSB9KS5maWx0ZXIoKTtcblx0fVxuXHRyZXR1cm4gbmV3IE9yRmlsdGVyKHsgZmlsdGVyczogW2ZpcnN0X2ZpbHRlciwgLi4uZmlsdGVyc10gfSkuZmlsdGVyKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbnlBc3luYzxUPihmaXJzdF9maWx0ZXI6IEFzeW5jRmlsdGVyPFQ+LCAuLi5maWx0ZXJzOiBBc3luY0ZpbHRlcjxUPltdKTogQXN5bmNGaWx0ZXI8VD4ge1xuXHRpZiAoZmlsdGVycy5sZW5ndGggPT09IDApIHJldHVybiBmaXJzdF9maWx0ZXI7XG5cdGlmIChmaXJzdF9maWx0ZXIuaW1wbCBpbnN0YW5jZW9mIEFzeW5jT3JGaWx0ZXIpIHtcblx0XHRyZXR1cm4gbmV3IEFzeW5jT3JGaWx0ZXIoeyBmaWx0ZXJzOiBbLi4uZmlyc3RfZmlsdGVyLmltcGwuZmlsdGVycywgLi4uZmlsdGVyc10gfSkuZmlsdGVyKCk7XG5cdH1cblx0cmV0dXJuIG5ldyBBc3luY09yRmlsdGVyKHsgZmlsdGVyczogW2ZpcnN0X2ZpbHRlciwgLi4uZmlsdGVyc10gfSkuZmlsdGVyKCk7XG59XG5cbmV4cG9ydCBjbGFzcyBBc3luY09yRmlsdGVyPFQ+IHtcblx0ZmlsdGVycztcblxuXHRjb25zdHJ1Y3RvcihkZWY6IHsgZmlsdGVyczogW0FzeW5jRmlsdGVyPFQ+LCAuLi5Bc3luY0ZpbHRlcjxUPltdXSB9KSB7XG5cdFx0dGhpcy5maWx0ZXJzID0gZGVmLmZpbHRlcnM7XG5cdH1cblxuXHRhc3luYyBhcHBsaWVzVG8odGhpczogQXN5bmNPckZpbHRlcjxUPiwgY2hlY2s6IFQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCBhbGwgPSBhd2FpdCBQcm9taXNlLmFsbChcblx0XHRcdHRoaXMuZmlsdGVycy5tYXAoaXQgPT4gaXQuYXBwbGllc1RvKGNoZWNrKSlcblx0XHQpO1xuXHRcdHJldHVybiBhbGwuc29tZShpdCA9PiBpdCk7XG5cdH1cblxuXHRzdGF0aWMgI2ZpbHRlckFwcGxpZXMgPSA8VD4oZmlsdGVyOiBBc3luY0ZpbHRlcjxULCBBc3luY09yRmlsdGVyPFQ+PiwgY2hlY2s6IFQpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcblx0XHRyZXR1cm4gZmlsdGVyLmltcGwuYXBwbGllc1RvKGNoZWNrKTtcblx0fVxuXG5cdGZpbHRlcih0aGlzOiBBc3luY09yRmlsdGVyPFQ+KTogQXN5bmNGaWx0ZXI8VCwgQXN5bmNPckZpbHRlcjxUPj4ge1xuXHRcdHJldHVybiBuZXcgQXN5bmNGaWx0ZXIoe1xuXHRcdFx0aW1wbDogdGhpcyxcblx0XHRcdGFwcGxpZXNGbjogQXN5bmNPckZpbHRlci4jZmlsdGVyQXBwbGllcyxcblx0XHR9KTtcblx0fVxufVxuIiwiaW1wb3J0IHsgQXN5bmNGaWx0ZXIsIEZpbHRlciB9IGZyb20gXCIuL0ZpbGVGaWx0ZXJcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIG5lZ2F0ZTxUPihmaWx0ZXI6IEZpbHRlcjxUPik6IEZpbHRlcjxUPiB7XG5cdGlmIChmaWx0ZXIuaW1wbCBpbnN0YW5jZW9mIE5lZ2F0aW9uKSB7XG5cdFx0cmV0dXJuIGZpbHRlci5pbXBsLm5lZ2F0ZWQ7XG5cdH1cblx0cmV0dXJuIG5ldyBOZWdhdGlvbih7IGZpbHRlciB9KS5maWx0ZXIoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5lZ2F0ZUFzeW5jPFQ+KGZpbHRlcjogQXN5bmNGaWx0ZXI8VD4pOiBBc3luY0ZpbHRlcjxUPiB7XG5cdGlmIChmaWx0ZXIuaW1wbCBpbnN0YW5jZW9mIEFzeW5jTmVnYXRpb24pIHtcblx0XHRyZXR1cm4gZmlsdGVyLmltcGwubmVnYXRlZDtcblx0fVxuXHRyZXR1cm4gbmV3IEFzeW5jTmVnYXRpb24oeyBmaWx0ZXIgfSkuZmlsdGVyKCk7XG59XG5cbmV4cG9ydCBjbGFzcyBOZWdhdGlvbjxUPiB7XG5cdG5lZ2F0ZWQ7XG5cblx0Y29uc3RydWN0b3IoZGVmOiB7IGZpbHRlcjogRmlsdGVyPFQ+IH0pIHtcblx0XHR0aGlzLm5lZ2F0ZWQgPSBkZWYuZmlsdGVyO1xuXHR9XG5cblx0c3RhdGljICNmaWx0ZXJBcHBsaWVzPFQ+KHRoaXM6IHZvaWQsIGZpbHRlcjogRmlsdGVyPFQsIE5lZ2F0aW9uPFQ+PiwgY2hlY2s6IFQpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gIWZpbHRlci5pbXBsLm5lZ2F0ZWQuYXBwbGllc1RvKGNoZWNrKVxuXHR9XG5cblx0ZmlsdGVyKHRoaXM6IE5lZ2F0aW9uPFQ+KTogRmlsdGVyPFQ+IHtcblx0XHRyZXR1cm4gbmV3IEZpbHRlcih7XG5cdFx0XHRpbXBsOiB0aGlzLFxuXHRcdFx0YXBwbGllc0ZuOiBOZWdhdGlvbi4jZmlsdGVyQXBwbGllcyxcblx0XHR9KVxuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBBc3luY05lZ2F0aW9uPFQ+IHtcblx0bmVnYXRlZDtcblxuXHRjb25zdHJ1Y3RvcihkZWY6IHsgZmlsdGVyOiBBc3luY0ZpbHRlcjxUPiB9KSB7XG5cdFx0dGhpcy5uZWdhdGVkID0gZGVmLmZpbHRlcjtcblx0fVxuXG5cdHN0YXRpYyBhc3luYyAjZmlsdGVyQXBwbGllczxUPih0aGlzOiB2b2lkLCBmaWx0ZXI6IEFzeW5jRmlsdGVyPFQsIEFzeW5jTmVnYXRpb248VD4+LCBjaGVjazogVCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHJldHVybiAhYXdhaXQgZmlsdGVyLmltcGwubmVnYXRlZC5hcHBsaWVzVG8oY2hlY2spXG5cdH1cblxuXHRmaWx0ZXIodGhpczogQXN5bmNOZWdhdGlvbjxUPik6IEFzeW5jRmlsdGVyPFQ+IHtcblx0XHRyZXR1cm4gbmV3IEFzeW5jRmlsdGVyKHtcblx0XHRcdGltcGw6IHRoaXMsXG5cdFx0XHRhcHBsaWVzRm46IEFzeW5jTmVnYXRpb24uI2ZpbHRlckFwcGxpZXMsXG5cdFx0fSlcblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgKiBhcyBvYnNpZGlhbiBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGFsbCwgYWxsQXN5bmMgfSBmcm9tIFwiLi9NYXRjaEFsbEZpbHRlclwiO1xuaW1wb3J0IHsgYW55LCBhbnlBc3luYywgQXN5bmNPckZpbHRlciwgT3JGaWx0ZXIgfSBmcm9tIFwiLi9PckZpbHRlclwiO1xuaW1wb3J0IHsgbmVnYXRlLCBuZWdhdGVBc3luYyB9IGZyb20gXCIuL05lZ2F0aW9uXCI7XG5cbmV4cG9ydCBjbGFzcyBGaWx0ZXI8VCwgSW1wbCA9IGFueT4ge1xuXHRpbXBsOiBJbXBsO1xuXHRhcHBsaWVzRm46IChmaWx0ZXI6IEZpbHRlcjxULCBJbXBsPiwgY2hlY2s6IFQpID0+IGJvb2xlYW47XG5cblx0Y29uc3RydWN0b3IoZGVmOiB7IGltcGw6IEltcGwsIGFwcGxpZXNGbjogKGZpbHRlcjogRmlsdGVyPFQsIEltcGw+LCBjaGVjazogVCkgPT4gYm9vbGVhbiB9KSB7XG5cdFx0dGhpcy5pbXBsID0gZGVmLmltcGw7XG5cdFx0dGhpcy5hcHBsaWVzRm4gPSBkZWYuYXBwbGllc0ZuO1xuXHR9XG5cblx0YXBwbGllc1RvKHRoaXM6IEZpbHRlcjxULCBJbXBsPiwgY2hlY2s6IFQpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5hcHBsaWVzRm4odGhpcywgY2hlY2spO1xuXHR9XG5cblx0YW5kKHRoaXM6IEZpbHRlcjxULCBJbXBsPiwgb3RoZXI6IEZpbHRlcjxUPik6IEZpbHRlcjxUPiB7XG5cdFx0cmV0dXJuIGFsbCh0aGlzLCBvdGhlcik7XG5cdH1cblxuXHRvcih0aGlzOiBGaWx0ZXI8VCwgSW1wbD4sIG90aGVyOiBGaWx0ZXI8VD4pOiBGaWx0ZXI8VD4ge1xuXHRcdGlmIChvdGhlci5pbXBsIGluc3RhbmNlb2YgT3JGaWx0ZXIpIHtcblx0XHRcdHJldHVybiBhbnkodGhpcywgLi4ub3RoZXIuaW1wbC5maWx0ZXJzKVxuXHRcdH1cblx0XHRyZXR1cm4gYW55KHRoaXMsIG90aGVyKTtcblx0fVxuXG5cdG5lZ2F0ZWQodGhpczogRmlsdGVyPFQsIEltcGw+KTogRmlsdGVyPFQ+IHtcblx0XHRyZXR1cm4gbmVnYXRlKHRoaXMpO1xuXHR9XG5cblx0c3RhdGljICNhc3luY0FwcGxpZXMgPSBhc3luYyA8VCwgSW1wbD4oZmlsdGVyOiBBc3luY0ZpbHRlcjxULCBGaWx0ZXI8VCwgSW1wbD4+LCBjaGVjazogVCk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuXHRcdHJldHVybiBmaWx0ZXIuaW1wbC5hcHBsaWVzVG8oY2hlY2spXG5cdH1cblxuXHRhc3luYyh0aGlzOiBGaWx0ZXI8VCwgSW1wbD4pOiBBc3luY0ZpbHRlcjxUPiB7XG5cdFx0cmV0dXJuIG5ldyBBc3luY0ZpbHRlcih7XG5cdFx0XHRpbXBsOiB0aGlzLFxuXHRcdFx0YXBwbGllc0ZuOiBGaWx0ZXIuI2FzeW5jQXBwbGllcyxcblx0XHR9KVxuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBBc3luY0ZpbHRlcjxULCBJbXBsID0gYW55PiB7XG5cdGltcGw6IEltcGw7XG5cdGFwcGxpZXNGbjogKGZpbHRlcjogQXN5bmNGaWx0ZXI8VCwgSW1wbD4sIGNoZWNrOiBUKSA9PiBQcm9taXNlPGJvb2xlYW4+O1xuXG5cdGNvbnN0cnVjdG9yKGRlZjogeyBpbXBsOiBJbXBsLCBhcHBsaWVzRm46IChmaWx0ZXI6IEFzeW5jRmlsdGVyPFQsIEltcGw+LCBjaGVjazogVCkgPT4gUHJvbWlzZTxib29sZWFuPiB9KSB7XG5cdFx0dGhpcy5pbXBsID0gZGVmLmltcGw7XG5cdFx0dGhpcy5hcHBsaWVzRm4gPSBkZWYuYXBwbGllc0ZuO1xuXHR9XG5cblx0YXBwbGllc1RvKHRoaXM6IEFzeW5jRmlsdGVyPFQsIEltcGw+LCBjaGVjazogVCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHJldHVybiB0aGlzLmFwcGxpZXNGbih0aGlzLCBjaGVjayk7XG5cdH1cblxuXHRhbmQodGhpczogQXN5bmNGaWx0ZXI8VCwgSW1wbD4sIG90aGVyOiBBc3luY0ZpbHRlcjxUPik6IEFzeW5jRmlsdGVyPFQ+IHtcblx0XHRyZXR1cm4gYWxsQXN5bmModGhpcywgb3RoZXIpO1xuXHR9XG5cblx0b3IodGhpczogQXN5bmNGaWx0ZXI8VCwgSW1wbD4sIG90aGVyOiBBc3luY0ZpbHRlcjxUPik6IEFzeW5jRmlsdGVyPFQ+IHtcblx0XHRpZiAob3RoZXIuaW1wbCBpbnN0YW5jZW9mIEFzeW5jT3JGaWx0ZXIpIHtcblx0XHRcdHJldHVybiBhbnlBc3luYyh0aGlzLCAuLi5vdGhlci5pbXBsLmZpbHRlcnMpXG5cdFx0fVxuXHRcdHJldHVybiBhbnlBc3luYyh0aGlzLCBvdGhlcik7XG5cdH1cblxuXHRuZWdhdGVkKHRoaXM6IEFzeW5jRmlsdGVyPFQsIEltcGw+KTogQXN5bmNGaWx0ZXI8VD4ge1xuXHRcdHJldHVybiBuZWdhdGVBc3luYyh0aGlzKTtcblx0fVxufVxuXG5leHBvcnQgdHlwZSBGaWxlRmlsdGVyPEltcGwgPSBhbnk+ID0gRmlsdGVyPG9ic2lkaWFuLlRGaWxlLCBJbXBsPlxuZXhwb3J0IHR5cGUgQXN5bmNGaWxlRmlsdGVyPEltcGwgPSBhbnk+ID0gQXN5bmNGaWx0ZXI8b2JzaWRpYW4uVEZpbGUsIEltcGw+XG4iLCJpbXBvcnQgdHlwZSB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBBc3luY0ZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgeyBTdHJpbmdNYXRjaGVyIH0gZnJvbSBcIi4uL21hdGNoZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb250ZW50KG1hdGNoZXI6IFN0cmluZ01hdGNoZXIpOiBBc3luY0ZpbHRlcjxURmlsZSwgQ29udGVudEZpbHRlcj4ge1xuXHRyZXR1cm4gbmV3IENvbnRlbnRGaWx0ZXIoeyBtYXRjaGVyIH0pLmZpbHRlcigpO1xufVxuXG5leHBvcnQgY2xhc3MgQ29udGVudEZpbHRlciB7XG5cdG1hdGNoZXI7XG5cblx0Y29uc3RydWN0b3IoZGVmOiB7XG5cdFx0bWF0Y2hlcjogU3RyaW5nTWF0Y2hlcixcblx0fSkge1xuXHRcdHRoaXMubWF0Y2hlciA9IGRlZi5tYXRjaGVyO1xuXHR9XG5cblx0c3RhdGljICNmaWx0ZXJBcHBsaWVzID0gKGZpbHRlcjogQXN5bmNGaWx0ZXI8VEZpbGUsIENvbnRlbnRGaWx0ZXI+LCBjaGVjazogVEZpbGUpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcblx0XHRyZXR1cm4gZmlsdGVyLmltcGwuYXBwbGllc1RvKGNoZWNrKTtcblx0fVxuXG5cdGZpbHRlcih0aGlzOiBDb250ZW50RmlsdGVyKTogQXN5bmNGaWx0ZXI8VEZpbGUsIENvbnRlbnRGaWx0ZXI+IHtcblx0XHRyZXR1cm4gbmV3IEFzeW5jRmlsdGVyKHtcblx0XHRcdGltcGw6IHRoaXMsXG5cdFx0XHRhcHBsaWVzRm46IENvbnRlbnRGaWx0ZXIuI2ZpbHRlckFwcGxpZXMsXG5cdFx0fSlcblx0fVxuXG5cdGFzeW5jIGFwcGxpZXNUbyh0aGlzOiBDb250ZW50RmlsdGVyLCBmaWxlOiBURmlsZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHJldHVybiB0aGlzLm1hdGNoZXIubWF0Y2hlcyhhd2FpdCBmaWxlLnZhdWx0LmNhY2hlZFJlYWQoZmlsZSkpXG5cdH1cbn1cbiIsImltcG9ydCB0eXBlIHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCAqIGFzIGZpbHRlcnMgZnJvbSBcInNyYy9maWx0ZXJzXCI7XG5pbXBvcnQgeyBTdHJpbmdNYXRjaGVyIH0gZnJvbSBcIi4uL21hdGNoZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWxlKGNoZWNrZXI6IFN0cmluZ01hdGNoZXIpOiBmaWx0ZXJzLkZpbGVGaWx0ZXI8TmFtZUZpbHRlcj4ge1xuXHRyZXR1cm4gbmV3IE5hbWVGaWx0ZXIoeyBtYXRjaGVyOiBjaGVja2VyIH0pLmZpbHRlcigpXG59XG5cbmV4cG9ydCBjbGFzcyBOYW1lRmlsdGVyIHtcblx0bWF0Y2hlcjtcblxuXHRjb25zdHJ1Y3RvcihkZWY6IHsgbWF0Y2hlcjogU3RyaW5nTWF0Y2hlciB9KSB7XG5cdFx0dGhpcy5tYXRjaGVyID0gZGVmLm1hdGNoZXI7XG5cdH1cblxuXHRzdGF0aWMgI2ZpbHRlckFwcGxpZXMgPSAoZmlsdGVyOiBmaWx0ZXJzLkZpbGVGaWx0ZXI8TmFtZUZpbHRlcj4sIGZpbGU6IFRGaWxlKTogYm9vbGVhbiA9PiB7XG5cdFx0cmV0dXJuIGZpbHRlci5pbXBsLmFwcGxpZXNUbyhmaWxlKTtcblx0fVxuXG5cdGZpbHRlcih0aGlzOiBOYW1lRmlsdGVyKTogZmlsdGVycy5GaWxlRmlsdGVyPE5hbWVGaWx0ZXI+IHtcblx0XHRyZXR1cm4gbmV3IGZpbHRlcnMuRmlsdGVyKHtcblx0XHRcdGltcGw6IHRoaXMsXG5cdFx0XHRhcHBsaWVzRm46IE5hbWVGaWx0ZXIuI2ZpbHRlckFwcGxpZXMsXG5cdFx0fSk7XG5cdH1cblxuXHRhcHBsaWVzVG8odGhpczogTmFtZUZpbHRlciwgZmlsZTogUGljazxURmlsZSwgJ2Jhc2VuYW1lJz4pOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5tYXRjaGVyLm1hdGNoZXMoZmlsZS5iYXNlbmFtZSk7XG5cdH1cbn1cbiIsImltcG9ydCB0eXBlICogYXMgb2JzaWRpYW4gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgKiBhcyBmaWx0ZXJzIGZyb20gXCJzcmMvZmlsdGVyc1wiO1xuaW1wb3J0ICogYXMgbWF0Y2hlcnMgZnJvbSBcIi4uL21hdGNoZXJzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRoKG1hdGNoZXI6IG1hdGNoZXJzLlN0cmluZ01hdGNoZXIpOiBmaWx0ZXJzLkZpbHRlcjxvYnNpZGlhbi5URmlsZSwgUGF0aEZpbHRlcj4ge1xuXHRyZXR1cm4gbmV3IFBhdGhGaWx0ZXIoeyBtYXRjaGVyIH0pLmZpbHRlcigpO1xufVxuXG5leHBvcnQgY2xhc3MgUGF0aEZpbHRlciB7XG5cdG1hdGNoZXI7XG5cblx0Y29uc3RydWN0b3IoZGVmOiB7IG1hdGNoZXI6IG1hdGNoZXJzLlN0cmluZ01hdGNoZXIgfSkge1xuXHRcdHRoaXMubWF0Y2hlciA9IGRlZi5tYXRjaGVyO1xuXHR9XG5cblx0YXBwbGllc1RvKHRoaXM6IFBhdGhGaWx0ZXIsIGZpbGU6IFBpY2s8b2JzaWRpYW4uVEZpbGUsIFwicGF0aFwiPik6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLm1hdGNoZXIubWF0Y2hlcyhmaWxlLnBhdGgpO1xuXHR9XG5cblx0c3RhdGljICNmaWx0ZXJBcHBsaWVzID0gYXN5bmMgKGZpbHRlcjogZmlsdGVycy5GaWx0ZXI8b2JzaWRpYW4uVEZpbGUsIFBhdGhGaWx0ZXI+LCBmaWxlOiBvYnNpZGlhbi5URmlsZSk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuXHRcdHJldHVybiBmaWx0ZXIuaW1wbC5hcHBsaWVzVG8oZmlsZSk7XG5cdH1cblxuXHRmaWx0ZXIodGhpczogUGF0aEZpbHRlcik6IGZpbHRlcnMuRmlsdGVyPG9ic2lkaWFuLlRGaWxlLCBQYXRoRmlsdGVyPiB7XG5cdFx0cmV0dXJuIG5ldyBmaWx0ZXJzLkZpbHRlcih7XG5cdFx0XHRpbXBsOiB0aGlzLFxuXHRcdFx0YXBwbGllc0ZuOiBQYXRoRmlsdGVyLiNmaWx0ZXJBcHBsaWVzLFxuXHRcdH0pXG5cdH1cbn1cbiIsImltcG9ydCB0eXBlICogYXMgb2JzaWRpYW4gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyB0eXBlIEZpbGVGaWx0ZXIsIEZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgKiBhcyBtYXRjaGVycyBmcm9tIFwic3JjL21hdGNoZXJzXCI7XG5cblxuZXhwb3J0IGNsYXNzIFByb3BlcnR5TmFtZUZpbHRlciB7XG5cdG1hdGNoZXI7XG5cblx0Y29uc3RydWN0b3IoZGVmOiB7IG1hdGNoZXI6IG1hdGNoZXJzLlN0cmluZ01hdGNoZXIgfSkge1xuXHRcdHRoaXMubWF0Y2hlciA9IGRlZi5tYXRjaGVyO1xuXHR9XG5cblx0c3RhdGljICNmaWx0ZXJBcHBsaWVzID0gKGZpbHRlcjogRmlsdGVyPG9ic2lkaWFuLkZyb250TWF0dGVyQ2FjaGUsIFByb3BlcnR5TmFtZUZpbHRlcj4sIGZyb250bWF0dGVyOiBvYnNpZGlhbi5Gcm9udE1hdHRlckNhY2hlKTogYm9vbGVhbiA9PiB7XG5cdFx0cmV0dXJuIGZpbHRlci5pbXBsLmFwcGxpZXNUbyhmcm9udG1hdHRlcik7XG5cdH1cblxuXHRhcHBsaWVzVG8odGhpczogUHJvcGVydHlOYW1lRmlsdGVyLCBmcm9udG1hdHRlcjogb2JzaWRpYW4uRnJvbnRNYXR0ZXJDYWNoZSk6IGJvb2xlYW4ge1xuXHRcdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGZyb250bWF0dGVyKSkge1xuXHRcdFx0aWYgKHRoaXMubWF0Y2hlci5tYXRjaGVzKGtleSkpIHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRmaWx0ZXIodGhpczogUHJvcGVydHlOYW1lRmlsdGVyKTogRmlsdGVyPG9ic2lkaWFuLkZyb250TWF0dGVyQ2FjaGU+IHtcblx0XHRyZXR1cm4gbmV3IEZpbHRlcih7XG5cdFx0XHRpbXBsOiB0aGlzLFxuXHRcdFx0YXBwbGllc0ZuOiBQcm9wZXJ0eU5hbWVGaWx0ZXIuI2ZpbHRlckFwcGxpZXMsXG5cdFx0fSk7XG5cdH1cbn1cblxuZXhwb3J0IHR5cGUgRnJvbnRtYXR0ZXJGaWx0ZXIgPSBGaWx0ZXI8b2JzaWRpYW4uRnJvbnRNYXR0ZXJDYWNoZT5cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3BlcnR5TmFtZShtYXRjaGVyOiBtYXRjaGVycy5TdHJpbmdNYXRjaGVyKTogRnJvbnRtYXR0ZXJGaWx0ZXIge1xuXHRyZXR1cm4gbmV3IFByb3BlcnR5TmFtZUZpbHRlcih7IG1hdGNoZXIgfSkuZmlsdGVyKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0eShwcm9wX21hdGNoZXI6IEZyb250bWF0dGVyRmlsdGVyLCBtZXRhZGF0YUNhY2hlOiBQaWNrPG9ic2lkaWFuLk1ldGFkYXRhQ2FjaGUsICdnZXRGaWxlQ2FjaGUnPikge1xuXHRyZXR1cm4gbmV3IFByb3BlcnR5RmlsdGVyKHsgcHJvcGVydHk6IHByb3BfbWF0Y2hlciwgdmFsdWU6IG51bGwsIG1ldGFkYXRhQ2FjaGUgfSkuZmlsZUZpbHRlcigpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHlWYWx1ZShcblx0cHJvcF9tYXRjaGVyOiBGcm9udG1hdHRlckZpbHRlcixcblx0dmFsdWVfbWF0Y2hlcjogbWF0Y2hlcnMuU3RyaW5nTWF0Y2hlcixcblx0bWV0YWRhdGFDYWNoZTogUGljazxvYnNpZGlhbi5NZXRhZGF0YUNhY2hlLCAnZ2V0RmlsZUNhY2hlJz4sXG4pIHtcblx0cmV0dXJuIG5ldyBQcm9wZXJ0eUZpbHRlcih7XG5cdFx0cHJvcGVydHk6IHByb3BfbWF0Y2hlcixcblx0XHR2YWx1ZTogdmFsdWVfbWF0Y2hlcixcblx0XHRtZXRhZGF0YUNhY2hlXG5cdH0pLmZpbGVGaWx0ZXIoKTtcbn1cblxuZXhwb3J0IGNsYXNzIFByb3BlcnR5RmlsdGVyIHtcblx0bmFtZTtcblx0dmFsdWU7XG5cdG1hdGFkYXRhQ2FjaGU7XG5cblx0Y29uc3RydWN0b3IoZGVmOiB7XG5cdFx0cHJvcGVydHk6IEZyb250bWF0dGVyRmlsdGVyLFxuXHRcdHZhbHVlOiBtYXRjaGVycy5TdHJpbmdNYXRjaGVyIHwgbnVsbCxcblx0XHRtZXRhZGF0YUNhY2hlOiBQaWNrPG9ic2lkaWFuLk1ldGFkYXRhQ2FjaGUsICdnZXRGaWxlQ2FjaGUnPixcblx0fSkge1xuXHRcdHRoaXMubmFtZSA9IGRlZi5wcm9wZXJ0eTtcblx0XHR0aGlzLnZhbHVlID0gZGVmLnZhbHVlO1xuXHRcdHRoaXMubWF0YWRhdGFDYWNoZSA9IGRlZi5tZXRhZGF0YUNhY2hlO1xuXHR9XG5cblx0c3RhdGljICNmaWx0ZXJBcHBsaWVzID0gKGZpbHRlcjogRmlsZUZpbHRlcjxQcm9wZXJ0eUZpbHRlcj4sIGZpbGU6IG9ic2lkaWFuLlRGaWxlKTogYm9vbGVhbiA9PiB7XG5cdFx0cmV0dXJuIGZpbHRlci5pbXBsLmFwcGxpZXNUbyhmaWxlKTtcblx0fVxuXG5cdGFwcGxpZXNUbyh0aGlzOiBQcm9wZXJ0eUZpbHRlciwgZmlsZTogb2JzaWRpYW4uVEZpbGUpOiBib29sZWFuIHtcblx0XHRjb25zdCBtZXRhZGF0YSA9IHRoaXMubWF0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSkgPz8ge307XG5cdFx0Y29uc3QgZnJvbnRtYXR0ZXIgPSBtZXRhZGF0YS5mcm9udG1hdHRlcjtcblx0XHRpZiAoIWZyb250bWF0dGVyKSByZXR1cm4gZmFsc2U7XG5cblx0XHRyZXR1cm4gdGhpcy5uYW1lLmFwcGxpZXNUbyhmcm9udG1hdHRlcilcblx0fVxuXG5cdGZpbGVGaWx0ZXIodGhpczogUHJvcGVydHlGaWx0ZXIpOiBGaWxlRmlsdGVyPFByb3BlcnR5RmlsdGVyPiB7XG5cdFx0cmV0dXJuIG5ldyBGaWx0ZXIoe1xuXHRcdFx0aW1wbDogdGhpcyxcblx0XHRcdGFwcGxpZXNGbjogUHJvcGVydHlGaWx0ZXIuI2ZpbHRlckFwcGxpZXMsXG5cdFx0fSlcblx0fVxuXG59XG4iLCJpbXBvcnQgdHlwZSB7IENhY2hlZE1ldGFkYXRhLCBGcm9udE1hdHRlckNhY2hlLCBNZXRhZGF0YUNhY2hlLCBURmlsZSwgVGFnQ2FjaGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwic3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXJcIjtcbmltcG9ydCB7IEZpbGVGaWx0ZXIsIEZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgeyBtYXRjaEFsbCB9IGZyb20gXCIuL01hdGNoQWxsRmlsdGVyXCI7XG5pbXBvcnQgeyBhbnkgfSBmcm9tIFwiLi9PckZpbHRlclwiO1xuaW1wb3J0IHsgU3RyaW5nTWF0Y2hlciB9IGZyb20gXCIuLi9tYXRjaGVyc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gdGFnKG1hdGNoZXI6IFN0cmluZ01hdGNoZXIsIG1ldGFkYXRhQ2FjaGU6IFBpY2s8TWV0YWRhdGFDYWNoZSwgJ2dldEZpbGVDYWNoZSc+KTogRmlsdGVyPFRGaWxlLCBUYWdGaWx0ZXI+IHtcblx0cmV0dXJuIG5ldyBUYWdGaWx0ZXIoeyBtYXRjaGVyLCBtZXRhZGF0YUNhY2hlIH0pLmZpbHRlcigpO1xufVxuXG5leHBvcnQgY2xhc3MgVGFnRmlsdGVyIHtcblx0bWF0Y2hlcjtcblx0bWV0YWRhdGFDYWNoZTogUGljazxNZXRhZGF0YUNhY2hlLCAnZ2V0RmlsZUNhY2hlJz47XG5cblx0Y29uc3RydWN0b3IoZGVmOiB7XG5cdFx0bWF0Y2hlcjogU3RyaW5nTWF0Y2hlcixcblx0XHRtZXRhZGF0YUNhY2hlOiBQaWNrPE1ldGFkYXRhQ2FjaGUsICdnZXRGaWxlQ2FjaGUnPixcblx0fSkge1xuXHRcdHRoaXMubWF0Y2hlciA9IGRlZi5tYXRjaGVyO1xuXHRcdHRoaXMubWV0YWRhdGFDYWNoZSA9IGRlZi5tZXRhZGF0YUNhY2hlO1xuXHR9XG5cblx0YXBwbGllc1RvKHRoaXM6IFRhZ0ZpbHRlciwgZmlsZTogVEZpbGUpOiBib29sZWFuIHtcblx0XHRjb25zdCBtZXRhZGF0YSA9IHRoaXMubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSlcblx0XHRpZiAoIW1ldGFkYXRhKSByZXR1cm4gZmFsc2U7XG5cdFx0Ly8gcHJlZmVyIGZyb250bWF0dGVyIHRhZ3Ncblx0XHR7XG5cdFx0XHRjb25zdCBmcm9udG1hdHRlciA9IG1ldGFkYXRhLmZyb250bWF0dGVyID8/IHt9O1xuXHRcdFx0Y29uc3QgdGFnczogdW5rbm93biA9IGZyb250bWF0dGVyLnRhZ3M7XG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheSh0YWdzKSkge1xuXHRcdFx0XHRpZiAodGFncy5zb21lKGl0ID0+IHR5cGVvZiBpdCA9PT0gXCJzdHJpbmdcIiAmJiB0aGlzLm1hdGNoZXIubWF0Y2hlcyhpdCkpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBjaGVjayBpbmxpbmUgdGFnc1xuXHRcdGNvbnN0IHRhZ3MgPSBtZXRhZGF0YS50YWdzO1xuXHRcdGlmICghdGFncykgcmV0dXJuIGZhbHNlO1xuXHRcdHJldHVybiB0YWdzLnNvbWUoaXQgPT4gdGhpcy5tYXRjaGVyLm1hdGNoZXMoaXQudGFnKSk7XG5cdH1cblxuXHRzdGF0aWMgI2ZpbHRlckFwcGxpZXMgPSBhc3luYyAoZmlsdGVyOiBGaWx0ZXI8VEZpbGUsIFRhZ0ZpbHRlcj4sIGZpbGU6IFRGaWxlKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XG5cdFx0cmV0dXJuIGZpbHRlci5pbXBsLmFwcGxpZXNUbyhmaWxlKTtcblx0fVxuXG5cdGZpbHRlcih0aGlzOiBUYWdGaWx0ZXIpIHtcblx0XHRyZXR1cm4gbmV3IEZpbHRlcih7XG5cdFx0XHRpbXBsOiB0aGlzLFxuXHRcdFx0YXBwbGllc0ZuOiBUYWdGaWx0ZXIuI2ZpbHRlckFwcGxpZXMsXG5cdFx0fSlcblx0fVxuXG59XG5cbnR5cGUgVGFnUHJvcGVydHkgPSBzdHJpbmcgfCAoc3RyaW5nIHwgbnVsbClbXVxuXG5pbnRlcmZhY2UgTWV0YWRhdGEge1xuXHQvKipcblx0ICogQHNlZSB7QGxpbmsgQ2FjaGVkTWV0YWRhdGEudGFnc31cblx0ICovXG5cdHRhZ3M/OiBPbWl0PFRhZ0NhY2hlLCAncG9zaXRpb24nPltdO1xuXHQvKipcblx0ICogQHNlZSB7QGxpbmsgQ2FjaGVkTWV0YWRhdGEuZnJvbnRtYXR0ZXJ9XG5cdCAqL1xuXHRmcm9udG1hdHRlcj86IFBhcnRpYWw8RnJvbnRNYXR0ZXJDYWNoZT4gJiB7IHRhZz86IFRhZ1Byb3BlcnR5LCB0YWdzPzogVGFnUHJvcGVydHkgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZXRhZGF0YVJlcG9zaXRvcnkge1xuXHQvKipcblx0ICogQHNlZSB7QGxpbmsgTWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGV9XG5cdCAqL1xuXHRnZXRGaWxlQ2FjaGUoZmlsZTogVEZpbGUpOiBNZXRhZGF0YSB8IG51bGxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZXRhZGF0YUZpbHRlciB7XG5cdGFwcGxpZXNUbyhtZXRhZGF0YTogTWV0YWRhdGEgfCBudWxsKTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIE1ldGFkYXRhVGFnRmlsdGVyIGltcGxlbWVudHMgTWV0YWRhdGFGaWx0ZXIge1xuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY2hlY2tlcjogU3RyaW5nQ2hlY2tlclxuXHQpIHsgfVxuXG5cdGFwcGxpZXNUbyhtZXRhZGF0YTogTWV0YWRhdGEgfCBudWxsKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgdGFncyA9IG1ldGFkYXRhPy50YWdzXG5cdFx0aWYgKHRhZ3MgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHRhZ3Muc29tZSh0YWcgPT4gdGhpcy5jaGVja2VyLm1hdGNoZXMoYCMke3RhZy50YWd9YCkpKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgZnJvbnRtYXR0ZXIgPSBtZXRhZGF0YT8uZnJvbnRtYXR0ZXJcblx0XHRpZiAoZnJvbnRtYXR0ZXIgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXHRcdGlmICh0aGlzLmNoZWNrVGFncyhmcm9udG1hdHRlci50YWcpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH1cblx0XHRpZiAodGhpcy5jaGVja1RhZ3MoZnJvbnRtYXR0ZXIudGFncykpIHtcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cHJpdmF0ZSBjaGVja1RhZ3ModGFncz86IFRhZ1Byb3BlcnR5KSB7XG5cdFx0aWYgKHRhZ3MgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIHRhZ3MgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdGNvbnN0IG1hdGNoID0gdGhpcy5jaGVja2VyLm1hdGNoZXModGFncylcblx0XHRcdHJldHVybiBtYXRjaFxuXHRcdH1cblx0XHRpZiAoQXJyYXkuaXNBcnJheSh0YWdzKSkge1xuXHRcdFx0Y29uc3QgbWF0Y2ggPSB0YWdzLnNvbWUodGFnID0+IHRhZyAhPSBudWxsICYmIHRoaXMuY2hlY2tlci5tYXRjaGVzKHRhZykpXG5cdFx0XHRyZXR1cm4gbWF0Y2hcblx0XHR9XG5cdH1cblxufVxuXG5leHBvcnQgY2xhc3MgRmlsZVRhZ3NGaWx0ZXIgaW1wbGVtZW50cyBGaWxlRmlsdGVyIHtcblxuXHRwcml2YXRlIHJlYWRvbmx5IG1ldGFkYXRhRmlsdGVyOiBNZXRhZGF0YUZpbHRlcjtcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHR0YWdDaGVja2VyOiBTdHJpbmdDaGVja2VyLFxuXG5cdFx0cHJpdmF0ZSByZWFkb25seSBtZXRhZGF0YTogTWV0YWRhdGFSZXBvc2l0b3J5XG5cdCkge1xuXHRcdHRoaXMubWV0YWRhdGFGaWx0ZXIgPSBuZXcgTWV0YWRhdGFUYWdGaWx0ZXIodGFnQ2hlY2tlcilcblx0fVxuXG5cdGFzeW5jIGFwcGxpZXNUbyhmaWxlOiBURmlsZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IGNhY2hlID0gdGhpcy5tZXRhZGF0YS5nZXRGaWxlQ2FjaGUoZmlsZSlcblx0XHRyZXR1cm4gdGhpcy5tZXRhZGF0YUZpbHRlci5hcHBsaWVzVG8oY2FjaGUpXG5cdH1cblxuXHRhbmQ8UiBleHRlbmRzIFBhcnRpYWw8VEZpbGU+PihmaWx0ZXI6IEZpbGVGaWx0ZXI8Uj4pOiBGaWxlRmlsdGVyPFRGaWxlICYgUj4ge1xuXHRcdHJldHVybiBtYXRjaEFsbCh0aGlzLCBmaWx0ZXIgYXMgRmlsZUZpbHRlcilcblx0fVxuXG5cdG9yPFIgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oZmlsdGVyOiBGaWxlRmlsdGVyPFI+KTogRmlsZUZpbHRlcjxURmlsZSAmIFI+IHtcblx0XHRyZXR1cm4gYW55KHRoaXMsIGZpbHRlciBhcyBGaWxlRmlsdGVyKVxuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgU3RyaW5nTWF0Y2hlcjxJbXBsID0gYW55PiB7XG5cdGltcGw7XG5cdG1hdGNoZXNGbjtcblxuXHRjb25zdHJ1Y3Rvcih7IGltcGwsIG1hdGNoZXNGbiB9OiB7XG5cdFx0aW1wbDogSW1wbCxcblx0XHRtYXRjaGVzRm46IChtYXRjaGVyOiBTdHJpbmdNYXRjaGVyPEltcGw+LCBzdHJpbmc6IHN0cmluZykgPT4gYm9vbGVhblxuXHR9KSB7XG5cdFx0dGhpcy5pbXBsID0gaW1wbDtcblx0XHR0aGlzLm1hdGNoZXNGbiA9IG1hdGNoZXNGbjtcblx0fVxuXG5cdG1hdGNoZXModGhpczogU3RyaW5nTWF0Y2hlcjxJbXBsPiwgc3RyaW5nOiBzdHJpbmcpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5tYXRjaGVzRm4odGhpcywgc3RyaW5nKVxuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBCYXNpY1N0cmluZ01hdGNoZXIge1xuXHRzdHJpbmc7XG5cblx0Y29uc3RydWN0b3IoeyBzdHJpbmcgfTogeyBzdHJpbmc6IHN0cmluZyB9KSB7XG5cdFx0dGhpcy5zdHJpbmcgPSBzdHJpbmc7XG5cdH1cblxuXHRzdGF0aWMgI21hdGNoU3RyaW5nID0gKG1hdGNoZXI6IFN0cmluZ01hdGNoZXI8QmFzaWNTdHJpbmdNYXRjaGVyPiwgc3RyaW5nOiBzdHJpbmcpOiBib29sZWFuID0+IHtcblx0XHRyZXR1cm4gbWF0Y2hlci5pbXBsLm1hdGNoZXNTdHJpbmcoc3RyaW5nKTtcblx0fVxuXG5cdG1hdGNoZXNTdHJpbmcodGhpczogQmFzaWNTdHJpbmdNYXRjaGVyLCBzdHJpbmc6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiBzdHJpbmcuaW5jbHVkZXModGhpcy5zdHJpbmcpO1xuXHR9XG5cblx0c3RyaW5nTWF0Y2hlcih0aGlzOiBCYXNpY1N0cmluZ01hdGNoZXIpOiBTdHJpbmdNYXRjaGVyPEJhc2ljU3RyaW5nTWF0Y2hlcj4ge1xuXHRcdHJldHVybiBuZXcgU3RyaW5nTWF0Y2hlcih7XG5cdFx0XHRpbXBsOiB0aGlzLFxuXHRcdFx0bWF0Y2hlc0ZuOiBCYXNpY1N0cmluZ01hdGNoZXIuI21hdGNoU3RyaW5nLFxuXHRcdH0pXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2ljKHN0cmluZzogc3RyaW5nKSB7XG5cdHJldHVybiBuZXcgQmFzaWNTdHJpbmdNYXRjaGVyKHsgc3RyaW5nIH0pLnN0cmluZ01hdGNoZXIoKTtcbn1cblxuZXhwb3J0IGNsYXNzIFJlZ2V4TWF0Y2hlciB7XG5cdHJlZ2V4O1xuXG5cdGNvbnN0cnVjdG9yKHsgcmVnZXggfTogeyByZWdleDogUmVnRXhwIH0pIHtcblx0XHR0aGlzLnJlZ2V4ID0gcmVnZXg7XG5cdH1cblxuXHRzdGF0aWMgI21hdGNoU3RyaW5nID0gKG1hdGNoZXI6IFN0cmluZ01hdGNoZXI8UmVnZXhNYXRjaGVyPiwgc3RyaW5nOiBzdHJpbmcpOiBib29sZWFuID0+IHtcblx0XHRyZXR1cm4gbWF0Y2hlci5pbXBsLm1hdGNoZXNTdHJpbmcoc3RyaW5nKTtcblx0fVxuXG5cdG1hdGNoZXNTdHJpbmcodGhpczogUmVnZXhNYXRjaGVyLCBzdHJpbmc6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLnJlZ2V4LnRlc3Qoc3RyaW5nKVxuXHR9XG5cblx0c3RyaW5nTWF0Y2hlcih0aGlzOiBSZWdleE1hdGNoZXIpOiBTdHJpbmdNYXRjaGVyPFJlZ2V4TWF0Y2hlcj4ge1xuXHRcdHJldHVybiBuZXcgU3RyaW5nTWF0Y2hlcih7XG5cdFx0XHRpbXBsOiB0aGlzLFxuXHRcdFx0bWF0Y2hlc0ZuOiBSZWdleE1hdGNoZXIuI21hdGNoU3RyaW5nLFxuXHRcdH0pXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2V4KHJlZ2V4OiBSZWdFeHApIHtcblx0cmV0dXJuIG5ldyBSZWdleE1hdGNoZXIoeyByZWdleCB9KS5zdHJpbmdNYXRjaGVyKCk7XG59XG5cbmV4cG9ydCBjbGFzcyBOZWdhdGVkU3RyaW5nTWF0Y2hlciB7XG5cdG1hdGNoZXI7XG5cblx0Y29uc3RydWN0b3IoeyBtYXRjaGVyIH06IHsgbWF0Y2hlcjogU3RyaW5nTWF0Y2hlciB9KSB7XG5cdFx0dGhpcy5tYXRjaGVyID0gbWF0Y2hlcjtcblx0fVxuXG5cdHN0YXRpYyAjbWF0Y2hTdHJpbmcgPSAobWF0Y2hlcjogU3RyaW5nTWF0Y2hlcjxOZWdhdGVkU3RyaW5nTWF0Y2hlcj4sIHN0cmluZzogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG5cdFx0cmV0dXJuIG1hdGNoZXIuaW1wbC5tYXRjaGVzU3RyaW5nKHN0cmluZyk7XG5cdH1cblxuXHRtYXRjaGVzU3RyaW5nKHRoaXM6IE5lZ2F0ZWRTdHJpbmdNYXRjaGVyLCBzdHJpbmc6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiAhdGhpcy5tYXRjaGVyLm1hdGNoZXMoc3RyaW5nKVxuXHR9XG5cblx0c3RyaW5nTWF0Y2hlcih0aGlzOiBOZWdhdGVkU3RyaW5nTWF0Y2hlcik6IFN0cmluZ01hdGNoZXI8TmVnYXRlZFN0cmluZ01hdGNoZXI+IHtcblx0XHRyZXR1cm4gbmV3IFN0cmluZ01hdGNoZXIoe1xuXHRcdFx0aW1wbDogdGhpcyxcblx0XHRcdG1hdGNoZXNGbjogTmVnYXRlZFN0cmluZ01hdGNoZXIuI21hdGNoU3RyaW5nLFxuXHRcdH0pXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5lZ2F0ZShtYXRjaGVyOiBTdHJpbmdNYXRjaGVyKTogU3RyaW5nTWF0Y2hlcjxOZWdhdGVkU3RyaW5nTWF0Y2hlcj4ge1xuXHRyZXR1cm4gbmV3IE5lZ2F0ZWRTdHJpbmdNYXRjaGVyKHsgbWF0Y2hlciB9KS5zdHJpbmdNYXRjaGVyKCk7XG59XG5cbmV4cG9ydCBjbGFzcyBHcm91cGVkU3RyaW5nTWF0Y2hlciB7XG5cdG1hdGNoZXJzO1xuXG5cdGNvbnN0cnVjdG9yKHsgbWF0Y2hlcnMgfTogeyBtYXRjaGVyczogU3RyaW5nTWF0Y2hlcltdIH0pIHtcblx0XHR0aGlzLm1hdGNoZXJzID0gbWF0Y2hlcnM7XG5cdH1cblxuXHRzdGF0aWMgI21hdGNoU3RyaW5nID0gKG1hdGNoZXI6IFN0cmluZ01hdGNoZXI8R3JvdXBlZFN0cmluZ01hdGNoZXI+LCBzdHJpbmc6IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xuXHRcdHJldHVybiBtYXRjaGVyLmltcGwubWF0Y2hlc1N0cmluZyhzdHJpbmcpO1xuXHR9XG5cblx0bWF0Y2hlc1N0cmluZyh0aGlzOiBHcm91cGVkU3RyaW5nTWF0Y2hlciwgc3RyaW5nOiBzdHJpbmcpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5tYXRjaGVycy5zb21lKGl0ID0+IGl0Lm1hdGNoZXMoc3RyaW5nKSlcblx0fVxuXG5cdHN0cmluZ01hdGNoZXIodGhpczogR3JvdXBlZFN0cmluZ01hdGNoZXIpOiBTdHJpbmdNYXRjaGVyPEdyb3VwZWRTdHJpbmdNYXRjaGVyPiB7XG5cdFx0cmV0dXJuIG5ldyBTdHJpbmdNYXRjaGVyKHtcblx0XHRcdGltcGw6IHRoaXMsXG5cdFx0XHRtYXRjaGVzRm46IEdyb3VwZWRTdHJpbmdNYXRjaGVyLiNtYXRjaFN0cmluZyxcblx0XHR9KVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbnkoLi4ubWF0Y2hlcnM6IFN0cmluZ01hdGNoZXJbXSk6IFN0cmluZ01hdGNoZXI8R3JvdXBlZFN0cmluZ01hdGNoZXI+IHtcblx0cmV0dXJuIG5ldyBHcm91cGVkU3RyaW5nTWF0Y2hlcih7IG1hdGNoZXJzIH0pLnN0cmluZ01hdGNoZXIoKTtcbn1cblxuXG4iLCJpbXBvcnQgdHlwZSAqIGFzIG9ic2lkaWFuIGZyb20gXCJvYnNpZGlhblwiXG5pbXBvcnQgKiBhcyBmaWx0ZXJzIGZyb20gXCIuL2ZpbHRlcnNcIlxuaW1wb3J0ICogYXMgbWF0Y2hlcnMgZnJvbSBcIi4vbWF0Y2hlcnNcIlxuXG5leHBvcnQgY2xhc3MgUGFyc2VyIHtcblx0bWV0YWRhdGFDYWNoZTtcblxuXHRjb25zdHJ1Y3RvcihkZWY6IHtcblx0XHRtZXRhZGF0YUNhY2hlOiBQaWNrPG9ic2lkaWFuLk1ldGFkYXRhQ2FjaGUsICdnZXRGaWxlQ2FjaGUnPlxuXHR9KSB7XG5cdFx0dGhpcy5tZXRhZGF0YUNhY2hlID0gZGVmLm1ldGFkYXRhQ2FjaGU7XG5cdH1cblxuXHRmaWx0ZXJGcm9tUXVlcnkodGhpczogUGFyc2VyLCBxdWVyeTogc3RyaW5nLCBsb2dnZXI/OiBDb25zb2xlKTogZmlsdGVycy5GaWxlRmlsdGVyIHwgZmlsdGVycy5Bc3luY0ZpbGVGaWx0ZXIge1xuXHRcdGNvbnN0IGZvdW5kX3Rva2VucyA9IHRva2VuaXplUXVlcnkocXVlcnksIGxvZ2dlcik7XG5cdFx0bG9nZ2VyPy5sb2coeyBmb3VuZF90b2tlbnMgfSlcblx0XHRyZXR1cm4gdGhpcy5wYXJzZVRva2Vucyhmb3VuZF90b2tlbnMsIGxvZ2dlcilcblx0fVxuXG5cdHBhcnNlVG9rZW5zKHRoaXM6IFBhcnNlciwgdG9rZW5zOiBSZWFkb25seUFycmF5PFRva2VuPiwgbG9nZ2VyPzogQ29uc29sZSk6IGZpbHRlcnMuQXN5bmNGaWxlRmlsdGVyIHwgZmlsdGVycy5GaWxlRmlsdGVyIHtcblx0XHRsZXQgaXNfYXN5bmMgPSBmYWxzZTtcblx0XHRjb25zdCBmb3VuZF9maWx0ZXJzOiBBcnJheTxmaWx0ZXJzLkFzeW5jRmlsZUZpbHRlciB8IGZpbHRlcnMuRmlsZUZpbHRlcj4gPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgdG9rZW4gPSB0b2tlbnNbaV07XG5cdFx0XHRsb2dnZXI/LmxvZyhcInBhcnNlVG9rZW5zXCIsIHsgdG9rZW4sIGkgfSlcblxuXHRcdFx0aWYgKHRva2VuLmtpbmQgPT09IFRva2VuVHlwZS5TeW1ib2wgJiYgdG9rZW4uc3ltYm9sID09PSBTeW1ib2xzLlR5cGUuUlBhcmVuKSB7XG5cdFx0XHRcdGNvbnN0IHsgZmlsdGVyLCBlbmQgfSA9IHRoaXMucGFyc2VHcm91cCh0b2tlbnMsIGkgKyAxLCBsb2dnZXIpO1xuXHRcdFx0XHRmb3VuZF9maWx0ZXJzLnB1c2goZmlsdGVyKVxuXHRcdFx0XHRpID0gZW5kO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRva2VuLmtpbmQgPT09IFRva2VuVHlwZS5Xb3JkICYmIHRva2VuLndvcmQgPT09IFwiT1JcIikge1xuXHRcdFx0XHQvLyBPUiBpcyBhbHdheXMgdHJlYXRlZCBhcyBhIHNwZWNpYWwgd29yZFxuXHRcdFx0XHRpZiAoZm91bmRfZmlsdGVycy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0Y29uc3QgYSA9IGZvdW5kX2ZpbHRlcnMucG9wKCkhO1xuXHRcdFx0XHRcdGNvbnN0IHsgZmlsdGVyOiBiLCBlbmQgfSA9IHRoaXMucGFyc2VGaWx0ZXIodG9rZW5zLCBpICsgMSwgbG9nZ2VyKTtcblx0XHRcdFx0XHRpZiAoYiBpbnN0YW5jZW9mIGZpbHRlcnMuQXN5bmNGaWx0ZXIpIHtcblx0XHRcdFx0XHRcdGlzX2FzeW5jID0gdHJ1ZTtcblx0XHRcdFx0XHRcdGNvbnN0IGFzeW5jX2EgPSBhIGluc3RhbmNlb2YgZmlsdGVycy5Bc3luY0ZpbHRlciA/IGEgOiBhLmFzeW5jKClcblx0XHRcdFx0XHRcdGZvdW5kX2ZpbHRlcnMucHVzaChmaWx0ZXJzLmFueUFzeW5jKGFzeW5jX2EsIGIpKVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoYSBpbnN0YW5jZW9mIGZpbHRlcnMuQXN5bmNGaWx0ZXIpIHtcblx0XHRcdFx0XHRcdC8vIGRvbid0IG5lZWQgdG8gbWFyayBpc19hc3luYyBhcyB0cnVlIGJlY2F1c2UgaXQgd291bGQgaGF2ZSBhbHJlYWR5IGhhcHBlbmVkIGluIGEgcHJldmlvdXMgbG9vcFxuXHRcdFx0XHRcdFx0Zm91bmRfZmlsdGVycy5wdXNoKGZpbHRlcnMuYW55QXN5bmMoYSwgYi5hc3luYygpKSlcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Zm91bmRfZmlsdGVycy5wdXNoKGZpbHRlcnMuYW55KGEsIGIpKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpID0gZW5kO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcInVuZXhwZWN0ZWQga2V5d29yZCBPUlwiKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0b2tlbi5raW5kID09PSBUb2tlblR5cGUuU3ltYm9sICYmIHRva2VuLnN5bWJvbCA9PT0gU3ltYm9scy5UeXBlLk5lZ2F0ZSkge1xuXHRcdFx0XHRjb25zdCB7IGZpbHRlciwgZW5kIH0gPSB0aGlzLnBhcnNlRmlsdGVyKHRva2VucywgaSArIDEsIGxvZ2dlcilcblx0XHRcdFx0aWYgKGZpbHRlciBpbnN0YW5jZW9mIGZpbHRlcnMuQXN5bmNGaWx0ZXIpIHtcblx0XHRcdFx0XHRpc19hc3luYyA9IHRydWU7XG5cdFx0XHRcdFx0Zm91bmRfZmlsdGVycy5wdXNoKGZpbHRlci5uZWdhdGVkKCkpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Zm91bmRfZmlsdGVycy5wdXNoKGZpbHRlci5uZWdhdGVkKCkpXG5cdFx0XHRcdH1cblx0XHRcdFx0aSA9IGVuZDtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCB7IGZpbHRlciwgZW5kIH0gPSB0aGlzLnBhcnNlRmlsdGVyKHRva2VucywgaSwgbG9nZ2VyKTtcblx0XHRcdGlmIChmaWx0ZXIgaW5zdGFuY2VvZiBmaWx0ZXJzLkFzeW5jRmlsdGVyKSB7XG5cdFx0XHRcdGlzX2FzeW5jID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdGZvdW5kX2ZpbHRlcnMucHVzaChmaWx0ZXIpO1xuXHRcdFx0aSA9IGVuZDtcblx0XHR9XG5cdFx0aWYgKGlzX2FzeW5jKSB7XG5cdFx0XHRjb25zdCBhc3luY19maWx0ZXJzID0gZm91bmRfZmlsdGVycy5tYXAoaXQgPT4gaXQgaW5zdGFuY2VvZiBmaWx0ZXJzLkFzeW5jRmlsdGVyID8gaXQgOiBpdC5hc3luYygpKTtcblx0XHRcdHJldHVybiBmaWx0ZXJzLmFsbEFzeW5jKGFzeW5jX2ZpbHRlcnNbMF0sIC4uLmFzeW5jX2ZpbHRlcnMuc2xpY2UoMSkpO1xuXHRcdH1cblx0XHRyZXR1cm4gZmlsdGVycy5hbGwoZm91bmRfZmlsdGVyc1swXSBhcyBmaWx0ZXJzLkZpbGVGaWx0ZXIsIC4uLmZvdW5kX2ZpbHRlcnMuc2xpY2UoMSkgYXMgZmlsdGVycy5GaWxlRmlsdGVyW10pXG5cdH1cblxuXHRwYXJzZUZpbHRlcih0b2tlbnM6IFJlYWRvbmx5QXJyYXk8VG9rZW4+LCBzdGFydDogbnVtYmVyLCBsb2dnZXI/OiBDb25zb2xlKTogeyBmaWx0ZXI6IGZpbHRlcnMuQXN5bmNGaWxlRmlsdGVyIHwgZmlsdGVycy5GaWxlRmlsdGVyLCBlbmQ6IG51bWJlciB9IHtcblx0XHRjb25zdCB0b2tlbiA9IHRva2Vuc1tzdGFydF07XG5cdFx0bG9nZ2VyPy5sb2coXCJwYXJzZUZpbHRlclwiLCB7IHRva2VuLCBzdGFydCB9KVxuXG5cdFx0c3dpdGNoICh0b2tlbi5raW5kKSB7XG5cdFx0XHRjYXNlIFRva2VuVHlwZS5QaHJhc2U6IHJldHVybiB7IGZpbHRlcjogZmlsdGVycy5jb250ZW50KG1hdGNoZXJzLmJhc2ljKHRva2VuLnBocmFzZSkpLCBlbmQ6IHN0YXJ0IH07XG5cdFx0XHRjYXNlIFRva2VuVHlwZS5SZWdleDogcmV0dXJuIHsgZmlsdGVyOiBmaWx0ZXJzLmNvbnRlbnQobWF0Y2hlcnMucmVnZXgodG9rZW4ucmVnZXgpKSwgZW5kOiBzdGFydCB9O1xuXHRcdFx0Y2FzZSBUb2tlblR5cGUuV29yZDoge1xuXHRcdFx0XHRpZiAodG9rZW4ud29yZCA9PT0gXCJPUlwiKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwidW5leHBlY3RlZCBrZXl3b3JkIE9SXCIpXG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHsgZmlsdGVyOiBmaWx0ZXJzLmNvbnRlbnQobWF0Y2hlcnMuYmFzaWModG9rZW4ud29yZCkpLCBlbmQ6IHN0YXJ0IH07XG5cdFx0XHR9XG5cdFx0XHRjYXNlIFRva2VuVHlwZS5TeW1ib2w6IHtcblx0XHRcdFx0c3dpdGNoKHRva2VuLnN5bWJvbCkge1xuXHRcdFx0XHRcdGNhc2UgU3ltYm9scy5UeXBlLkxQYXJlbjogcmV0dXJuIHRoaXMucGFyc2VHcm91cCh0b2tlbnMsIHN0YXJ0ICsgMSwgbG9nZ2VyKTtcblx0XHRcdFx0XHRjYXNlIFN5bWJvbHMuVHlwZS5MQnJhY2tldDogcmV0dXJuIHRoaXMucGFyc2VQcm9wZXJ0eSh0b2tlbnMsIHN0YXJ0ICsgMSwgbG9nZ2VyKTtcblx0XHRcdFx0XHRjYXNlIFN5bWJvbHMuVHlwZS5OZWdhdGU6IHtcblx0XHRcdFx0XHRcdGNvbnN0IHsgZmlsdGVyLCBlbmQgfSA9IHRoaXMucGFyc2VGaWx0ZXIodG9rZW5zLCBzdGFydCArIDEsIGxvZ2dlcik7XG5cdFx0XHRcdFx0XHRyZXR1cm4geyBmaWx0ZXI6IChmaWx0ZXIgYXMgYW55KS5uZWdhdGVkKCksIGVuZCB9O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgc3ltYm9sICR7U3ltYm9scy5UeXBlW3Rva2VuLnN5bWJvbF19YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNhc2UgVG9rZW5UeXBlLktleXdvcmQ6IHtcblx0XHRcdFx0Y29uc3QgbmV4dF90b2tlbiA9IHRva2Vuc1tzdGFydCArIDFdO1xuXHRcdFx0XHRpZiAobmV4dF90b2tlbi5raW5kICE9PSBUb2tlblR5cGUuU3ltYm9sIHx8IG5leHRfdG9rZW4uc3ltYm9sICE9PSBTeW1ib2xzLlR5cGUuQ29sb24pIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJleHBlY3RlZCBjb2xvbiB0byBmb2xsb3cga2V5d29yZFwiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzd2l0Y2ggKHRva2VuLmtleXdvcmQpIHtcblx0XHRcdFx0XHRjYXNlIEtleXdvcmQuS2luZC5GaWxlOiB7XG5cdFx0XHRcdFx0XHRjb25zdCB7IG1hdGNoZXIsIGVuZCB9ID0gdGhpcy5wYXJzZUZpbGVLZXl3b3JkKHRva2Vucywgc3RhcnQgKyAyLCBsb2dnZXIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHsgZmlsdGVyOiBmaWx0ZXJzLmZpbGUobWF0Y2hlciksIGVuZCB9O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjYXNlIEtleXdvcmQuS2luZC5QYXRoOiB7XG5cdFx0XHRcdFx0XHRjb25zdCB7IG1hdGNoZXIsIGVuZCB9ID0gdGhpcy5wYXJzZVBhdGhLZXl3b3JkKHRva2Vucywgc3RhcnQgKyAyLCBsb2dnZXIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHsgZmlsdGVyOiBmaWx0ZXJzLnBhdGgobWF0Y2hlciksIGVuZCB9O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjYXNlIEtleXdvcmQuS2luZC5UYWc6IHtcblx0XHRcdFx0XHRcdGNvbnN0IHsgbWF0Y2hlciwgZW5kIH0gPSB0aGlzLnBhcnNlVGFnS2V5d29yZCh0b2tlbnMsIHN0YXJ0ICsgMiwgbG9nZ2VyKTtcblx0XHRcdFx0XHRcdHJldHVybiB7IGZpbHRlcjogZmlsdGVycy50YWcobWF0Y2hlciwgdGhpcy5tZXRhZGF0YUNhY2hlKSwgZW5kIH07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRkZWZhdWx0OiB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcInVuZXhwZWN0ZWQgdG9rZW4gXCIgKyBUb2tlblR5cGVbXG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdHRva2VuLmtpbmRcblx0XHRcdFx0XSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwYXJzZUZpbGVLZXl3b3JkKHRva2VuczogUmVhZG9ubHlBcnJheTxUb2tlbj4sIHN0YXJ0OiBudW1iZXIsIGxvZ2dlcj86IENvbnNvbGUpOiB7IG1hdGNoZXI6IG1hdGNoZXJzLlN0cmluZ01hdGNoZXIsIGVuZDogbnVtYmVyIH0ge1xuXHRcdGNvbnN0IHRva2VuID0gdG9rZW5zW3N0YXJ0XTtcblx0XHRzd2l0Y2ggKHRva2VuLmtpbmQpIHtcblx0XHRcdGNhc2UgVG9rZW5UeXBlLldvcmQ6IHtcblx0XHRcdFx0cmV0dXJuIHsgbWF0Y2hlcjogbWF0Y2hlcnMuYmFzaWModG9rZW4ud29yZCksIGVuZDogc3RhcnQgfVxuXHRcdFx0fVxuXHRcdFx0Y2FzZSBUb2tlblR5cGUuU3ltYm9sOiB7XG5cdFx0XHRcdHN3aXRjaCAodG9rZW4uc3ltYm9sKSB7XG5cdFx0XHRcdFx0Y2FzZSBTeW1ib2xzLlR5cGUuTmVnYXRlOiB7XG5cdFx0XHRcdFx0XHRjb25zdCB7IG1hdGNoZXI6IG5lZ2F0ZWQsIGVuZCB9ID0gdGhpcy5wYXJzZUZpbGVLZXl3b3JkKHRva2Vucywgc3RhcnQgKyAxLCBsb2dnZXIpXG5cdFx0XHRcdFx0XHRyZXR1cm4geyBtYXRjaGVyOiBtYXRjaGVycy5uZWdhdGUobmVnYXRlZCksIGVuZCB9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNhc2UgU3ltYm9scy5UeXBlLkxQYXJlbjoge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMucGFyc2VHcm91cGVkRmlsZVN1YnF1ZXJ5KHRva2Vucywgc3RhcnQgKyAxLCBsb2dnZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgc3ltYm9sICR7U3ltYm9scy5UeXBlW3Rva2VuLnN5bWJvbF19YClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y2FzZSBUb2tlblR5cGUuS2V5d29yZDoge1xuXHRcdFx0XHRzd2l0Y2ggKHRva2VuLmtleXdvcmQpIHtcblx0XHRcdFx0XHRjYXNlIEtleXdvcmQuS2luZC5GaWxlOiB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE9wZXJhdG9yIFwiZmlsZVwiIGNhbm5vdCBiZSBuZXN0ZWQgd2l0aGluIFwiZmlsZVwiYClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGRlZmF1bHQ6IHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwidW5zdXBwb3J0ZWQgdG9rZW4gZm9yIGZpbGUga2V5d29yZDogXCIgKyBUb2tlblR5cGVbdG9rZW4ua2luZF0pXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cGFyc2VQYXRoS2V5d29yZCh0b2tlbnM6IFJlYWRvbmx5QXJyYXk8VG9rZW4+LCBzdGFydDogbnVtYmVyLCBsb2dnZXI/OiBDb25zb2xlKTogeyBtYXRjaGVyOiBtYXRjaGVycy5TdHJpbmdNYXRjaGVyLCBlbmQ6IG51bWJlciB9IHtcblx0XHRjb25zdCB0b2tlbiA9IHRva2Vuc1tzdGFydF07XG5cdFx0c3dpdGNoICh0b2tlbi5raW5kKSB7XG5cdFx0XHRjYXNlIFRva2VuVHlwZS5Xb3JkOiB7XG5cdFx0XHRcdHJldHVybiB7IG1hdGNoZXI6IG1hdGNoZXJzLmJhc2ljKHRva2VuLndvcmQpLCBlbmQ6IHN0YXJ0IH1cblx0XHRcdH1cblx0XHRcdGNhc2UgVG9rZW5UeXBlLlN5bWJvbDoge1xuXHRcdFx0XHRzd2l0Y2ggKHRva2VuLnN5bWJvbCkge1xuXHRcdFx0XHRcdGNhc2UgU3ltYm9scy5UeXBlLk5lZ2F0ZToge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyBtYXRjaGVyOiBuZWdhdGVkLCBlbmQgfSA9IHRoaXMucGFyc2VQYXRoS2V5d29yZCh0b2tlbnMsIHN0YXJ0ICsgMSwgbG9nZ2VyKVxuXHRcdFx0XHRcdFx0cmV0dXJuIHsgbWF0Y2hlcjogbWF0Y2hlcnMubmVnYXRlKG5lZ2F0ZWQpLCBlbmQgfVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjYXNlIFN5bWJvbHMuVHlwZS5MUGFyZW46IHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLnBhcnNlR3JvdXBlZEZpbGVTdWJxdWVyeSh0b2tlbnMsIHN0YXJ0ICsgMSwgbG9nZ2VyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHN5bWJvbCAke1N5bWJvbHMuVHlwZVt0b2tlbi5zeW1ib2xdfWApXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNhc2UgVG9rZW5UeXBlLktleXdvcmQ6IHtcblx0XHRcdFx0c3dpdGNoICh0b2tlbi5rZXl3b3JkKSB7XG5cdFx0XHRcdFx0Y2FzZSBLZXl3b3JkLktpbmQuRmlsZToge1xuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBPcGVyYXRvciBcImZpbGVcIiBjYW5ub3QgYmUgbmVzdGVkIHdpdGhpbiBcInBhdGhcImApXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNhc2UgS2V5d29yZC5LaW5kLlBhdGg6IHtcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgT3BlcmF0b3IgXCJwYXRoXCIgY2Fubm90IGJlIG5lc3RlZCB3aXRoaW4gXCJwYXRoXCJgKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZGVmYXVsdDoge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJ1bnN1cHBvcnRlZCB0b2tlbiBmb3IgZmlsZSBrZXl3b3JkOiBcIiArIFRva2VuVHlwZVt0b2tlbi5raW5kXSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwYXJzZVRhZ0tleXdvcmQodG9rZW5zOiBSZWFkb25seUFycmF5PFRva2VuPiwgc3RhcnQ6IG51bWJlciwgbG9nZ2VyPzogQ29uc29sZSk6IHsgbWF0Y2hlcjogbWF0Y2hlcnMuU3RyaW5nTWF0Y2hlciwgZW5kOiBudW1iZXIgfSB7XG5cdFx0Y29uc3QgdG9rZW4gPSB0b2tlbnNbc3RhcnRdO1xuXHRcdHN3aXRjaCAodG9rZW4ua2luZCkge1xuXHRcdFx0Y2FzZSBUb2tlblR5cGUuV29yZDoge1xuXHRcdFx0XHRsZXQgd29yZCA9IHRva2VuLndvcmQ7XG5cdFx0XHRcdGlmICh3b3JkLnN0YXJ0c1dpdGgoXCIjXCIpKSB7XG5cdFx0XHRcdFx0d29yZCA9IHdvcmQuc2xpY2UoMSlcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4geyBtYXRjaGVyOiBtYXRjaGVycy5iYXNpYyh3b3JkKSwgZW5kOiBzdGFydCB9XG5cdFx0XHR9XG5cdFx0XHRkZWZhdWx0OiB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgT3BlcmF0b3IgXCJ0YWdcIiBjYW4gb25seSBiZSBmb2xsb3dlZCBieSB0ZXh0YClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwYXJzZVByb3BlcnR5KHRoaXM6IFBhcnNlciwgdG9rZW5zOiBSZWFkb25seUFycmF5PFRva2VuPiwgc3RhcnQ6IG51bWJlciwgbG9nZ2VyPzogQ29uc29sZSk6IHsgZmlsdGVyOiBmaWx0ZXJzLkZpbGVGaWx0ZXI8ZmlsdGVycy5Qcm9wZXJ0eUZpbHRlcj4sIGVuZDogbnVtYmVyIH0ge1xuXHRcdGNvbnN0IHsgZmlsdGVyOiBwcm9wX25hbWUsIGVuZCB9ID0gdGhpcy5wYXJzZVByb3BlcnR5TmFtZSh0b2tlbnMsIHN0YXJ0LCBsb2dnZXIpO1xuXHRcdGxvZ2dlcj8ubG9nKFwicGFyc2VQcm9wZXJ0eVwiLCB7IHByb3BfbmFtZSB9KVxuXHRcdHJldHVybiB7IGZpbHRlcjogZmlsdGVycy5wcm9wZXJ0eShwcm9wX25hbWUsIHRoaXMubWV0YWRhdGFDYWNoZSksIGVuZCB9XG5cdH1cblxuXHRwYXJzZVByb3BlcnR5TmFtZSh0aGlzOiBQYXJzZXIsIHRva2VuczogUmVhZG9ubHlBcnJheTxUb2tlbj4sIHN0YXJ0OiBudW1iZXIsIGxvZ2dlcj86IENvbnNvbGUpOiB7IGVuZDogbnVtYmVyLCBmaWx0ZXI6IGZpbHRlcnMuRmlsdGVyPG9ic2lkaWFuLkZyb250TWF0dGVyQ2FjaGU+IH0ge1xuXHRcdGxldCBidWZmZXIgPSBcIlwiO1xuXHRcdGxldCBpID0gc3RhcnQ7XG5cdFx0Y29uc3QgbmVnYXRlZCA9IHRva2Vuc1tzdGFydF0/LmtpbmQgPT09IFRva2VuVHlwZS5TeW1ib2wgJiYgdG9rZW5zW3N0YXJ0XSEuc3ltYm9sID09PSBTeW1ib2xzLlR5cGUuTmVnYXRlO1xuXHRcdGlmIChuZWdhdGVkKSBpKys7XG5cdFx0bG9vcDogZm9yICg7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHRjb25zdCB0b2tlbiA9IHRva2Vuc1tpXTtcblx0XHRcdHN3aXRjaCh0b2tlbi5raW5kKSB7XG5cdFx0XHRcdGNhc2UgVG9rZW5UeXBlLlBocmFzZToge1xuXHRcdFx0XHRcdGlmIChidWZmZXIubGVuZ3RoID4gMCkgYnVmZmVyICs9IFwiIFwiXG5cdFx0XHRcdFx0YnVmZmVyICs9IFwiXFxcIlwiICsgdG9rZW4ucGhyYXNlICsgXCJcXFwiXCI7XHRcdFxuXHRcdFx0XHRcdGNvbnRpbnVlIGxvb3A7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FzZSBUb2tlblR5cGUuUmVnZXg6IHtcblx0XHRcdFx0XHRpZiAoYnVmZmVyLmxlbmd0aCA+IDApIGJ1ZmZlciArPSBcIiBcIlxuXHRcdFx0XHRcdGJ1ZmZlciArPSBcIi9cIiArIHRva2VuLnJlZ2V4ICsgXCIvXCI7XG5cdFx0XHRcdFx0Y29udGludWUgbG9vcDtcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlIFRva2VuVHlwZS5Xb3JkOiB7XG5cdFx0XHRcdFx0aWYgKHRva2VuLndvcmQgPT09IFwiT1JcIiAmJiBidWZmZXIubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyBmaWx0ZXI6IG5leHRfZmlsdGVyLCBlbmQgfSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUodG9rZW5zLCBpKzEsIGxvZ2dlcik7XG5cdFx0XHRcdFx0XHRsZXQgZmlyc3RfZmlsdGVyID0gZmlsdGVycy5wcm9wZXJ0eU5hbWUobWF0Y2hlcnMuYmFzaWMoYnVmZmVyKSk7XG5cdFx0XHRcdFx0XHRpZiAobmVnYXRlZCkge1xuXHRcdFx0XHRcdFx0XHRmaXJzdF9maWx0ZXIgPSBmaXJzdF9maWx0ZXIubmVnYXRlZCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIHsgZmlsdGVyOiBmaXJzdF9maWx0ZXIub3IobmV4dF9maWx0ZXIpLCBlbmQgfTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKGJ1ZmZlci5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHRzd2l0Y2godG9rZW5zW2ktMV0ua2luZCkge1xuXHRcdFx0XHRcdFx0XHRjYXNlIFRva2VuVHlwZS5QaHJhc2U6XG5cdFx0XHRcdFx0XHRcdGNhc2UgVG9rZW5UeXBlLlJlZ2V4OlxuXHRcdFx0XHRcdFx0XHRjYXNlIFRva2VuVHlwZS5Xb3JkOlxuXHRcdFx0XHRcdFx0XHRcdGJ1ZmZlciArPSBcIiBcIjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnVmZmVyICs9IHRva2VuLndvcmQ7XG5cdFx0XHRcdFx0Y29udGludWUgbG9vcDtcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlIFRva2VuVHlwZS5TeW1ib2w6IHtcblx0XHRcdFx0XHRpZiAodG9rZW4uc3ltYm9sID09PSBTeW1ib2xzLlR5cGUuUkJyYWNrZXQpIGJyZWFrIGxvb3A7XG5cdFx0XHRcdFx0aWYgKHRva2VuLnN5bWJvbCA9PT0gU3ltYm9scy5UeXBlLkNvbG9uKSBicmVhayBsb29wO1xuXHRcdFx0XHRcdGlmICh0b2tlbi5zeW1ib2wgPT09IFN5bWJvbHMuVHlwZS5OZWdhdGUpIHtcblx0XHRcdFx0XHRcdC8vIHRvIG1hdGNoIG9ic2lkaWFuJ3MgYmVoYXZpb3IsIGludGVudGlvbmFsbHkgZGlzZ2FyZCBuZXh0IGZpbHRlcnNcblx0XHRcdFx0XHRcdGNvbnN0IHsgZW5kIH0gPSB0aGlzLnBhcnNlUHJvcGVydHlOYW1lKHRva2VucywgaSwgbG9nZ2VyKTtcblx0XHRcdFx0XHRcdGkgPSBlbmQ7XG5cdFx0XHRcdFx0XHRicmVhayBsb29wO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRidWZmZXIgKz0gdG9rZW4ucmF3XG5cdFx0XHRcdFx0Y29udGludWUgbG9vcDtcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlIFRva2VuVHlwZS5LZXl3b3JkOiB7XG5cdFx0XHRcdFx0aWYgKGJ1ZmZlci5sZW5ndGggPiAwKSBidWZmZXIgKz0gXCIgXCJcblx0XHRcdFx0XHRidWZmZXIgKz0gdG9rZW4ucmF3ICsgXCI6XCJcblx0XHRcdFx0XHRjb250aW51ZSBsb29wO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGxldCBmaWx0ZXIgPSBmaWx0ZXJzLnByb3BlcnR5TmFtZShtYXRjaGVycy5iYXNpYyhidWZmZXIpKTtcblx0XHRpZiAobmVnYXRlZCkge1xuXHRcdFx0ZmlsdGVyID0gZmlsdGVyLm5lZ2F0ZWQoKVxuXHRcdH1cblx0XHRyZXR1cm4geyBmaWx0ZXIsIGVuZDogaSB9O1xuXHR9XG5cblx0cGFyc2VHcm91cGVkRmlsZVN1YnF1ZXJ5KHRva2VuczogUmVhZG9ubHlBcnJheTxUb2tlbj4sIHN0YXJ0OiBudW1iZXIsIGxvZ2dlcj86IENvbnNvbGUpOiB7IG1hdGNoZXI6IG1hdGNoZXJzLlN0cmluZ01hdGNoZXIsIGVuZDogbnVtYmVyIH0ge1xuXHRcdGxldCBidWZmZXIgPSBcIlwiO1xuXHRcdGZvciAobGV0IGkgPSBzdGFydDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgdG9rZW4gPSB0b2tlbnNbaV07XG5cdFx0XHRpZiAodG9rZW4ua2luZCA9PT0gVG9rZW5UeXBlLlN5bWJvbCAmJiB0b2tlbi5zeW1ib2wgPT09IFN5bWJvbHMuVHlwZS5SUGFyZW4pIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRpZiAoYnVmZmVyLmxlbmd0aCA+IDApIHsgYnVmZmVyICs9IFwiIFwiOyB9XG5cdFx0XHRidWZmZXIgKz0gdG9rZW4ucmF3O1xuXHRcdH1cblx0XHRyZXR1cm4geyBtYXRjaGVyOiBtYXRjaGVycy5iYXNpYyhcIihcIiArIGJ1ZmZlciArIFwiKVwiKSwgZW5kOiB0b2tlbnMubGVuZ3RoIH1cblx0fVxuXG5cdHBhcnNlR3JvdXAodG9rZW5zOiBSZWFkb25seUFycmF5PFRva2VuPiwgc3RhcnQ6IG51bWJlciwgbG9nZ2VyPzogQ29uc29sZSk6IHsgZmlsdGVyOiBmaWx0ZXJzLkFzeW5jRmlsZUZpbHRlciB8IGZpbHRlcnMuRmlsZUZpbHRlciwgZW5kOiBudW1iZXIgfSB7XG5cdFx0bGV0IGlzX2FzeW5jID0gZmFsc2Vcblx0XHRjb25zdCBmb3VuZF9maWx0ZXJzOiBBcnJheTxmaWx0ZXJzLkFzeW5jRmlsZUZpbHRlciB8IGZpbHRlcnMuRmlsZUZpbHRlcj4gPSBbXTtcblx0XHRsZXQgaSA9IHN0YXJ0O1xuXHRcdGZvciAoOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCB0b2tlbiA9IHRva2Vuc1tpXTtcblx0XHRcdGxvZ2dlcj8ubG9nKFwicGFyc2VHcm91cFwiLCB7IHRva2VuLCBpIH0pXG5cdFx0XHRpZiAodG9rZW4ua2luZCA9PT0gVG9rZW5UeXBlLlN5bWJvbCAmJiB0b2tlbi5zeW1ib2wgPT09IFN5bWJvbHMuVHlwZS5SUGFyZW4pIHtcblx0XHRcdFx0aSs9MTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHsgZmlsdGVyLCBlbmQgfSA9IHRoaXMucGFyc2VGaWx0ZXIodG9rZW5zLCBpLCBsb2dnZXIpO1xuXHRcdFx0aWYgKGZpbHRlciBpbnN0YW5jZW9mIGZpbHRlcnMuQXN5bmNGaWx0ZXIpIHtcblx0XHRcdFx0aXNfYXN5bmMgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0Zm91bmRfZmlsdGVycy5wdXNoKGZpbHRlcik7XG5cdFx0XHRpID0gZW5kO1xuXHRcdH1cblxuXHRcdGlmIChpc19hc3luYykge1xuXHRcdFx0Y29uc3QgYXN5bmNfZmlsdGVycyA9IGZvdW5kX2ZpbHRlcnMubWFwKGl0ID0+IGl0IGluc3RhbmNlb2YgZmlsdGVycy5Bc3luY0ZpbHRlciA/IGl0IDogaXQuYXN5bmMoKSk7XG5cdFx0XHRyZXR1cm4geyBcblx0XHRcdFx0ZmlsdGVyOiBmaWx0ZXJzLmFsbEFzeW5jKFxuXHRcdFx0XHRcdGFzeW5jX2ZpbHRlcnNbMF0sXG5cdFx0XHRcdFx0Li4uYXN5bmNfZmlsdGVycy5zbGljZSgxKSxcblx0XHRcdFx0KSxcblx0XHRcdFx0ZW5kOiBpLFxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4geyBcblx0XHRcdGZpbHRlcjogZmlsdGVycy5hbGwoXG5cdFx0XHRcdGZvdW5kX2ZpbHRlcnNbMF0gYXMgZmlsdGVycy5GaWxlRmlsdGVyLFxuXHRcdFx0XHQuLi5mb3VuZF9maWx0ZXJzLnNsaWNlKDEpIGFzIGZpbHRlcnMuRmlsZUZpbHRlcltdLFxuXHRcdFx0KSxcblx0XHRcdGVuZDogaSxcblx0XHR9XG5cblx0fVxufVxuXG5mdW5jdGlvbiB0b2tlbml6ZVF1ZXJ5KHF1ZXJ5OiBzdHJpbmcsIGxvZ2dlcj86IENvbnNvbGUpIHtcblx0cXVlcnkgPSBxdWVyeS50cmltKCk7XG5cblx0Y29uc3QgZm91bmRfdG9rZW5zOiBBcnJheTxUb2tlbj4gPSBbXTtcblx0bGV0IGJ1Zl9zdGFydCA9IDA7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgcXVlcnkubGVuZ3RoOyBpKyspIHtcblx0XHRjb25zdCBjaGFyID0gcXVlcnlbaV07XG5cdFx0bG9nZ2VyPy5sb2coeyBjaGFyLCBpLCBidWZfc3RhcnQgfSlcblxuXHRcdGlmIChjaGFyID09PSBcIi1cIikge1xuXHRcdFx0Zm91bmRfdG9rZW5zLnB1c2goU3ltYm9scy5OZWdhdGUpO1xuXHRcdFx0YnVmX3N0YXJ0ICs9IDE7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAoY2hhciA9PT0gXCIoXCIpIHtcblx0XHRcdGZvdW5kX3Rva2Vucy5wdXNoKFN5bWJvbHMuTFBhcmVuKVxuXHRcdFx0YnVmX3N0YXJ0ICs9IDE7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAoY2hhciA9PT0gXCIpXCIpIHtcblx0XHRcdGlmIChidWZfc3RhcnQgPCBpKSB7XG5cdFx0XHRcdGZvdW5kX3Rva2Vucy5wdXNoKG5ldyBXb3JkKHsgd29yZDogcXVlcnkuc2xpY2UoYnVmX3N0YXJ0LCBpKSB9KSlcblx0XHRcdH1cblx0XHRcdGZvdW5kX3Rva2Vucy5wdXNoKFN5bWJvbHMuUlBhcmVuKVxuXHRcdFx0YnVmX3N0YXJ0ID0gaSArIDE7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAoY2hhciA9PT0gJy8nKSB7XG5cdFx0XHRjb25zdCB7IHJlZ2V4LCBlbmQgfSA9IHRva2VuaXplUmVnZXgocXVlcnksIGkgKyAxKTtcblx0XHRcdGxvZ2dlcj8ubG9nKHsgcmVnZXggfSlcblx0XHRcdGZvdW5kX3Rva2Vucy5wdXNoKG5ldyBSZWdleFRva2VuKHsgcmVnZXggfSkpO1xuXHRcdFx0YnVmX3N0YXJ0ID0gZW5kICsgMVxuXHRcdFx0aSA9IGVuZDtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGlmIChjaGFyID09PSAnXCInICYmIGJ1Zl9zdGFydCA9PT0gaSkge1xuXHRcdFx0Y29uc3QgeyBxdW90ZSwgZW5kIH0gPSBjb25zdW1lUXVvdGUocXVlcnksIGkgKyAxKVxuXHRcdFx0bG9nZ2VyPy5sb2coeyBxdW90ZSB9KVxuXHRcdFx0Zm91bmRfdG9rZW5zLnB1c2gobmV3IFBocmFzZSh7IHBocmFzZTogcXVvdGUgfSkpO1xuXHRcdFx0YnVmX3N0YXJ0ID0gZW5kICsgMVxuXHRcdFx0aSA9IGVuZDtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGlmIChjaGFyID09PSBcIltcIikge1xuXHRcdFx0Zm91bmRfdG9rZW5zLnB1c2goU3ltYm9scy5MQnJhY2tldCk7XG5cdFx0XHRidWZfc3RhcnQgPSBpICsgMTtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblx0XHRpZiAoY2hhciA9PT0gXCJdXCIpIHtcblx0XHRcdGlmIChidWZfc3RhcnQgPCBpKSB7XG5cdFx0XHRcdGZvdW5kX3Rva2Vucy5wdXNoKG5ldyBXb3JkKHsgd29yZDogcXVlcnkuc2xpY2UoYnVmX3N0YXJ0LCBpKSB9KSlcblx0XHRcdH1cblx0XHRcdGZvdW5kX3Rva2Vucy5wdXNoKFN5bWJvbHMuUkJyYWNrZXQpO1xuXHRcdFx0YnVmX3N0YXJ0ID0gaSArIDE7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAoY2hhciA9PT0gXCI6XCIpIHtcblx0XHRcdGNvbnN0IHdvcmQgPSBxdWVyeS5zbGljZShidWZfc3RhcnQsIGkpO1xuXHRcdFx0c3dpdGNoICh3b3JkKSB7XG5cdFx0XHRcdGNhc2UgXCJmaWxlXCI6IHsgZm91bmRfdG9rZW5zLnB1c2goS2V5d29yZC5GaWxlKTsgYnJlYWs7IH1cblx0XHRcdFx0Y2FzZSBcInBhdGhcIjogeyBmb3VuZF90b2tlbnMucHVzaChLZXl3b3JkLlBhdGgpOyBicmVhazsgfVxuXHRcdFx0XHRjYXNlIFwidGFnXCI6IHsgZm91bmRfdG9rZW5zLnB1c2goS2V5d29yZC5UYWcpOyBicmVhazsgfVxuXHRcdFx0XHRkZWZhdWx0OiBmb3VuZF90b2tlbnMucHVzaChuZXcgV29yZCh7IHdvcmQgfSkpXG5cdFx0XHR9XG5cdFx0XHRmb3VuZF90b2tlbnMucHVzaChTeW1ib2xzLkNvbG9uKTtcblx0XHRcdGJ1Zl9zdGFydCA9IGkgKyAxO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0aWYgKGNoYXIgPT09IFwiIFwiKSB7XG5cdFx0XHRmb3VuZF90b2tlbnMucHVzaChuZXcgV29yZCh7IHdvcmQ6IHF1ZXJ5LnNsaWNlKGJ1Zl9zdGFydCwgaSkgfSkpXG5cdFx0XHRidWZfc3RhcnQgPSBpICsgMTtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblx0fVxuXHRpZiAoYnVmX3N0YXJ0IDwgcXVlcnkubGVuZ3RoKSB7XG5cdFx0Zm91bmRfdG9rZW5zLnB1c2gobmV3IFdvcmQoeyB3b3JkOiBxdWVyeS5zbGljZShidWZfc3RhcnQpIH0pKVxuXHR9XG5cblx0cmV0dXJuIGZvdW5kX3Rva2Vucztcbn1cblxuZnVuY3Rpb24gY29uc3VtZVF1b3RlKHF1ZXJ5OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIpOiB7IHF1b3RlOiBzdHJpbmcsIGVuZDogbnVtYmVyIH0ge1xuXHRjb25zdCBidWZmZXI6IEFycmF5PHN0cmluZz4gPSBbXTtcblx0bGV0IGVzY2FwZWQgPSBmYWxzZTtcblx0bGV0IGkgPSBzdGFydDtcblx0Zm9yIChpOyBpIDwgcXVlcnkubGVuZ3RoOyBpKyspIHtcblx0XHRjb25zdCBjaGFyID0gcXVlcnlbaV07XG5cblx0XHRpZiAoZXNjYXBlZCkge1xuXHRcdFx0ZXNjYXBlZCA9IGZhbHNlO1xuXHRcdFx0YnVmZmVyLnB1c2goY2hhcilcblx0XHRcdGNvbnRpbnVlXG5cdFx0fVxuXHRcdGlmIChjaGFyID09PSBcIlxcXFxcIikge1xuXHRcdFx0ZXNjYXBlZCA9IHRydWU7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAoY2hhciA9PT0gJ1wiJykge1xuXHRcdFx0aSsrXG5cdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRidWZmZXIucHVzaChjaGFyKVxuXHR9XG5cdHJldHVybiB7IHF1b3RlOiBidWZmZXIuam9pbihcIlwiKSwgZW5kOiBpIH07XG59XG5cbmZ1bmN0aW9uIHRva2VuaXplUmVnZXgocXVlcnk6IHN0cmluZywgc3RhcnQ6IG51bWJlcik6IHsgcmVnZXg6IFJlZ0V4cCwgZW5kOiBudW1iZXIgfSB7XG5cdGNvbnN0IGJ1ZmZlcjogQXJyYXk8c3RyaW5nPiA9IFtdO1xuXHRsZXQgaSA9IHN0YXJ0O1xuXHRmb3IgKGk7IGkgPCBxdWVyeS5sZW5ndGg7IGkrKykge1xuXHRcdGNvbnN0IGNoYXIgPSBxdWVyeVtpXTtcblxuXHRcdGlmIChjaGFyID09PSAnLycpIHtcblx0XHRcdGlmIChidWZmZXIubGVuZ3RoID4gMCAmJiBidWZmZXJbYnVmZmVyLmxlbmd0aCAtIDFdID09PSAnXFxcXCcpIHtcblx0XHRcdFx0YnVmZmVyLnB1c2goY2hhcilcblx0XHRcdFx0Y29udGludWVcblx0XHRcdH1cblx0XHRcdGkrK1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0YnVmZmVyLnB1c2goY2hhcilcblx0fVxuXHRyZXR1cm4geyByZWdleDogbmV3IFJlZ0V4cChidWZmZXIuam9pbihcIlwiKSksIGVuZDogaSB9O1xufVxuXG5lbnVtIFRva2VuVHlwZSB7XG5cdFBocmFzZSxcblx0UmVnZXgsXG5cdFdvcmQsXG5cblx0U3ltYm9sLFxuXG5cdEtleXdvcmQsXG59XG5cbm5hbWVzcGFjZSBLZXl3b3JkIHtcblx0ZXhwb3J0IGVudW0gS2luZCB7XG5cdFx0RmlsZSxcblx0XHRQYXRoLFxuXHRcdFRhZyxcblx0fTtcblxuXHRleHBvcnQgY29uc3QgRmlsZSA9IE9iamVjdC5mcmVlemUoeyBraW5kOiBUb2tlblR5cGUuS2V5d29yZCwga2V5d29yZDogS2V5d29yZC5LaW5kLkZpbGUsIHJhdzogXCJmaWxlXCIgfSk7XG5cdGV4cG9ydCBjb25zdCBQYXRoID0gT2JqZWN0LmZyZWV6ZSh7IGtpbmQ6IFRva2VuVHlwZS5LZXl3b3JkLCBrZXl3b3JkOiBLZXl3b3JkLktpbmQuUGF0aCwgcmF3OiBcInBhdGhcIiB9KTtcblx0ZXhwb3J0IGNvbnN0IFRhZyA9IE9iamVjdC5mcmVlemUoeyBraW5kOiBUb2tlblR5cGUuS2V5d29yZCwga2V5d29yZDogS2V5d29yZC5LaW5kLlRhZywgcmF3OiBcInRhZ1wiIH0pO1xuXG5cdGV4cG9ydCB0eXBlIFRva2VuID0gfFxuXHRcdCh0eXBlb2YgRmlsZSkgfFxuXHRcdCh0eXBlb2YgUGF0aCkgfFxuXHRcdCh0eXBlb2YgVGFnKTtcbn1cblxubmFtZXNwYWNlIFN5bWJvbHMge1xuXHRleHBvcnQgZW51bSBUeXBlIHtcblx0XHROZWdhdGUsXG5cdFx0TFBhcmVuLFxuXHRcdFJQYXJlbixcblx0XHRMQnJhY2tldCxcblx0XHRSQnJhY2tldCxcblx0XHRDb2xvbixcblx0fVxuXG5cdGV4cG9ydCBjb25zdCBOZWdhdGUgPSBPYmplY3QuZnJlZXplKHsga2luZDogVG9rZW5UeXBlLlN5bWJvbCwgc3ltYm9sOiBUeXBlLk5lZ2F0ZSwgcmF3OiBcIi1cIiB9KTtcblx0ZXhwb3J0IGNvbnN0IENvbG9uID0gT2JqZWN0LmZyZWV6ZSh7IGtpbmQ6IFRva2VuVHlwZS5TeW1ib2wsIHN5bWJvbDogVHlwZS5Db2xvbiwgcmF3OiBcIjpcIiB9KTtcblx0ZXhwb3J0IGNvbnN0IExQYXJlbiA9IE9iamVjdC5mcmVlemUoeyBraW5kOiBUb2tlblR5cGUuU3ltYm9sLCBzeW1ib2w6IFR5cGUuTFBhcmVuLCByYXc6IFwiKFwiIH0pO1xuXHRleHBvcnQgY29uc3QgUlBhcmVuID0gT2JqZWN0LmZyZWV6ZSh7IGtpbmQ6IFRva2VuVHlwZS5TeW1ib2wsIHN5bWJvbDogVHlwZS5SUGFyZW4sIHJhdzogXCIpXCIgfSk7XG5cdGV4cG9ydCBjb25zdCBMQnJhY2tldCA9IE9iamVjdC5mcmVlemUoeyBraW5kOiBUb2tlblR5cGUuU3ltYm9sLCBzeW1ib2w6IFR5cGUuTEJyYWNrZXQsIHJhdzogXCJbXCIgfSk7XG5cdGV4cG9ydCBjb25zdCBSQnJhY2tldCA9IE9iamVjdC5mcmVlemUoeyBraW5kOiBUb2tlblR5cGUuU3ltYm9sLCBzeW1ib2w6IFR5cGUuUkJyYWNrZXQsIHJhdzogXCJdXCIgfSk7XG5cblx0ZXhwb3J0IHR5cGUgVG9rZW4gPSB8XG5cdFx0KHR5cGVvZiBOZWdhdGUpIHxcblx0XHQodHlwZW9mIExQYXJlbikgfFxuXHRcdCh0eXBlb2YgUlBhcmVuKSB8XG5cdFx0KHR5cGVvZiBMQnJhY2tldCkgfFxuXHRcdCh0eXBlb2YgUkJyYWNrZXQpIHxcblx0XHQodHlwZW9mIENvbG9uKTtcbn07XG5cbmNsYXNzIFBocmFzZSB7XG5cdGdldCBraW5kKCk6IFRva2VuVHlwZS5QaHJhc2Uge1xuXHRcdHJldHVybiBUb2tlblR5cGUuUGhyYXNlO1xuXHR9XG5cblx0cGhyYXNlOiBzdHJpbmc7XG5cdGdldCByYXcoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMucGhyYXNlIH1cblxuXHRjb25zdHJ1Y3RvcihkZWY6IHtcblx0XHRwaHJhc2U6IHN0cmluZyxcblx0fSkge1xuXHRcdHRoaXMucGhyYXNlID0gZGVmLnBocmFzZTtcblx0fVxufVxuXG5jbGFzcyBSZWdleFRva2VuIHtcblx0Z2V0IGtpbmQoKTogVG9rZW5UeXBlLlJlZ2V4IHtcblx0XHRyZXR1cm4gVG9rZW5UeXBlLlJlZ2V4O1xuXHR9XG5cblx0cmVnZXg6IFJlZ0V4cDtcblx0Z2V0IHJhdygpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5yZWdleC5zb3VyY2UgfVxuXG5cdGNvbnN0cnVjdG9yKGRlZjoge1xuXHRcdHJlZ2V4OiBSZWdFeHAsXG5cdH0pIHtcblx0XHR0aGlzLnJlZ2V4ID0gZGVmLnJlZ2V4O1xuXHR9XG59XG5cbmNsYXNzIFdvcmQge1xuXHRnZXQga2luZCgpOiBUb2tlblR5cGUuV29yZCB7XG5cdFx0cmV0dXJuIFRva2VuVHlwZS5Xb3JkO1xuXHR9XG5cblx0d29yZDogc3RyaW5nO1xuXHRnZXQgcmF3KCk6IHN0cmluZyB7IHJldHVybiB0aGlzLndvcmQgfVxuXG5cdGNvbnN0cnVjdG9yKGRlZjoge1xuXHRcdHdvcmQ6IHN0cmluZyxcblx0fSkge1xuXHRcdHRoaXMud29yZCA9IGRlZi53b3JkO1xuXHR9XG59XG5cbnR5cGUgVG9rZW4gPSBQaHJhc2UgfCBXb3JkIHwgUmVnZXhUb2tlbiB8IFN5bWJvbHMuVG9rZW4gfCBLZXl3b3JkLlRva2VuO1xuIiwiLyogKlxuICogVGhlIHB1YmxpYyBBUEkgb2YgdGhlIGxpYnJhcnkuXG4gKi9cbmltcG9ydCB0eXBlICogYXMgb2JzaWRpYW4gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogU2VhcmNoZXMgZm9yIGZpbGVzIG1hdGNoaW5nIHRoZSBwcm92aWRlZCBxdWVyeSwgYW5kIHlpZWxkcyB0aGVtIG9uZSBhdCBhIHRpbWUgYXN5bmNocm9ub3VzbHkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGZvciBhd2FpdCAoY29uc3QgZmlsZSBvZiBzZWFyY2goXCJ0YWc6bWVldGluZ1wiLCBhcHApKSB7XG4gKiAgICAgaWYgKGZpbGUubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpIGJyZWFrO1xuICogfVxuICogYGBgXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoKHF1ZXJ5OiBzdHJpbmcsIGFwcDogb2JzaWRpYW4uQXBwKTogQXN5bmNHZW5lcmF0b3I8b2JzaWRpYW4uVEZpbGU+IHtcblx0Y29uc3QgYWxsRmlsZXMgPSBhcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xuXHRyZXR1cm4gZmlsdGVyKHF1ZXJ5LCBhcHAubWV0YWRhdGFDYWNoZSwgYWxsRmlsZXMpXG59XG5cbi8qKlxuICogRmlsdGVycyB0aGUgcHJvdmlkZWQgZmlsZXMgbWF0Y2hpbmcgdGhlIHByb3ZpZGVkIHF1ZXJ5LCBhbmQgeWllbGRzIHRoZW0gb25lIGF0IGEgdGltZSBhc3luY2hyb25vdXNseS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogZm9yIGF3YWl0IChjb25zdCBmaWxlIG9mIGZpbHRlcihcInRhZzptZWV0aW5nXCIsIGFwcC5tZXRhZGF0YUNhY2hlLCBteUZpbGVzKSkge1xuICogICAgIGlmIChmaWxlLm5hbWUgPT09IFwidGVzdC5tZFwiKSBicmVhaztcbiAqIH1cbiAqIGBgYFxuICpcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiBmaWx0ZXIocXVlcnk6IHN0cmluZyxcblx0bWV0YWRhdGFfY2FjaGU6IG9ic2lkaWFuLk1ldGFkYXRhQ2FjaGUsXG5cdGZpbGVzOiBBcnJheTxvYnNpZGlhbi5URmlsZT5cbik6IEFzeW5jR2VuZXJhdG9yPG9ic2lkaWFuLlRGaWxlPiB7XG5cdGxldCBwYXJzZWRfZmlsdGVyOiBmaWx0ZXJzLkZpbGVGaWx0ZXI7XG5cdHRyeSB7XG5cdFx0cGFyc2VkX2ZpbHRlciA9IHBhcnNlKHF1ZXJ5LCBtZXRhZGF0YV9jYWNoZSk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRjb25zb2xlLmxvZyhlKTtcblx0XHRyZXR1cm4gW107XG5cdH1cblx0Zm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG5cdFx0aWYgKGF3YWl0IHBhcnNlZF9maWx0ZXIuYXBwbGllc1RvKGZpbGUpKSB7XG5cdFx0XHR5aWVsZCBmaWxlO1xuXHRcdH1cblx0fVxufVxuXG5pbXBvcnQgKiBhcyBwYXJzZXIgZnJvbSBcIi4vcGFyc2VyXCI7XG5pbXBvcnQgKiBhcyBmaWx0ZXJzIGZyb20gXCIuL2ZpbHRlcnNcIjtcblxuLyoqXG4gKiBAc2luY2UgMC4xLjBcbiAqIFxuICogUGFyc2VzIHRoZSBwcm92aWRlZCBxdWVyeSBhbmQgcmV0dXJucyBhIEZpbGVGaWx0ZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBtYXRjaCBmaWxlcyBhZ2FpbnN0LlxuICogXG4gKiBAcGFyYW0gcXVlcnkgVGhlIHF1ZXJ5IHRvIHBhcnNlIGFuZCB0dXJuIGludG8gYSB7QGxpbmsgZmlsdGVycy5GaWxlRmlsdGVyfVxuICogQHBhcmFtIG1ldGFkYXRhIE1ldGFkYXRhQ2FjaGUgcHJvdmlkZWQgYnkgT2JzaWRpYW4ncyB7QGxpbmsgQXBwLm1ldGFkYXRhQ2FjaGV9IHByb3BlcnR5LlxuICogQHBhcmFtIGZpbHRlciBUaGUgZmlsdGVyIHRvIGZhbGxiYWNrIHRvIGZvciBhbiBlbXB0eSBxdWVyeS4gIERlZmF1bHQgYmVoYXZpb3IgaXMgdG8ge0BsaW5rIEVtdHB5RmlsdGVyfS5cbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UocXVlcnk6IHN0cmluZywgbWV0YWRhdGE6IG9ic2lkaWFuLk1ldGFkYXRhQ2FjaGUpOiBmaWx0ZXJzLkZpbGVGaWx0ZXIge1xuXHRyZXR1cm4gbmV3IHBhcnNlci5QYXJzZXIoeyBtZXRhZGF0YUNhY2hlOiBtZXRhZGF0YSB9KS5maWx0ZXJGcm9tUXVlcnkocXVlcnkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoYWJsZShhcHA6IG9ic2lkaWFuLkFwcCkge1xuXHRyZXR1cm4ge1xuXHRcdHNlYXJjaChxdWVyeTogc3RyaW5nKTogQXN5bmNHZW5lcmF0b3I8b2JzaWRpYW4uVEZpbGU+IHtcblx0XHRcdHJldHVybiBzZWFyY2gocXVlcnksIGFwcClcblx0XHR9LFxuXHRcdGZpbHRlcihxdWVyeTogc3RyaW5nLCBmaWxlczogQXJyYXk8b2JzaWRpYW4uVEZpbGU+KTogQXN5bmNHZW5lcmF0b3I8b2JzaWRpYW4uVEZpbGU+IHtcblx0XHRcdHJldHVybiBmaWx0ZXIocXVlcnksIGFwcC5tZXRhZGF0YUNhY2hlLCBmaWxlcyk7XG5cdFx0fSxcblx0fTtcbn1cbiIsImltcG9ydCAqIGFzIHRlc3RzIGZyb20gXCIuLi9jb250cmFjdC90ZXN0c1wiO1xuaW1wb3J0ICogYXMgZW1iZWRkZWQgZnJvbSBcIi4uL2VtYmVkZGVkL3BsdWdpblwiO1xuaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vZnJhbWV3b3JrXCI7XG5cbmltcG9ydCAqIGFzIGVtYmVkZGVkX3Rlc3RpbmcgZnJvbSBcIi4uL2VtYmVkZGVkL3Rlc3RpbmdcIjtcbmltcG9ydCAqIGFzIGVtYmVkZGVkX3NvY2tldHMgZnJvbSBcIi4uL2VtYmVkZGVkL3NvY2tldHNcIjtcbmltcG9ydCB7IFNlYXJjaCB9IGZyb20gXCIuLi90ZXN0aW5nL3NlYXJjaFwiO1xuXG5pbXBvcnQgKiBhcyBvYnNpZGlhbl9zZWFyY2ggZnJvbSBcIi4uLy4uL3NyYy9pbmRleFwiXG5pbXBvcnQgeyBpbnNwZWN0IH0gZnJvbSBcInV0aWxcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tcGxpYW5jZSBleHRlbmRzIGVtYmVkZGVkLlNvY2tldFJlcG9ydGVyUGx1Z2luIHtcblx0b25sb2FkKHRoaXM6IENvbXBsaWFuY2UpIHtcblx0XHRjb25zdCBydW5uZXIgPSBuZXcgdGVzdGluZy5SdW5uZXIoe1xuXHRcdFx0cmVwb3J0ZXI6IG5ldyB0ZXN0aW5nLlN0YXJ0U3RvcFJlcG9ydGVyKHtcblx0XHRcdFx0b3V0cHV0OiBuZXcgdGVzdGluZy5Xcml0ZXIoe1xuXHRcdFx0XHRcdGltcGw6IHRoaXMuc29ja2V0LFxuXHRcdFx0XHRcdHdyaXRlKHdyaXRlciwgZGF0YSkge1xuXHRcdFx0XHRcdFx0d3JpdGVyLmltcGwud3JpdGUoZGF0YSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdFx0fSkucmVwb3J0ZXIoKSxcblx0XHR9KTtcblxuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5vbkxheW91dFJlYWR5KGFzeW5jICgpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IHBhc3NlZCA9IGF3YWl0IHRlc3RzLnJ1blRlc3RzKHJ1bm5lciwgZW1iZWRkZWRfdGVzdGluZy5maWxlcyh0aGlzLmFwcCksIG5ldyBTZWFyY2goXG5cdFx0XHRcdFx0dGhpcyxcblx0XHRcdFx0XHRhc3luYyBmdW5jdGlvbih0aGlzOiBTZWFyY2g8Q29tcGxpYW5jZT4sIHF1ZXJ5OiBzdHJpbmcpIHtcblx0XHRcdFx0XHRcdGNvbnN0IG1hdGNoZXMgPSBbXTtcblx0XHRcdFx0XHRcdGZvciBhd2FpdCAoY29uc3QgZmlsZSBvZiBvYnNpZGlhbl9zZWFyY2guc2VhcmNoKHF1ZXJ5LCB0aGlzLmltcGwuYXBwKSkge1xuXHRcdFx0XHRcdFx0XHRtYXRjaGVzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0XHRcdFx0XHRwYXRoOiBmaWxlLnBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0YmFzZW5hbWU6IGZpbGUuYmFzZW5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0Y29udGVudDogYXdhaXQgZmlsZS52YXVsdC5jYWNoZWRSZWFkKGZpbGUpLFxuXHRcdFx0XHRcdFx0XHRcdG1ldGFkYXRhOiB0aGlzLmltcGwuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpPy5mcm9udG1hdHRlcixcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXR1cm4gbWF0Y2hlcztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCkpXG5cblx0XHRcdFx0ZW1iZWRkZWRfc29ja2V0cy5zZW5kUmVzdWx0U2lnbmFsKHRoaXMuc29ja2V0LCBwYXNzZWQpXG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHRoaXMuc29ja2V0LndyaXRlKFwiY2F0YXN0cm9waGljIGVycm9yOiBcIiArIGluc3BlY3QoZSkpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxufVxuIl0sIm5hbWVzIjpbInJ1biIsIm9ic2lkaWFuIiwic2VhcmNoIiwiZmlsZSIsInRlc3RGaWxlT3BlcmF0b3IiLCJmaWxlcyIsInQiLCJpdCIsInBhdGgiLCJjb250ZW50IiwicHJlZml4IiwidXRpbCIsInJ1blRlc3RzIiwiU3RhdHVzIiwiX192aXRlX2dsb2JfMF8wIiwiX192aXRlX2dsb2JfMF8xIiwiX192aXRlX2dsb2JfMF8yIiwiX192aXRlX2dsb2JfMF8zIiwiX192aXRlX2dsb2JfMF80IiwiX192aXRlX2dsb2JfMF81IiwiX192aXRlX2dsb2JfMF82IiwidGVzdGluZy5TdGF0dXMiLCJuZXQiLCJpbnNwZWN0IiwidGFnIiwicGF0aHMiLCJ0ZXN0aW5nLkZpbGVzIiwiZmlsdGVyIiwiYWxsIiwibmVnYXRlIiwiZmlsdGVycy5GaWx0ZXIiLCJ0YWdzIiwicmVnZXgiLCJlbmQiLCJmaWx0ZXJzLkFzeW5jRmlsdGVyIiwiZmlsdGVycy5hbnlBc3luYyIsImZpbHRlcnMuYW55IiwiZmlsdGVycy5hbGxBc3luYyIsImZpbHRlcnMuYWxsIiwiZmlsdGVycy5jb250ZW50IiwibWF0Y2hlcnMuYmFzaWMiLCJtYXRjaGVycy5yZWdleCIsImZpbHRlcnMuZmlsZSIsImZpbHRlcnMucGF0aCIsImZpbHRlcnMudGFnIiwibWF0Y2hlcnMubmVnYXRlIiwiZmlsdGVycy5wcm9wZXJ0eSIsImZpbHRlcnMucHJvcGVydHlOYW1lIiwiVG9rZW5UeXBlIiwiS2V5d29yZCIsIktpbmQiLCJTeW1ib2xzIiwiVHlwZSIsInBhcnNlci5QYXJzZXIiLCJlbWJlZGRlZC5Tb2NrZXRSZXBvcnRlclBsdWdpbiIsInRlc3RpbmcuUnVubmVyIiwidGVzdGluZy5TdGFydFN0b3BSZXBvcnRlciIsInRlc3RpbmcuV3JpdGVyIiwidGVzdHMucnVuVGVzdHMiLCJlbWJlZGRlZF90ZXN0aW5nLmZpbGVzIiwib2JzaWRpYW5fc2VhcmNoLnNlYXJjaCIsImVtYmVkZGVkX3NvY2tldHMuc2VuZFJlc3VsdFNpZ25hbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUtBLFNBQXdCLFFBQWNBLE1BQW1CQyxXQUF1QkMsU0FBZ0I7QUFDL0YsRUFBQUYsS0FBSSxLQUFLLFlBQVksT0FBTSxNQUFLO0FBQy9CLFVBQU1HLFFBQU8sTUFBTUYsVUFBUyxXQUFXLFdBQVcsZUFBZTtBQUNqRSxNQUFFLE1BQU0sTUFBTUEsVUFBUyxXQUFXRSxLQUFJLENBQUM7QUFFdkMsVUFBTSxxQkFBcUIsTUFBTUYsVUFBUyxXQUFXLFlBQVksS0FBSztBQUN0RSxNQUFFLE1BQU0sTUFBTUEsVUFBUyxXQUFXLGtCQUFrQixDQUFDO0FBRXJELFVB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
