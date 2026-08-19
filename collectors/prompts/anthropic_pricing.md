Extract the AI models and their pricing into a flat array of records. Each record MUST contain exactly these fields: model_name, input_price, output_price.

CRITICAL INSTRUCTIONS:
- Return a FLAT array of records. Do NOT wrap the array in a "models" object or any other top-level object.
- The `input_price` and `output_price` fields MUST be plain strings or numbers (e.g., "$3.00" or 3). Do NOT return nested objects for prices.
- Only return rows that represent a named pricing plan/model with both an input and output price. Skip any headers, footnotes, or enterprise blurbs that have no model_name.
