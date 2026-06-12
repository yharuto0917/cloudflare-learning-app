"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useProgress } from "../../hooks/use-progress";
import { findLesson } from "../../content/registry";

interface Question {
  question: string;
  options: string[];
  answer: number; // 0-indexed correct option index
  explanation: string;
}

interface QuizProps {
  questions: Question[];
}

export function Quiz({ questions = [] }: QuizProps) {
  const pathname = usePathname();
  const { markDone } = useProgress();
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [isAllCorrect, setIsAllCorrect] = useState(false);
  // 全問正解時の markDone は一度だけ。markDone は progress 依存で再生成されるため、
  // ref ガードを置かないと effect 再発火 → 再 markDone の無限ループになる。
  const markedRef = useRef(false);

  const lessonInfo = useMemo(() => {
    if (!pathname) return null;
    return findLesson(pathname);
  }, [pathname]);

  const handleSelect = (qIdx: number, oIdx: number) => {
    // 既に正解済みの設問は変更不可
    if (submitted[qIdx] && selected[qIdx] === questions[qIdx].answer) return;
    setSelected((prev) => ({ ...prev, [qIdx]: oIdx }));
    setSubmitted((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleRetry = () => {
    setSelected({});
    setSubmitted({});
    setIsAllCorrect(false);
    markedRef.current = false;
  };

  useEffect(() => {
    if (questions.length === 0) return;
    const allCorrect = questions.every((q, idx) => submitted[idx] && selected[idx] === q.answer);
    if (allCorrect && !markedRef.current) {
      markedRef.current = true;
      setIsAllCorrect(true);
      if (lessonInfo) {
        markDone(lessonInfo.module.id, lessonInfo.lessonIndex, true);
      }
    }
  }, [selected, submitted, questions, lessonInfo, markDone]);

  return (
    <div className="my-8 p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md">
      <div className="flex justify-between items-center mb-6 select-none">
        <h3 className="text-base font-bold text-neutral-200">Knowledge Check: クイズ</h3>
        {isAllCorrect && (
          <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            🎉 Completed
          </span>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const isAnswered = submitted[qIdx];
          const chosen = selected[qIdx];
          const isCorrect = chosen === q.answer;

          return (
            <div key={qIdx} className="space-y-3">
              <h4 className="text-sm font-medium text-neutral-300">
                {qIdx + 1}. {q.question}
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {q.options.map((opt, oIdx) => {
                  const isChosen = chosen === oIdx;
                  const isOptCorrect = q.answer === oIdx;

                  let btnStyle =
                    "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/30 text-neutral-300";
                  if (isAnswered) {
                    if (isChosen) {
                      btnStyle = isCorrect
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-medium"
                        : "border-rose-500/50 bg-rose-500/10 text-rose-400 font-medium";
                    } else if (isOptCorrect && !isCorrect) {
                      // 不正解時は正解の選択肢を控えめにハイライト
                      btnStyle = "border-emerald-500/30 bg-emerald-500/5 text-emerald-400/80";
                    } else {
                      btnStyle = "border-neutral-800 opacity-60 text-neutral-500";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isAnswered && isCorrect}
                      onClick={() => handleSelect(qIdx, oIdx)}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200 cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{opt}</span>
                        {isAnswered && isChosen && (
                          <span className="text-base select-none">{isCorrect ? "✅" : "❌"}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div
                  className={`p-4 rounded-lg border text-xs leading-relaxed transition-all ${
                    isCorrect
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300/90"
                      : "bg-rose-500/5 border-rose-500/20 text-rose-300/90"
                  }`}
                >
                  <p className="font-semibold mb-1 select-none">
                    {isCorrect ? "正解！" : "不正解..."}
                  </p>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAllCorrect && (
        <div className="mt-8 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-center space-y-3">
          <p className="text-sm font-semibold text-emerald-400">
            🎉 素晴らしい！全問正解したため、このレッスンは完了としてマークされました。
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 text-xs font-semibold rounded border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-300 transition-all cursor-pointer"
          >
            もう一度挑戦する
          </button>
        </div>
      )}
    </div>
  );
}
