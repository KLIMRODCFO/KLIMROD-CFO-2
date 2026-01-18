
import { NextResponse } from "next/server";
import getOpenAIClient from "../../../../lib/openaiClient";

export async function POST(req: Request) {
  try {
    const { base64Images, base64Image } = await req.json();
    console.log("[extract-invoice-ai] POST endpoint hit");
    const images = base64Images || (base64Image ? [base64Image] : []);
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error("[extract-invoice-ai] OPENAI_API_KEY is not set");
      return NextResponse.json({ error: "OpenAI API key not set on server" }, { status: 500 });
    }
    const openai = getOpenAIClient();
    let allItems: any[] = [];
    let generalInfo: any = null;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (typeof img !== "string" || !img.startsWith("data:")) continue;
      console.log(`[extract-invoice-ai] Processing image ${i + 1}/${images.length}`);
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `Extract the following fields from this invoice and return a JSON object with two keys:
                  - generalInfo (object):
                    - vendor_ai (string): The vendor or company issuing the invoice.
                    - invoice_date (string): The invoice date (if not found, use shipment date or similar field).
                    - due_date (string): The due date for payment (the latest date by which the invoice must be paid; if not found, leave empty).
                    - bill_number (string): The invoice number.
                    - terms (string): The payment terms (e.g., NET 15, NET 30).
                  - items (array of objects): Each object must have:
                    - product_ai (string): The product or service description.
                    - amount (string): The total amount for that item (never the unit price, always the line total or extended price).
                  If any field is missing or not visible, return it as an empty string. Respond ONLY with valid JSON, no explanation, no markdown, no code block, no extra text.`
              },
              { type: "image_url", image_url: { url: img } },
            ],
          },
        ],
        max_tokens: 800,
      });
      // Normalización de la respuesta para asegurar que todos los campos existen
      function normalizeInvoiceData(raw: any) {
        let parsed;
        try {
          parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          return { generalInfo: {}, items: [] };
        }
        // General Info
        const g = parsed.generalInfo || {};
        const generalInfoObj = {
          vendor_ai: g.vendor_ai || "",
          invoice_date: g.invoice_date || "",
          due_date: g.due_date || "",
          bill_number: g.bill_number || "",
          terms: g.terms || ""
        };
        // Items
        const items = Array.isArray(parsed.items)
          ? parsed.items.map((item: any) => ({
              product_ai: item.product_ai || "",
              amount: item.amount || ""
            }))
          : [];
        return { generalInfo: generalInfoObj, items };
      }
      const normalized = normalizeInvoiceData(response.choices[0].message.content);
      if (!generalInfo) generalInfo = normalized.generalInfo;
      allItems = allItems.concat(normalized.items);
    }
    return NextResponse.json({ data: { generalInfo: generalInfo || {}, items: allItems } });
    function normalizeInvoiceData(raw) {
      let parsed;
      try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        return { generalInfo: {}, items: [] };
      }
      // General Info
      const g = parsed.generalInfo || {};
      const generalInfo = {
        vendor_ai: g.vendor_ai || "",
        invoice_date: g.invoice_date || "",
        due_date: g.due_date || "",
        bill_number: g.bill_number || "",
        terms: g.terms || ""
      };
      // Items
      const items = Array.isArray(parsed.items)
        ? parsed.items.map((item) => ({
            product_ai: item.product_ai || "",
            amount: item.amount || ""
          }))
        : [];
      return { generalInfo, items };
    }

    const normalized = normalizeInvoiceData(response.choices[0].message.content);
    return NextResponse.json({ data: normalized });
  } catch (err) {
    console.error('[extract-invoice-ai] OpenAI Vision error:', err);
    return NextResponse.json({ error: "OpenAI Vision error", details: String(err) }, { status: 500 });
  }
}
