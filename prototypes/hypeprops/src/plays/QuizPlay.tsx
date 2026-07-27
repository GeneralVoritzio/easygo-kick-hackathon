import { useState } from 'react'
import { QUIZ, usePlays } from './playsStore'
import type { QuizGrade } from './settle'

const TIER_STYLE: Record<QuizGrade['tier'], string> = {
  gold: 'border-yellow-400/40 bg-yellow-400/15 text-yellow-300',
  silver: 'border-slate-300/40 bg-slate-300/15 text-slate-200',
  flair: 'border-kick/40 bg-kick/15 text-kick',
}
const TIER_ICON: Record<QuizGrade['tier'], string> = { gold: '🥇', silver: '🥈', flair: '✨' }

export default function QuizPlay() {
  const play = usePlays((s) => s.play)!
  const grades = usePlays((s) => s.grades)
  const submitQuiz = usePlays((s) => s.submitQuiz)
  const youEntered = usePlays((s) => s.youEntered)
  const [answers, setAnswers] = useState(['', '', '', ''])

  if (play.phase !== 'collecting') {
    return (
      <div>
        <div className="mb-2 font-mono text-[11px] text-kick-muted">
          key revealed: <span className="text-kick-text">{QUIZ.key.join(' · ')}</span>
        </div>
        <div className="space-y-1">
          {grades.map((g) => (
            <div key={g.userId} className="flex items-center justify-between rounded bg-white/5 px-2 py-1 text-[12px]">
              <span className="text-kick-text">{g.username}</span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-kick-muted">
                  {g.correct}/{g.total}
                </span>
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${TIER_STYLE[g.tier]}`}>
                  {TIER_ICON[g.tier]} {g.tier}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (youEntered) {
    return (
      <div className="rounded bg-kick/10 px-2.5 py-2 text-[12px] font-semibold text-kick">
        Answers submitted ✓ — waiting on the reveal
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {QUIZ.questions.map((q, i) => (
        <div key={q}>
          <label className="block text-[11px] leading-snug text-kick-muted">{q}</label>
          <input
            value={answers[i]}
            onChange={(e) => setAnswers((a) => a.map((v, idx) => (idx === i ? e.target.value : v)))}
            className="mt-0.5 w-full rounded border border-kick-border bg-black/40 px-2 py-1 text-[12px] text-kick-text outline-none focus:border-kick"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => submitQuiz(answers)}
        className="mt-1 rounded bg-kick px-3 py-1.5 text-[12px] font-bold text-black transition-colors hover:bg-kick-dim"
      >
        Submit answers
      </button>
    </div>
  )
}
