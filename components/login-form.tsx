"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Dev-only check
    if (username.trim() === "admin" && password === "admin") {
      setError(null)
      router.push("/main")
      return
    }
    setError("Invalid credentials for development. Use admin / admin.")
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex flex-col gap-4">
      <div>
        <label htmlFor="username" className="sr-only">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          placeholder="USERNAME"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-md border-2 border-foreground/40 bg-transparent px-4 py-3 text-foreground placeholder:text-foreground/60 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border-2 border-foreground/40 bg-transparent px-4 py-3 text-foreground placeholder:text-foreground/60 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-2 w-full rounded-md border-2 border-foreground/40 bg-primary px-4 py-2 text-primary-foreground font-semibold uppercase tracking-wide hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Login
      </button>
    </form>
  )
}
