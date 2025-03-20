interface SanctionedAddressResponse {
  address: string;
  is_sanctioned: boolean;
}

interface ErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

async function checkSanctionedAddress(address: string): Promise<boolean> {
  const apiKey = process.env.WEBCACY_API_KEY;
  if (!apiKey) {
    throw new Error('WEBCACY_API_KEY is not defined');
  }

  const url = `https://api.webacy.com/addresses/sanctioned/${address}?chain=eth`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(`Error: ${errorData.message}`);
  }

  const data: SanctionedAddressResponse = await response.json();
  return data.is_sanctioned || false;
}
