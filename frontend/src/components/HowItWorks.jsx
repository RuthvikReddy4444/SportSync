import React from 'react';
import { Search, CalendarCheck, Trophy, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: <Search size={24} />,
      title: 'Search & Compare',
      desc: 'Find courts, turfs, and pools by sport, locality, or real-time GPS distance. View photos, verified amenities, and hourly pricing.'
    },
    {
      num: '02',
      icon: <CalendarCheck size={24} />,
      title: 'Select Live Slot',
      desc: 'Pick your preferred playing date and morning or evening time slot. Our atomic lock guarantees zero double-booking.'
    },
    {
      num: '03',
      icon: <Trophy size={24} />,
      title: 'Pay & Play',
      desc: 'Confirm your slot with simulated checkout, download your official verified booking receipt, show up at the venue, and play!'
    }
  ];

  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="section-head text-center">
        <span className="section-kicker">SIMPLE 3-STEP PROCESS</span>
        <h2 className="section-heading">How SportSync works for players</h2>
        <p className="section-sub">
          From finding a court to kickoff in under two minutes.
        </p>
      </div>

      <div className="steps-grid">
        {steps.map(s => (
          <div key={s.num} className="step-card">
            <span className="step-watermark">{s.num}</span>
            <div className="step-icon-bubble">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
