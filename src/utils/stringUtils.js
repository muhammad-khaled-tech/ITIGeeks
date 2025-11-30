// Mapping logic (ported from index.html)
export const neetCodeMap = { "duplicate integer": "contains duplicate", "is anagram": "valid anagram", "two integer sum": "two sum", "anagram groups": "group anagrams", "top k elements in list": "top k frequent elements", "string encode and decode": "encode and decode strings", "products of array discluding self": "product of array except self", "valid sudoku": "valid sudoku", "longest consecutive sequence": "longest consecutive sequence", "valid palindrome": "valid palindrome", "three integer sum": "3sum", "buy and sell crypto": "best time to buy and sell stock", "longest substring without duplicates": "longest substring without repeating characters", "longest repeating substring with replacement": "longest repeating character replacement", "minimum window with characters": "minimum window substring", "validate parentheses": "valid parentheses", "valid parentheses": "valid parentheses", "reverse a linked list": "reverse linked list", "merge two sorted linked lists": "merge two sorted lists", "reorder linked list": "reorder list", "remove node from end of linked list": "remove nth node from end of list", "copy linked list with random pointer": "copy list with random pointer", "add two numbers": "add two numbers", "linked list cycle detection": "linked list cycle", "find the duplicate number": "find the duplicate number", "lru cache": "lru cache", "merge k sorted linked lists": "merge k sorted lists", "reverse nodes in k-group": "reverse nodes in k-group", "invert binary tree": "invert binary tree", "maximum depth of binary tree": "maximum depth of binary tree", "diameter of binary tree": "diameter of binary tree", "balanced binary tree": "balanced binary tree", "same binary tree": "same tree", "subtree of another tree": "subtree of another tree", "lowest common ancestor of a binary search tree": "lowest common ancestor of a binary search tree", "binary tree level order traversal": "binary tree level order traversal", "binary tree right side view": "binary tree right side view", "count good nodes in binary tree": "count good nodes in binary tree", "validate binary search tree": "validate binary search tree", "kth smallest integer in bst": "kth smallest element in a bst", "construct binary tree from preorder and inorder traversal": "construct binary tree from preorder and inorder traversal", "binary tree maximum path sum": "binary tree maximum path sum", "serialize and deserialize binary tree": "serialize and deserialize binary tree" };

export const findBestMatch = (name, metaMap) => {
    if (!name || !metaMap) return null;

    let cleanName = name.toLowerCase();
    if (neetCodeMap[cleanName]) cleanName = neetCodeMap[cleanName];

    const slug = cleanName.replace(/\s+/g, '-');
    if (metaMap.has(slug)) return metaMap.get(slug);

    const spaceName = cleanName.replace(/-/g, ' ');
    if (metaMap.has(spaceName)) return metaMap.get(spaceName);

    for (let [k, v] of metaMap) {
        if (k.includes(cleanName) || cleanName.includes(k)) return v;
    }

    return null;
};
