import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Optionally, import OpenAI SDK if you use it directly
// import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { message, business_unit_id, user_id } = await req.json();
    if (!message || !business_unit_id) {
      return NextResponse.json({ error: 'Missing message or business_unit_id' }, { status: 400 });
    }

    // Fetch business unit context
    const { data: buData, error: buError } = await supabase
      .from('master_business_units')
      .select('*')
      .eq('id', business_unit_id)
      .single();
    if (buError) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 });
    }

    // --- Simple keyword-based intent detection ---
    const lowerMsg = message.toLowerCase();
    // Employees
    if (/(cu[aá]nt[oa]s?|how many|number of)\s+(emplead[oa]s?|employees?)/.test(lowerMsg)) {
      // Example: count users in staff directory for this BU
      const { count, error } = await supabase
        .from('staff_directory')
        .select('*', { count: 'exact', head: true })
        .eq('business_unit_id', business_unit_id);
      if (error) {
        return NextResponse.json({ reply: 'Error fetching employee count.' });
      }
      return NextResponse.json({ reply: `There are ${count ?? 0} employees in this business unit.` });
    }
    // Closed events
    if (/(closed events?|eventos cerrados?)/.test(lowerMsg)) {
      const { count, error } = await supabase
        .from('closed_events')
        .select('*', { count: 'exact', head: true })
        .eq('business_unit_id', business_unit_id);
      if (error) {
        return NextResponse.json({ reply: 'Error fetching closed events count.' });
      }
      return NextResponse.json({ reply: `There are ${count ?? 0} closed events in this business unit.` });
    }
    // Gratuity report
    if (/(gratuity report|reporte de gratificaciones?)/.test(lowerMsg)) {
      const { count, error } = await supabase
        .from('gratuity_report')
        .select('*', { count: 'exact', head: true })
        .eq('business_unit_id', business_unit_id);
      if (error) {
        return NextResponse.json({ reply: 'Error fetching gratuity report count.' });
      }
      return NextResponse.json({ reply: `There are ${count ?? 0} gratuity report records in this business unit.` });
    }

    // --- Default: Use OpenAI ---
    const context = `You are KLIMROD AI, a financial assistant for the business unit: ${buData.name}. Answer in English. Only answer questions relevant to this business unit.`;

    if (!openaiApiKey) {
      console.error("[chat-ai] OPENAI_API_KEY is not set");
      return NextResponse.json({ error: 'OpenAI API key not set on server' }, { status: 500 });
    }
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: message },
        ],
        max_tokens: 512,
        temperature: 0.2,
      }),
    });
    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error('[chat-ai] OpenAI API error:', openaiRes.status, errorText);
      return NextResponse.json({ error: 'OpenAI API error', details: errorText }, { status: 500 });
    }
    const openaiData = await openaiRes.json();
    const reply = openaiData.choices?.[0]?.message?.content || 'No response from AI.';
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
