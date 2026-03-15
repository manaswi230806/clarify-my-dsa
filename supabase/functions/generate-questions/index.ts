import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topic, testType, count } = await req.json();

    const topicQuestions: Record<string, any[]> = {
      arrays: [
        { id: 1, question: "What is the time complexity of accessing an element in an array by index?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: 0, explanation: "Array access by index is O(1) because arrays use contiguous memory with direct address calculation.", misconception: "confusing-access-search" },
        { id: 2, question: "What does this code output?\n\nint[] arr = {1, 2, 3, 4, 5};\nSystem.out.println(arr[2]);", code: "int[] arr = {1, 2, 3, 4, 5};\nSystem.out.println(arr[2]);", options: ["1", "2", "3", "4"], correctAnswer: 2, explanation: "Arrays are 0-indexed, so arr[2] is the third element which is 3.", misconception: "off-by-one" },
        { id: 3, question: "What happens when you try to access arr[5] in an array of size 5?", options: ["Returns 0", "Returns null", "ArrayIndexOutOfBoundsException", "Undefined behavior"], correctAnswer: 2, explanation: "Valid indices are 0-4. Accessing index 5 throws ArrayIndexOutOfBoundsException in Java.", misconception: "bounds-checking" },
        { id: 4, question: "What is the space complexity of creating an array of n elements?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: 1, explanation: "An array of n elements requires O(n) contiguous memory space.", misconception: "space-complexity" },
        { id: 5, question: "Which operation is most expensive for an unsorted array?", options: ["Access by index", "Insertion at end", "Search for a value", "Getting the length"], correctAnswer: 2, explanation: "Searching in an unsorted array requires O(n) linear scan since elements have no ordering.", misconception: "search-complexity" },
        { id: 6, question: "What is the time complexity of inserting an element at the beginning of an array?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: 1, explanation: "Inserting at the beginning requires shifting all existing elements one position right: O(n).", misconception: "insertion-complexity" },
        { id: 7, question: "What does arr.length return for int[] arr = new int[10]?", options: ["0", "10", "9", "Depends on elements stored"], correctAnswer: 1, explanation: "arr.length returns the allocated size (10), regardless of how many elements have been assigned.", misconception: "length-vs-count" },
      ],
      strings: [
        { id: 1, question: "What does \"hello\".charAt(1) return in Java?", options: ["'h'", "'e'", "'l'", "'o'"], correctAnswer: 1, explanation: "Strings are 0-indexed, so charAt(1) returns 'e', the second character.", misconception: "string-indexing" },
        { id: 2, question: "Are strings mutable in Java?", options: ["Yes", "No", "Only when using StringBuilder", "Depends on JVM version"], correctAnswer: 1, explanation: "Strings in Java are immutable. Once created, their value cannot be changed.", misconception: "string-mutability" },
        { id: 3, question: "What is the time complexity of string concatenation using + in a loop of n iterations?", options: ["O(n)", "O(n²)", "O(1)", "O(log n)"], correctAnswer: 1, explanation: "Each + creates a new String object and copies characters, making it O(n²) total.", misconception: "concat-complexity" },
        { id: 4, question: "What does \"abc\".substring(1, 2) return?", options: ["\"ab\"", "\"b\"", "\"bc\"", "\"a\""], correctAnswer: 1, explanation: "substring(1, 2) extracts from index 1 (inclusive) to 2 (exclusive), returning \"b\".", misconception: "substring-bounds" },
        { id: 5, question: "How should you compare two strings for content equality in Java?", options: ["str1 == str2", "str1.equals(str2)", "str1.compareTo(str2) == 1", "str1 === str2"], correctAnswer: 1, explanation: "Use .equals() for content comparison. == checks reference equality (same object in memory).", misconception: "string-comparison" },
        { id: 6, question: "What does \"Hello World\".indexOf('o') return?", options: ["4", "5", "7", "-1"], correctAnswer: 0, explanation: "indexOf returns the first occurrence. 'o' first appears at index 4 in \"Hello World\".", misconception: "indexOf-behavior" },
        { id: 7, question: "What is the output of \"abc\" + 1 + 2 in Java?", options: ["\"abc12\"", "\"abc3\"", "6", "Compilation error"], correctAnswer: 0, explanation: "String concatenation is left-to-right: \"abc\" + 1 = \"abc1\", then + 2 = \"abc12\".", misconception: "string-concat-order" },
      ],
      "linked-lists": [
        { id: 1, question: "What is the time complexity of inserting at the head of a singly linked list?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: 0, explanation: "Inserting at head is O(1): create node, point to current head, update head pointer.", misconception: "insertion-complexity" },
        { id: 2, question: "What is the main advantage of a linked list over an array?", options: ["Faster access by index", "Dynamic size without reallocation", "Less memory usage per element", "Better CPU cache performance"], correctAnswer: 1, explanation: "Linked lists can grow/shrink dynamically without needing to reallocate/copy the entire structure.", misconception: "ll-vs-array" },
        { id: 3, question: "Which algorithm detects a cycle in a linked list in O(1) space?", options: ["BFS traversal", "Floyd's tortoise and hare", "Hash set approach", "Stack-based DFS"], correctAnswer: 1, explanation: "Floyd's algorithm uses two pointers (slow/fast) to detect cycles in O(n) time, O(1) space.", misconception: "cycle-detection" },
        { id: 4, question: "What is the time complexity of accessing the nth element in a singly linked list?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: 1, explanation: "Must traverse from head through n nodes sequentially: O(n). No random access.", misconception: "access-complexity" },
        { id: 5, question: "What happens if you lose the reference to the head of a linked list in Java?", options: ["Nothing, nodes persist", "Memory leak / garbage collected", "List reverses itself", "NullPointerException"], correctAnswer: 1, explanation: "Without any reference to head, all nodes become unreachable and eligible for garbage collection.", misconception: "pointer-management" },
        { id: 6, question: "How do you reverse a singly linked list in-place?", options: ["Swap first and last elements repeatedly", "Use three pointers: prev, curr, next", "Copy to array and reverse", "Use recursion only"], correctAnswer: 1, explanation: "The iterative approach uses prev, curr, next pointers to reverse links one by one in O(n) time.", misconception: "reversal-technique" },
      ],
    };

    const available = topicQuestions[topic] || topicQuestions.arrays;
    // Shuffle and pick `count` questions
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count || 5);

    return new Response(JSON.stringify({ questions: selected }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
