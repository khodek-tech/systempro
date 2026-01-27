'use client';

import { useState, useEffect } from 'react';

export function LiveClock() {
  const [time, setTime] = useState<string>('00:00:00');
  const [date, setDate] = useState<string>('---');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('cs-CZ'));
      setDate(
        now
          .toLocaleDateString('cs-CZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
          .toUpperCase()
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-right">
      <p className="text-xl font-semibold text-slate-800 font-mono">{time}</p>
      <p className="text-sm text-slate-400 font-medium mt-0.5">
        {date}
      </p>
    </div>
  );
}
