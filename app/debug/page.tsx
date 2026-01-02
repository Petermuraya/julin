"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Page() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
  const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API_URL ?? '';

  const [output, setOutput] = useState<string>('');
  const append = (s: string) => setOutput((o) => o + '\n' + s);

  const testGetProperties = async () => {
    append('Testing GET /functions/v1/get-properties...');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-properties`, {
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        method: 'GET',
      });
      append(`status: ${res.status}`);
      const text = await res.text();
      append(`body: ${text.slice(0, 1000)}`);
    } catch (err) {
      append(`error: ${String(err)}`);
    }
  };

  const testChatPost = async () => {
    append('Testing POST /functions/v1/chat with sample JSON...');
    try {
      const body = { message: 'Hello test', session_id: 'debug', conversation_id: 'debug' };
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });
      append(`status: ${res.status}`);
      const text = await res.text();
      append(`body: ${text.slice(0, 2000)}`);
    } catch (err) {
      append(`error: ${String(err)}`);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug — Supabase Config & Endpoints</h1>
      <div className="mb-4">
        <div><strong>VITE_SUPABASE_URL:</strong> {SUPABASE_URL || <em className="text-red-500">(not set)</em>}</div>
        <div><strong>VITE_SUPABASE_PUBLISHABLE_KEY:</strong> {SUPABASE_PUBLISHABLE_KEY ? `${String(SUPABASE_PUBLISHABLE_KEY).slice(0,12)}...` : <em className="text-red-500">(not set)</em>}</div>
        <div><strong>VITE_SERVER_API_URL:</strong> {SERVER_API || <em className="text-yellow-600">(not set)</em>}</div>
      </div>

      <div className="flex gap-3 mb-4">
        <Button onClick={testGetProperties}>Test get-properties</Button>
        <Button onClick={testChatPost}>Test chat POST</Button>
      </div>

      <pre className="whitespace-pre-wrap bg-slate-50 p-3 rounded border h-64 overflow-auto">
        {output || 'No output yet. Click a test button.'}
      </pre>
    </div>
  );
}
