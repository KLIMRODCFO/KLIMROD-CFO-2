import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { base64Images, bu_id } = await req.json();

    if (!base64Images || !Array.isArray(base64Images)) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash" 
    });

    const results = [];

    for (const base64Image of base64Images) {
      // Detectar MimeType y limpiar Base64
      const mimeTypeMatch = base64Image.match(/^data:(.*?);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
      const base64Data = base64Image.split(",")[1];

      // PROMPT BLINDADO: Instrucciones agresivas para evitar campos NULL
      const prompt = `
        Analyze this restaurant invoice document for Business Unit ID: ${bu_id}.
        
        CRITICAL EXTRACTION RULES:
        1. "product_ai" field is MANDATORY. You must extract the text from the "DESCRIPTION INFO" column.
        2. "item" field must contain the "ITEM# / CUSTOMER ITEM#" value.
        3. "qty" must be the numerical quantity.
        4. "units" must be the Unit of Measure (CS, LB, EA, PC, etc.).
        5. "unit_price" and "amount" must be numbers.

        Return ONLY a JSON object with this exact structure:
        {
          "generalInfo": {
            "vendor_ai": "string",
            "invoice_date": "YYYY-MM-DD",
            "due_date": "YYYY-MM-DD",
            "bill_number": "string",
            "terms": "string",
            "total_amount": number
          },
          "items": [
            {
              "product_ai": "FULL PRODUCT DESCRIPTION FROM DOCUMENT",
              "item": "SKU CODE",
              "qty": number,
              "units": "UOM",
              "unit_price": number,
              "amount": number
            }
          ]
        }
      `;

      try {
        const result = await model.generateContent([
          { text: prompt },
          { inlineData: { data: base64Data, mimeType: mimeType } }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // Limpiar respuesta de posibles backticks de markdown
        const cleanJson = text.replace(/```json|```/g, "").trim();
        const parsedData = JSON.parse(cleanJson);
        
        results.push({ data: parsedData });

      } catch (innerErr: any) {
        console.error("[GEMINI INDIVIDUAL ERROR]:", innerErr);
        results.push({ error: "Failed to parse this page", detail: innerErr.message });
      }
    }

    return NextResponse.json({ results });

  } catch (err: any) {
    console.error("[SERVER ERROR]:", err);
    return NextResponse.json({ error: "Server Error", message: err.message }, { status: 500 });
  }
}
