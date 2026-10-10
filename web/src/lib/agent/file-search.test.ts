/* Bounded project file search: prefix hits sort first, short queries and
   unreadable folders are handled honestly, and depth/results stay capped. */

import { describe, expect, it } from "vitest"

import { searchProjectFiles, SEARCH_MAX_DEPTH, SEARCH_MAX_RESULTS, type FileLister } from "./file-search"
import type { DirEntryInfo } from "../agent-tools"

type Tree = Record<string, DirEntryInfo[]>

const file = (name: string): DirEntryInfo => ({ name, kind: "file", size: null })
const dir = (name: string): DirEntryInfo => ({ name, kind: "dir", size: null })

function treeLister(tree: Tree): FileLister {
  return async (_root, path) => ({
    path: path ?? "",
    entries: tree[path ?? ""] ?? [],
    truncated: false,
  })
}

describe("searchProjectFiles", () => {
  const tree: Tree = {
    "": [dir("src"), file("README.md")],
    src: [file("app.ts"), file("application.ts"), file("myapp.ts"), file("helpers.ts"), dir("tests")],
    "src/tests": [file("app.spec.ts")],
  }

  it("returns nothing for short or empty queries", async () => {
    expect(await searchProjectFiles("/repo", "", treeLister(tree))).toEqual([])
    expect(await searchProjectFiles("/repo", "a", treeLister(tree))).toEqual([])
    expect(await searchProjectFiles("", "app", treeLister(tree))).toEqual([])
  })

  it("finds matches across folders with prefix hits ahead of substring hits", async () => {
    const hits = await searchProjectFiles("/repo", "app", treeLister(tree))
    expect(hits).toEqual(["src/app.ts", "src/application.ts", "src/tests/app.spec.ts", "src/myapp.ts"])
    expect(hits).not.toContain("src/helpers.ts")
    /* myapp.ts matches only as a substring, so it sorts after every
       file whose name starts with the query — even ones deeper in
       the tree that were scanned later. */
    expect(hits.indexOf("src/myapp.ts")).toBe(hits.length - 1)
  })

  it("skips unreadable folders instead of failing the search", async () => {
    const flaky: FileLister = async (_root, path) => {
      const key = path ?? ""
      if (key === "locked") throw new Error("EACCES")
      if (key === "") return { path: "", entries: [dir("locked"), file("note.md")], truncated: false }
      return { path: key, entries: [], truncated: false }
    }
    const hits = await searchProjectFiles("/repo", "note", flaky)
    expect(hits).toEqual(["note.md"])
  })

  it("never walks deeper than the depth cap", async () => {
    const depths: string[] = []
    const deep: FileLister = async (_root, path) => {
      depths.push(path ?? "")
      const depth = path ? path.split("/").length : 0
      if (depth >= SEARCH_MAX_DEPTH) return { path: path ?? "", entries: [file(`deep${depth}.md`)], truncated: false }
      return { path: path ?? "", entries: [dir(`level${depth}`)], truncated: false }
    }
    await searchProjectFiles("/repo", "level", deep)
    expect(depths.every((path) => (path ? path.split("/").length : 0) <= SEARCH_MAX_DEPTH)).toBe(true)
  })

  it("caps the result list", async () => {
    const wide: FileLister = async (_root, path) => {
      if (path) return { path, entries: [], truncated: false }
      return {
        path: "",
        entries: Array.from({ length: 80 }, (_, index) => file(`match-${index}.md`)),
        truncated: false,
      }
    }
    const hits = await searchProjectFiles("/repo", "match", wide)
    expect(hits).toHaveLength(SEARCH_MAX_RESULTS)
  })
})
