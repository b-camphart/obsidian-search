## 📁 `path:` Search

### Search for a Single Word

#### Example

```id="z6s6hc"
path:work
```

Matches files where the word appears anywhere in the path.

**Includes:**

* File names:

  * `work`
* Parent folders:

  * `work/notes.md`
  * `homework/notes.md` *(partial match)*
  * `my-work/notes.md` *(combined words)*

**Does not include:**

* File content
* Properties
* Tags

---

## 🔤 Case Sensitivity

### Keyword is case-insensitive

```id="5rqvcc"
PATH:work
```

* `path:` works regardless of capitalization
* Still searches the path (not literal text)

---

### Matching is case-insensitive

```id="4qz7m1"
path:Work
```

Matches:

* `work/notes.md`
* `Work/notes.md`
* `notes/work.md`

---

## 🧩 Quoted Phrases

### Exact phrase matching

```id="pnrj4j"
path:"work meeting"
```

Matches:

* `work meeting.md`
* `notes/work meeting.md`

Does not match:

* `work/meeting.md` *(words are separate)*

---

### Folder matching with `/`

```id="tmb3r3"
path:"work/"
```

Matches:

* `work/notes.md`
* `work/projects/todo.md`
* `homework/notes.md` *(partial match still applies)*

---

### Slash position matters

```id="4a8b3c"
path:"/work"
```

Does **not** match:

* `work/notes.md`

---

### Partial path phrases

```id="5knk1k"
path:"work/meeting"
```

Matches:

* `homework/meetings.md`
at, 
---

### Special characters

```id="5f8r0m"
path:"work (old)"
```

Matches:

* `work (old).md`

---

### Case in phrases

```id="gk3r02"
path:"Work"
```

* Matches both `Work` and `work`
* Phrase matching is still case-insensitive

---

## ➖ Negation

```id="b9h2pf"
-path:work
```

or

```id="m6f8jk"
path:-work
```

Matches:

* Files **without** `work` in the path

Does not match:

* `work/meeting.md`
* `meetings/work.md`

---

## 🧠 Grouping

```id="3l8x1c"
path:(work meeting)
```

Matches files where **both words** appear in the path:

* `work/meeting.md`
* `notes/work meeting.md`

Does not match:

* Files with only one of the words

---

## 🔍 Regular Expressions

```id="8y1lqk"
path:/^work/
```

Matches:

* Paths starting with `work`

Does not match:

* `notes/work/notes.md`

---

```id="i9zn5y"
path:/[0-9]+/
```

Matches:

* `2024/notes.md`
* `notes-1.md`

Does not match:

* Paths without numbers

---

## ⚠️ Empty Search

```id="9u4m1e"
path:
```

* Matches nothing

---

## 🔗 Combining Searches

### Multiple `path:` filters

```id="nb5v8b"
path:work path:meeting
```

Matches:

* Files whose path contains **both** words

---

### Mixing with general search

```id="h7d2qa"
path:work meeting
```

Matches:

* Files in `work/` that also contain `meeting` (e.g. in content)

Does not match:

* Files that only match the path

---
