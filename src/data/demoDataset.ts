export interface DemoDoubtItem {
  id: string;
  text: string;
  hiddenCategory:
    | 'definition_rules'
    | 'search_operation'
    | 'insertion'
    | 'deletion'
    | 'complexity_height'
    | 'traversal'
    | 'balancing_degeneration';
}

export const DEMO_LESSON_INFO = {
  subject: 'Data Structures',
  lessonTitle: 'Binary Search Trees',
  description:
    'Exploring BST structure, search/insert/delete operations, traversal strategies, time complexity, and the problem of tree degeneration.',
};

export const DEMO_DOUBTS_DATASET: DemoDoubtItem[] = [
  // 1. Definition & rules (7 items)
  {
    id: 'd-001',
    text: "What's the actual rule that makes something a BST? Like I know it's a tree but what makes it a *search* tree?",
    hiddenCategory: 'definition_rules',
  },
  {
    id: 'd-002',
    text: 'Does every node have to be smaller than everything on the right or just its immediate right child?',
    hiddenCategory: 'definition_rules',
  },
  {
    id: 'd-003',
    text: "What's the difference between a binary tree and a binary search tree? They look the same to me",
    hiddenCategory: 'definition_rules',
  },
  {
    id: 'd-004',
    text: 'Can a BST have duplicate values? What happens if you try to insert a key that already exists?',
    hiddenCategory: 'definition_rules',
  },
  {
    id: 'd-005',
    text: 'so the left subtree has to have ALL values less than root, not just the direct children?',
    hiddenCategory: 'definition_rules',
  },
  {
    id: 'd-006',
    text: 'Is a single node by itself considered a valid BST?',
    hiddenCategory: 'definition_rules',
  },
  {
    id: 'd-007',
    text: 'Can the values in a BST be strings or only numbers? How does comparison work with strings?',
    hiddenCategory: 'definition_rules',
  },

  // 2. Search operation (6 items)
  {
    id: 'd-008',
    text: 'When we search for a value, how do we know whether to go left or right at each node?',
    hiddenCategory: 'search_operation',
  },
  {
    id: 'd-009',
    text: "I don't get how search is faster than just scanning all nodes. Can you walk through a concrete example?",
    hiddenCategory: 'search_operation',
  },
  {
    id: 'd-010',
    text: "What happens when the value we're looking for isn't in the tree at all?",
    hiddenCategory: 'search_operation',
  },
  {
    id: 'd-011',
    text: 'Is BST search always O(log n)? Or does it depend on something else?',
    hiddenCategory: 'search_operation',
  },
  {
    id: 'd-012',
    text: 'How many comparisons does search take in the worst case? When does that happen?',
    hiddenCategory: 'search_operation',
  },
  {
    id: 'd-013',
    text: "searching seems like binary search on an array - what's the point of the tree structure then?",
    hiddenCategory: 'search_operation',
  },

  // 3. Insertion (5 items)
  {
    id: 'd-014',
    text: 'when you insert a new node where exactly does it go? does it always end up as a leaf?',
    hiddenCategory: 'insertion',
  },
  {
    id: 'd-015',
    text: 'if I insert 5, 3, 7, 1, 4 in that order, what does the tree look like? can you draw it out?',
    hiddenCategory: 'insertion',
  },
  {
    id: 'd-016',
    text: 'Does the order you insert values change the shape of the BST?',
    hiddenCategory: 'insertion',
  },
  {
    id: 'd-017',
    text: 'How is insertion different from search? It seems like you do the same comparison steps?',
    hiddenCategory: 'insertion',
  },
  {
    id: 'd-018',
    text: 'what is the time complexity of inserting n elements one by one into an empty BST?',
    hiddenCategory: 'insertion',
  },

  // 4. Deletion (8 items) — the "hard" case, natural overlap expected
  {
    id: 'd-019',
    text: 'why is deleting a node from a BST so complicated? insertion seemed simple but deletion has like 3 cases',
    hiddenCategory: 'deletion',
  },
  {
    id: 'd-020',
    text: "What's the in-order successor and why do we need it when deleting a node with two children?",
    hiddenCategory: 'deletion',
  },
  {
    id: 'd-021',
    text: "I don't understand the 3 cases for deletion. Can you list them again slowly?",
    hiddenCategory: 'deletion',
  },
  {
    id: 'd-022',
    text: 'when deleting a node that has two children, why do we replace it with the in-order successor instead of just removing it?',
    hiddenCategory: 'deletion',
  },
  {
    id: 'd-023',
    text: 'Can we use the in-order predecessor instead of in-order successor when deleting? Does it matter which one?',
    hiddenCategory: 'deletion',
  },
  {
    id: 'd-024',
    text: 'after we delete a node, does the BST property still hold automatically or do we have to fix something?',
    hiddenCategory: 'deletion',
  },
  {
    id: 'd-025',
    text: 'What does it mean for a node to have one child vs two children in the context of deletion?',
    hiddenCategory: 'deletion',
  },
  {
    id: 'd-026',
    text: 'so deletion is O(h) like search? but finding the in-order successor also takes time right, does that change things?',
    hiddenCategory: 'deletion',
  },

  // 5. Time complexity and height (5 items)
  {
    id: 'd-027',
    text: 'why is BST performance O(h) and not O(n) or O(log n)? what exactly is h?',
    hiddenCategory: 'complexity_height',
  },
  {
    id: 'd-028',
    text: 'in the worst case a BST degenerates into a linked list right? so worst case is O(n)?',
    hiddenCategory: 'complexity_height',
  },
  {
    id: 'd-029',
    text: 'how does height relate to the number of nodes? is there a formula?',
    hiddenCategory: 'complexity_height',
  },
  {
    id: 'd-030',
    text: 'If a BST has n nodes, what is the minimum and maximum possible height?',
    hiddenCategory: 'complexity_height',
  },
  {
    id: 'd-031',
    text: "why does inserting already-sorted data make BST basically useless performance-wise? doesn't it just go to the right every time?",
    hiddenCategory: 'complexity_height',
  },

  // 6. Traversal (5 items)
  {
    id: 'd-032',
    text: 'what is in-order traversal and why does it output elements in sorted order?',
    hiddenCategory: 'traversal',
  },
  {
    id: 'd-033',
    text: "I'm confused about pre-order vs in-order vs post-order. When would you actually use each one?",
    hiddenCategory: 'traversal',
  },
  {
    id: 'd-034',
    text: 'does in-order traversal work recursively? how many recursive calls does it make for n nodes?',
    hiddenCategory: 'traversal',
  },
  {
    id: 'd-035',
    text: 'can you traverse a BST without recursion? how would you do it with a stack?',
    hiddenCategory: 'traversal',
  },
  {
    id: 'd-036',
    text: 'if I do in-order traversal on a BST, do I get elements sorted ascending or descending?',
    hiddenCategory: 'traversal',
  },

  // 7. Balancing and degeneration (6 items)
  {
    id: 'd-037',
    text: "what is a balanced BST and why does it matter? what's wrong with an unbalanced one?",
    hiddenCategory: 'balancing_degeneration',
  },
  {
    id: 'd-038',
    text: 'how does an AVL tree fix the problems with a regular BST?',
    hiddenCategory: 'balancing_degeneration',
  },
  {
    id: 'd-039',
    text: 'if I insert 1 2 3 4 5 into a BST in that order it just becomes a straight line to the right right? is that still called a BST?',
    hiddenCategory: 'balancing_degeneration',
  },
  {
    id: 'd-040',
    text: 'what are rotations in a self-balancing tree? why do you have to rotate and not just rebuild?',
    hiddenCategory: 'balancing_degeneration',
  },
  {
    id: 'd-041',
    text: 'is a red-black tree the same as an AVL tree? how do I know which balanced BST to use?',
    hiddenCategory: 'balancing_degeneration',
  },
  {
    id: 'd-042',
    text: 'so in the worst case a BST is just a sorted linked list with extra memory overhead? why would anyone use it over a simple array then?',
    hiddenCategory: 'balancing_degeneration',
  },
];
