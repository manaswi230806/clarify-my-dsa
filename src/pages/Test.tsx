import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Mic, MicOff, ChevronRight } from "lucide-react";

interface Question {
  id: number;
  question: string;
  code?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  misconception?: string;
}

interface Answer {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
  timeSpent: number;
  explanation: string;
}

export default function Test() {
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic") || "arrays";
  const testType = searchParams.get("type") || "diagnostic";
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [userExplanation, setUserExplanation] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const questionStartRef = useRef(Date.now());
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    generateQuestions();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const generateQuestions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { topic, testType, count: 5 },
      });
      if (error) throw error;
      setQuestions(data.questions || []);
    } catch (err) {
      toast.error("Failed to generate questions. Using fallback.");
      setQuestions(getFallbackQuestions(topic));
    } finally {
      setLoading(false);
      questionStartRef.current = Date.now();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) { toast.error("Speech recognition not supported in this browser"); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setUserExplanation(transcript);
    };
    recognition.onerror = () => { setIsRecording(false); toast.error("Speech recognition error"); };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleNext = useCallback(() => {
    if (selectedOption === null) { toast.error("Please select an answer"); return; }
    const question = questions[currentIndex];
    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
    const answer: Answer = {
      questionId: question.id,
      selectedOption,
      isCorrect: selectedOption === question.correctAnswer,
      timeSpent,
      explanation: userExplanation,
    };
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setUserExplanation("");
      questionStartRef.current = Date.now();
    } else {
      submitTest(newAnswers);
    }
  }, [selectedOption, currentIndex, questions, answers, userExplanation]);

  const submitTest = async (finalAnswers: Answer[]) => {
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
      const score = Math.round((correctCount / questions.length) * 100);

      // Save test session
      await supabase.from("test_sessions").insert({
        user_id: user.id,
        topic,
        test_type: testType,
        score,
        correct_count: correctCount,
        total_questions: questions.length,
        time_spent_seconds: timer,
        passed: score >= 100,
      });

      // Update topic progress
      const { data: existing } = await supabase
        .from("topic_progress")
        .select("best_score, tests_taken, status")
        .eq("user_id", user.id)
        .eq("topic", topic)
        .single();

      const newBestScore = Math.max(score, existing?.best_score || 0);
      const newTestsTaken = (existing?.tests_taken || 0) + 1;

      await supabase
        .from("topic_progress")
        .update({
          best_score: newBestScore,
          progress: newBestScore,
          tests_taken: newTestsTaken,
          status: newBestScore >= 100 ? "completed" : "in_progress",
          completed_at: newBestScore >= 100 ? new Date().toISOString() : null,
        })
        .eq("user_id", user.id)
        .eq("topic", topic);

      // Navigate to analysis
      navigate("/analysis", {
        state: {
          questions,
          answers: finalAnswers,
          score,
          topic,
          testType,
          timeSpent: timer,
          correctCount,
          totalQuestions: questions.length,
        },
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit test");
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Generating questions for {topic}...</p>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Analyzing your responses...</p>
      </div>
    );
  }

  const question = questions[currentIndex];
  if (!question) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-20">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground capitalize">{topic}</span>
            <span className="text-sm text-muted-foreground mx-2">•</span>
            <span className="text-sm text-muted-foreground capitalize">{testType} Test</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Question {currentIndex + 1}/{questions.length}</span>
            <div className="flex items-center gap-1 text-sm font-mono">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {formatTime(timer)}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Progress */}
        <div className="w-full h-2 rounded-full bg-muted mb-8">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
          {question.code && (
            <pre className="code-block overflow-x-auto mb-6 whitespace-pre-wrap">{question.code}</pre>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => setSelectedOption(i)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedOption === i
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
                  selectedOption === i ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                }`}>
                  {selectedOption === i && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
                <span className="text-sm">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Voice explanation */}
        <div className="mb-8">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Explain your reasoning (optional - voice or text)</label>
          <div className="relative">
            <textarea
              value={userExplanation}
              onChange={(e) => setUserExplanation(e.target.value)}
              placeholder="Why did you choose this answer?"
              className="w-full min-h-[80px] p-4 pr-12 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
            />
            <button
              onClick={toggleRecording}
              className={`absolute right-3 top-3 p-2 rounded-lg transition-colors ${
                isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          {currentIndex < questions.length - 1 ? "Next Question" : "Submit Test"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function getFallbackQuestions(topic: string): Question[] {
  const fallbacks: Record<string, Question[]> = {
    arrays: [
      { id: 1, question: "What is the time complexity of accessing an element in an array by index?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: 0, explanation: "Array access by index is O(1) because arrays use contiguous memory.", misconception: "confusing-access-search" },
      { id: 2, question: "What does this code output?\n\nint[] arr = {1, 2, 3, 4, 5};\nSystem.out.println(arr[2]);", code: "int[] arr = {1, 2, 3, 4, 5};\nSystem.out.println(arr[2]);", options: ["1", "2", "3", "4"], correctAnswer: 2, explanation: "Arrays are 0-indexed, so arr[2] is the third element: 3.", misconception: "off-by-one" },
      { id: 3, question: "What happens when you try to access arr[5] in an array of size 5?", options: ["Returns 0", "Returns null", "ArrayIndexOutOfBoundsException", "Undefined behavior"], correctAnswer: 2, explanation: "Java arrays throw ArrayIndexOutOfBoundsException for out-of-bounds access.", misconception: "bounds-checking" },
      { id: 4, question: "What is the space complexity of creating an array of n elements?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: 1, explanation: "An array of n elements requires O(n) space.", misconception: "space-complexity" },
      { id: 5, question: "Which operation is most expensive for an unsorted array?", options: ["Access by index", "Insertion at end", "Search for a value", "Getting the length"], correctAnswer: 2, explanation: "Searching in an unsorted array requires O(n) linear scan.", misconception: "search-complexity" },
    ],
    strings: [
      { id: 1, question: "What does \"hello\".charAt(1) return in Java?", options: ["'h'", "'e'", "'l'", "'o'"], correctAnswer: 1, explanation: "Strings are 0-indexed, so charAt(1) returns 'e'.", misconception: "string-indexing" },
      { id: 2, question: "Are strings mutable in Java?", options: ["Yes", "No", "Only when using StringBuilder", "Depends on JVM"], correctAnswer: 1, explanation: "Strings in Java are immutable. StringBuilder is mutable.", misconception: "string-mutability" },
      { id: 3, question: "What is the time complexity of string concatenation using + in a loop?", options: ["O(n)", "O(n²)", "O(1)", "O(log n)"], correctAnswer: 1, explanation: "Each concatenation creates a new string, making it O(n²) in a loop.", misconception: "concat-complexity" },
      { id: 4, question: "What does \"abc\".substring(1, 2) return?", options: ["\"ab\"", "\"b\"", "\"bc\"", "\"a\""], correctAnswer: 1, explanation: "substring(1, 2) extracts from index 1 (inclusive) to 2 (exclusive).", misconception: "substring-bounds" },
      { id: 5, question: "How do you compare two strings for equality in Java?", options: ["str1 == str2", "str1.equals(str2)", "str1.compareTo(str2)", "str1 === str2"], correctAnswer: 1, explanation: "Use .equals() for content comparison. == checks reference equality.", misconception: "string-comparison" },
    ],
    "linked-lists": [
      { id: 1, question: "What is the time complexity of inserting at the head of a singly linked list?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: 0, explanation: "Inserting at head is O(1) - just update the head pointer.", misconception: "insertion-complexity" },
      { id: 2, question: "What is the main advantage of a linked list over an array?", options: ["Faster access by index", "Dynamic size", "Less memory usage", "Better cache performance"], correctAnswer: 1, explanation: "Linked lists can grow/shrink dynamically without reallocation.", misconception: "ll-vs-array" },
      { id: 3, question: "How do you detect a cycle in a linked list?", options: ["Check each node against all previous", "Use Floyd's algorithm", "Sort the list first", "Count the nodes"], correctAnswer: 1, explanation: "Floyd's slow/fast pointer algorithm detects cycles in O(n) time, O(1) space.", misconception: "cycle-detection" },
      { id: 4, question: "What is the time complexity of accessing the nth element in a singly linked list?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correctAnswer: 1, explanation: "Must traverse from head to the nth node: O(n).", misconception: "access-complexity" },
      { id: 5, question: "What happens if you lose the reference to the head of a linked list?", options: ["Nothing", "Memory leak", "List reverses", "Runtime error"], correctAnswer: 1, explanation: "Without the head reference, all nodes become unreachable (memory leak).", misconception: "pointer-management" },
    ],
  };
  return fallbacks[topic] || fallbacks.arrays;
}
