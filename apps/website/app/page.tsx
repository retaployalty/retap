'use client';

import { useEffect, useState } from 'react';

interface Card {
  id: string;
  uid: string;
  customer_id: string;
  merchant_id: string;
  created_at: string;
  points?: number;
}

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch('http://localhost:4000/cards', {
          headers: {
            'x-merchant-id': '11111111-1111-1111-1111-111111111111',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch cards');
        const data = await res.json();
        setCards(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ReTap Cards</h1>
        
        <div className="grid gap-4">
          {cards.map((card) => (
            <div 
              key={card.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Card {card.uid}</h2>
                  <p className="text-gray-600">
                    Created: {new Date(card.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {card.points ?? 0} points
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No cards found. Start by writing a card using the POS app.
          </div>
        )}
      </div>
    </div>
  );
}
