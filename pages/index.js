import React from 'react'

export default function Home() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
  const realtime = process.env.NEXT_PUBLIC_ENABLE_REALTIME

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Julin Real Estate Hub — Next.js</h1>
      <ul>
        <li>SUPABASE_URL: {url ? 'present' : 'missing'}</li>
        <li>SUPABASE_PROJECT_ID: {projectId ? 'present' : 'missing'}</li>
        <li>ENABLE_REALTIME: {realtime}</li>
      </ul>
    </main>
  )
}
