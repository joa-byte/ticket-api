export const EXTRACT_TICKET_PROMPT = `Analizá la imagen de este ticket/recibo y devolvé únicamente un JSON válido con esta estructura:

{
  "storeName": string,
  "total": number,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ]
}

Reglas:
- No agregues texto fuera del JSON.
- No uses markdown.
- Si no encontrás un dato, usá valores vacíos razonables:
  - storeName: ""
  - total: 0
  - items: []
- Los precios deben ser números, no strings.
- quantity debe ser number.
- No inventes items que no estén en el ticket.
- Si un item no tiene precio unitario claro, usá el mismo valor que totalPrice.
- El total debe ser el total final del ticket, no subtotal.
- El JSON debe ser parseable con JSON.parse.`;
