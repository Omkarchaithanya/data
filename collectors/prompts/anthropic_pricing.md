EXTRACT EACH MODEL AS A SEPARATE RECORD.
Do NOT extract the page as a single record with a list of models.
Extract the pricing information for all available Claude models.
Return the data as a flat JSON array of objects.

CRITICAL INSTRUCTION: You must extract ALL pricing tiers on the page, not just the first N. Ensure Sonnet, Opus, Haiku, and any other model variants are all included.

Each object must have exactly these fields:
- "model_name"
- "input_price"
- "output_price"

Example of expected output:
[
  {
    "model_name": "Claude 3.5 Sonnet",
    "input_price": "$3.00",
    "output_price": "$15.00"
  },
  {
    "model_name": "Claude 3 Opus",
    "input_price": "$15.00",
    "output_price": "$75.00"
  }
]
Do NOT include a `models` key. Do NOT include `product_page_url`. ONLY the three fields above for each model.
