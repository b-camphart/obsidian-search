## 🔍 Search Basics

### Simple Search

You can search for files using a single word. The search will return any file where that word appears in key parts of the file.

#### Example

```
work
```

### What Gets Matched

A search term will match files if the word appears in any of the following:

* **File name**

  * `work`
  * `works`
  * `work meeting`
  * `homework`

* **File content**

  * Contains `work`, `works`, or `homework`

* **Properties (metadata fields)**

  * Property keys: `{ work: "" }`, `{ works: "" }`, `{ homework: "" }`
  * Property values: `{ used_in: "work" }`, `{ used_in: "works" }`, `{ used_in: "homework" }`

* **Tags**

  * `["work"]`
  * `["works"]`
  * `["homework"]`
  * `["homework", "Q4"]`

💡 **Note:** Partial matches are included. For example, searching for `work` will also match `works` and `homework`.

---

### What Does *Not* Get Matched

* **Folder names are ignored**

  * A file located at `work/meeting.md` will **not** match unless the word appears in the file’s name, content, tags, or properties.

---

### Summary

* Search is **broad and flexible**
* Matches are found in **names, content, properties, and tags**
* **Partial word matches** are supported
* **Folder paths are not searched**

