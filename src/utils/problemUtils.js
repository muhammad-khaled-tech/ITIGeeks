import Papa from "papaparse";

// --- Metadata Configuration (Google Sheets) ---
const META_SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/1sRWp95wqo3a7lLBbtNd_3KkTyGjx_9sctTOL5JOb6pA/export?format=csv";

let metaMap = new Map();
let isMetadataLoaded = false;
let metadataPromise = null;

/**
 * Fetches problem metadata from Google Sheets.
 */
export async function fetchMetadata() {
  if (isMetadataLoaded) return metaMap;
  if (metadataPromise) return metadataPromise;

  metadataPromise = (async () => {
    try {
      const res = await fetch(META_SHEET_CSV);
      const text = await res.text();
      const p = Papa.parse(text, { header: false, skipEmptyLines: true });

      // Build the Knowledge Base (metaMap)
      // Usually starts from row 4 (index 3) based on the existing code
      p.data.slice(3).forEach((r) => {
        if (r.length > 6) {
          const title = r[1]?.trim();
          const topic = r[5]?.trim();
          const difficulty = r[6]?.trim();

          if (title) {
            const slugKey = title.toLowerCase().replace(/\s+/g, "-");
            const data = {
              d:
                difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)
                  ? difficulty
                  : null,
              t: topic || "Uncategorized",
            };
            metaMap.set(slugKey, data);
            metaMap.set(title.toLowerCase(), data);
          }
        }
      });

      isMetadataLoaded = true;
      console.log("Global Metadata Loaded");
      return metaMap;
    } catch (e) {
      console.error("Failed to load metadata:", e);
      return metaMap;
    }
  })();

  return metadataPromise;
}

/**
 * Returns the currently loaded metadata map.
 */
export function getLoadedMetaMap() {
  return metaMap;
}

// --- NeetCode to LeetCode Mapping ---
export const neetCodeMap = {
  "reverse nodes in k-group": "reverse nodes in k-group",
  "invert binary tree": "invert binary tree",
  "maximum depth of binary tree": "maximum depth of binary tree",
  "diameter of binary tree": "diameter of binary tree",
  "balanced binary tree": "balanced binary tree",
  "same binary tree": "same tree",
  "subtree of another tree": "subtree of another tree",
  "lowest common ancestor of a binary search tree":
    "lowest common ancestor of a binary search tree",
  "binary tree level order traversal": "binary tree level order traversal",
  "binary tree right side view": "binary tree right side view",
  "count good nodes in binary tree": "count good nodes in binary tree",
  "validate binary search tree": "validate binary search tree",
  "kth smallest integer in bst": "kth smallest element in a bst",
  "construct binary tree from preorder and inorder traversal":
    "construct binary tree from preorder and inorder traversal",
  "binary tree maximum path sum": "binary tree maximum path sum",
  "serialize and deserialize binary tree":
    "serialize and deserialize binary tree",
};

// --- Local Knowledge Base ---
export const LOCAL_KNOWLEDGE_BASE = {
  "remove-element": { d: "Easy", t: "Arrays & Hashing" },
  "majority-element": { d: "Easy", t: "Arrays & Hashing" },
  "best-time-to-buy-and-sell-stock": { d: "Easy", t: "Arrays & Hashing" },
  "best-time-to-buy-and-sell-stock-ii": { d: "Medium", t: "Arrays & Hashing" },
  "jump-game": { d: "Medium", t: "Dynamic Programming" },
  "jump-game-ii": { d: "Medium", t: "Dynamic Programming" },
  "gas-station": { d: "Medium", t: "Greedy" },
  candy: { d: "Hard", t: "Greedy" },
  "trapping-rain-water": { d: "Hard", t: "Arrays & Hashing" },
  "roman-to-integer": { d: "Easy", t: "Math & Geometry" },
  "integer-to-roman": { d: "Medium", t: "Math & Geometry" },
  "longest-common-prefix": { d: "Easy", t: "Strings" },
  "reverse-words-in-a-string": { d: "Medium", t: "Strings" },
  "h-index": { d: "Medium", t: "Arrays & Hashing" },
  "insert-delete-getrandom-o1": { d: "Medium", t: "Arrays & Hashing" },
  "product-of-array-except-self": { d: "Medium", t: "Arrays & Hashing" },
};

