import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface TwinContext {
  profile?: {
    age?: number;
    occupation?: string;
    occupation_type?: string;
    city?: string;
    state?: string;
    education_level?: string;
    marital_status?: string;
    dependents_count?: number;
    risk_appetite?: string;
    monthly_income?: number;
  } | null;
  totalAssets?: number;
  totalLiabilities?: number;
  totalMonthlyIncome?: number;
  totalMonthlyExpenses?: number;
  totalMonthlyEMI?: number;
  monthlyCashFlow?: number;
  netWorth?: number;
  savingsRate?: number;
  incomeSources?: Array<{ source: string; amount: number; frequency: string }>;
  expenses?: Array<{ category: string; amount: number; frequency: string }>;
  assets?: Array<{ name: string; asset_type: string; current_value: number }>;
  liabilities?: Array<{ name: string; liability_type: string; outstanding_amount: number; emi_amount?: number; interest_rate?: number }>;
  goals?: Array<{ title: string; target_amount: number; current_savings: number; status: string; priority: string }>;
}

function buildSystemPrompt(twinContext?: TwinContext | null): string {
  let prompt = `You are Arthsaathi AI (अर्थसाथी) — India's premier intelligent personal financial copilot.
Your purpose is to provide clear, actionable, prudent, and compassionate financial guidance to Indian citizens, families, and professionals.

Core Guidelines:
1. Currency & Formats: Always format currency in Indian Rupees using the '₹' symbol and the Indian numbering system (e.g. ₹1,50,000, ₹12.5 Lakhs, ₹1.2 Crores).
2. Domain Expertise: You understand Indian tax regimes (Old vs New under Sec 115BAC), tax deductions (80C, 80D, 80CCD, etc.), Reserve Bank of India (RBI) interest rate dynamics, Mutual Funds (SIP, ELSS, Index, Debt), EPF/PPF/VPF, NPS, Sovereign Gold Bonds (SGB), and debt management strategies (Avalanche vs Snowball).
3. Tone & Style: Warm, professional, objective, and deeply encouraging. Use structured markdown formatting with bolding, lists, and clear headers to make numbers digestible.
4. Scam & Risk Vigilance: If the user asks about unsolicited schemes, high-return guarantees, MLM, or suspicious apps, proactively warn them about financial scams and urge verification via SEBI/RBI/IRDAI.
`;

  if (twinContext) {
    prompt += `\n--- USER'S LIVE FINANCIAL TWIN SNAPSHOT ---\n`;

    if (twinContext.profile) {
      const p = twinContext.profile;
      prompt += `Demographics: Age ${p.age || "N/A"}, Occupation: ${p.occupation || "N/A"} (${p.occupation_type || "N/A"}), Location: ${p.city || "N/A"}, ${p.state || "N/A"}. Marital Status: ${p.marital_status || "N/A"}, Dependents: ${p.dependents_count ?? "N/A"}. Risk Appetite: ${p.risk_appetite || "MODERATE"}.\n`;
    }

    if (twinContext.netWorth !== undefined) {
      prompt += `Financial Overview:
- Total Assets: ₹${(twinContext.totalAssets || 0).toLocaleString("en-IN")}
- Total Liabilities: ₹${(twinContext.totalLiabilities || 0).toLocaleString("en-IN")}
- Estimated Net Worth: ₹${(twinContext.netWorth || 0).toLocaleString("en-IN")}
- Monthly Income: ₹${(twinContext.totalMonthlyIncome || 0).toLocaleString("en-IN")}/month
- Monthly Expenses: ₹${(twinContext.totalMonthlyExpenses || 0).toLocaleString("en-IN")}/month
- Monthly Loan EMIs: ₹${(twinContext.totalMonthlyEMI || 0).toLocaleString("en-IN")}/month
- Net Monthly Cashflow / Surplus: ₹${(twinContext.monthlyCashFlow || 0).toLocaleString("en-IN")}/month
- Savings Rate: ${(twinContext.savingsRate || 0).toFixed(1)}%\n`;
    }

    if (twinContext.incomeSources && twinContext.incomeSources.length > 0) {
      prompt += `Income Streams: ` + twinContext.incomeSources.map(i => `${i.source} (₹${Number(i.amount).toLocaleString("en-IN")} ${i.frequency})`).join(", ") + `\n`;
    }

    if (twinContext.expenses && twinContext.expenses.length > 0) {
      prompt += `Top Expenses: ` + twinContext.expenses.map(e => `${e.category} (₹${Number(e.amount).toLocaleString("en-IN")} ${e.frequency})`).join(", ") + `\n`;
    }

    if (twinContext.assets && twinContext.assets.length > 0) {
      prompt += `Assets: ` + twinContext.assets.map(a => `${a.name} (${a.asset_type}: ₹${Number(a.current_value).toLocaleString("en-IN")})`).join(", ") + `\n`;
    }

    if (twinContext.liabilities && twinContext.liabilities.length > 0) {
      prompt += `Liabilities & Loans: ` + twinContext.liabilities.map(l => `${l.name} (${l.liability_type}: ₹${Number(l.outstanding_amount).toLocaleString("en-IN")} outstanding, ₹${Number(l.emi_amount || 0).toLocaleString("en-IN")}/mo EMI, ${l.interest_rate || "N/A"}% interest)`).join(", ") + `\n`;
    }

    if (twinContext.goals && twinContext.goals.length > 0) {
      prompt += `Active Financial Goals: ` + twinContext.goals.map(g => `${g.title} (Target: ₹${Number(g.target_amount).toLocaleString("en-IN")}, Saved: ₹${Number(g.current_savings).toLocaleString("en-IN")}, Status: ${g.status}, Priority: ${g.priority})`).join(", ") + `\n`;
    }

    prompt += `--- END SNAPSHOT ---
Please reference these exact figures whenever giving advice so your calculations, emergency fund evaluations, debt advice, and investment suggestions are custom-tailored to their specific situation.`;
  }

  return prompt;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, twinContext, apiKey, model } = body as {
      messages: ChatMessage[];
      twinContext?: TwinContext;
      apiKey?: string;
      model?: string;
    };

    const effectiveApiKey = apiKey || process.env.OPENROUTER_API_KEY;

    if (!effectiveApiKey) {
      return NextResponse.json(
        {
          error: "OpenRouter API Key is missing. Please configure it in the Chat Settings or in your .env.local file as OPENROUTER_API_KEY.",
        },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    let selectedModel = (model || "").trim() || "meta-llama/llama-3.3-70b-instruct";
    if (selectedModel === "meta-llama/llama-3.3-70b-instruct:free") {
      selectedModel = "meta-llama/llama-3.3-70b-instruct";
    }
    const systemPrompt = buildSystemPrompt(twinContext);

    const makePayload = (m: string) => ({
      model: m,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      stream: true,
    });

    let openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${effectiveApiKey.trim()}`,
        "HTTP-Referer": req.headers.get("origin") || "http://localhost:3000",
        "X-Title": "Arthsaathi AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(makePayload(selectedModel)),
    });

    // If 404 and model ends with :free, auto-retry with standard slug
    if (openRouterResponse.status === 404 && selectedModel.endsWith(":free")) {
      const fallbackModel = selectedModel.replace(/:free$/, "");
      const retryResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${effectiveApiKey.trim()}`,
          "HTTP-Referer": req.headers.get("origin") || "http://localhost:3000",
          "X-Title": "Arthsaathi AI",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(makePayload(fallbackModel)),
      });
      if (retryResponse.ok) {
        openRouterResponse = retryResponse;
      }
    }

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      let parsedError = errorText;
      try {
        const jsonErr = JSON.parse(errorText);
        parsedError = jsonErr.error?.message || jsonErr.message || errorText;
      } catch {}

      return NextResponse.json(
        { error: `OpenRouter error (${openRouterResponse.status}): ${parsedError}` },
        { status: openRouterResponse.status }
      );
    }

    if (!openRouterResponse.body) {
      return NextResponse.json({ error: "Empty stream from OpenRouter." }, { status: 500 });
    }

    // Set up a TransformStream to parse SSE data: chunks from OpenRouter and emit raw token text
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = "";

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed === "data: [DONE]") {
            return;
          }

          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const text = data.choices?.[0]?.delta?.content || "";
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            } catch {
              // Ignore partial JSON parsing errors
            }
          }
        }
      },
      flush(controller) {
        if (buffer.trim().startsWith("data: ") && buffer.trim() !== "data: [DONE]") {
          try {
            const data = JSON.parse(buffer.trim().slice(6));
            const text = data.choices?.[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          } catch {}
        }
      },
    });

    return new Response(openRouterResponse.body.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred while communicating with OpenRouter." },
      { status: 500 }
    );
  }
}
