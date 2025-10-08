'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      alert('Please enter your full name to start the quiz.')
      return
    }

    // For now, we’ll use a placeholder quizId until dynamic quizzes are added.
    const quizId = 'demo-quiz'
    const params = new URLSearchParams({ fullName, nickname })
    router.push(`/quiz/${quizId}?${params.toString()}`)
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-white">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Welcome to Quiz Companion 🧠</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-96 space-y-4 border border-gray-100"
      >
        <div>
          <label className="block text-gray-700 mb-2 font-semibold">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2 font-semibold">Nickname (optional)</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter a nickname"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Start Quiz
        </button>
      </form>
    </div>
  )
}
