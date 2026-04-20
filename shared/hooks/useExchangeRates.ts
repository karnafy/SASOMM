import { useState, useEffect } from 'react';
import type { Currency } from '../types';

// Fallback rates if API is unreachable
const FALLBACK_RATES: Record<Currency, number> = {
  'ILS': 1,
  'USD': 1 / 3.75,
  'EUR': 1 / 4.05,
};

const API_URL = 'https://open.er-api.com/v6/latest/ILS';

export function useExchangeRates() {
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRates() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response not ok');

        const data = await response.json();
        if (data.result === 'success' && data.rates && !cancelled) {
          setRates({
            'ILS': 1,
            'USD': data.rates.USD ?? FALLBACK_RATES['USD'],
            'EUR': data.rates.EUR ?? FALLBACK_RATES['EUR'],
          });
        }
      } catch {
        // Keep fallback rates on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRates();
    return () => { cancelled = true; };
  }, []);

  return { rates, loading };
}
