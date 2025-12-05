import { NextApiRequest, NextApiResponse } from 'next';
import Moralis from 'moralis';

async function ensureMoralis() {
  const key = process.env.MORALIS_API_KEY;
  if (!key) throw new Error('MORALIS_API_KEY is not set');
  // Moralis.start is idempotent
  await Moralis.start({ apiKey: key });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const tokenAddress = (req.query.tokenAddress as string) || req.body?.tokenAddress;
  if (!tokenAddress) return res.status(400).json({ error: 'tokenAddress is required' });

  try {
    await ensureMoralis();
    const response = await Moralis.EvmApi.token.getMultipleTokenPrices(
      { chain: '0x1' },
      { tokens: [{ tokenAddress }] }
    );
    const price = response.raw?.[0]?.usdPrice ?? null;
    res.status(200).json({ usdPrice: price });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
}