export function guessCategory(name) {
  const n = (name || "").toLowerCase();

  // ... (keeping the existing guessCategory implementation which is already good)
  if (n.includes("tree") || n.includes("binary") || n.includes("bst"))
    return "Trees";

  if (
    n.includes("graph") ||
    n.includes("island") ||
    n.includes("course") ||
    n.includes("clone") ||
    n.includes("redundant") ||
    n.includes("network") ||
    n.includes("bipartite") ||
    n.includes("path")
  )
    return "Graphs";

  if (
    n.includes("array") ||
    n.includes("sum") ||
    n.includes("product") ||
    n.includes("duplicate") ||
    n.includes("element") ||
    n.includes("stock") ||
    n.includes("hash") ||
    n.includes("set") ||
    n.includes("intersection") ||
    n.includes("union") ||
    n.includes("majority") ||
    n.includes("rotate")
  )
    return "Arrays & Hashing";

  if (
    n.includes("list") ||
    n.includes("node") ||
    n.includes("lru") ||
    n.includes("pointer") ||
    n.includes("tail") ||
    n.includes("head") ||
    n.includes("linked") ||
    n.includes("cycle")
  )
    return "Linked List";

  if (
    n.includes("string") ||
    n.includes("palindrome") ||
    n.includes("anagram") ||
    n.includes("word") ||
    n.includes("prefix") ||
    n.includes("suffix") ||
    n.includes("substring") ||
    n.includes("character")
  )
    return "Strings";

  if (
    n.includes("search") ||
    n.includes("binary search") ||
    n.includes("rotated") ||
    n.includes("median")
  )
    return "Binary Search";

  if (
    n.includes("matrix") ||
    n.includes("sudoku") ||
    n.includes("grid") ||
    n.includes("board")
  )
    return "Matrix";

  if (
    n.includes("stack") ||
    n.includes("parentheses") ||
    n.includes("postfix") ||
    n.includes("prefix")
  )
    return "Stacks";

  if (
    n.includes("queue") ||
    n.includes("heap") ||
    n.includes("priority") ||
    n.includes("kth") ||
    n.includes("top k")
  )
    return "Heaps/Queues";

  if (n.includes("sort") || n.includes("merge") || n.includes("partition"))
    return "Sorting";

  if (
    n.includes("dp") ||
    n.includes("dynamic") ||
    n.includes("subsequence") ||
    n.includes("subset") ||
    n.includes("jump") ||
    n.includes("climb") ||
    n.includes("rob") ||
    n.includes("coin") ||
    n.includes("decode")
  )
    return "Dynamic Programming";

  if (
    n.includes("backtrack") ||
    n.includes("permutation") ||
    n.includes("combination") ||
    n.includes("n-queens")
  )
    return "Backtracking";

  if (
    n.includes("math") ||
    n.includes("number") ||
    n.includes("bit") ||
    n.includes("roman") ||
    n.includes("integer") ||
    n.includes("coordinate") ||
    n.includes("line")
  )
    return "Math & Geometry";

  if (
    n.includes("window") ||
    n.includes("sliding") ||
    n.includes("consecutive")
  )
    return "Sliding Window";

  if (n.includes("greedy") || n.includes("gas") || n.includes("candy"))
    return "Greedy";

  return "Uncategorized";
}

export function findBestMatch(name, customMetaMap = null) {
  let cleanName = (name || "").toLowerCase().trim();
  cleanName = cleanName
    .replace(/^leetcode\s-\s/i, "")
    .replace(/\s(i|ii|iii|iv|v)$/i, "");

  if (neetCodeMap[cleanName]) cleanName = neetCodeMap[cleanName];

  const slug = cleanName.replace(/\s+/g, "-");
  if (LOCAL_KNOWLEDGE_BASE[slug]) return LOCAL_KNOWLEDGE_BASE[slug];

  // Try the custom map first, then the global one
  if (customMetaMap && customMetaMap.has(slug)) return customMetaMap.get(slug);
  if (metaMap.has(slug)) return metaMap.get(slug);
  if (metaMap.has(cleanName)) return metaMap.get(cleanName);

  return null;
}
