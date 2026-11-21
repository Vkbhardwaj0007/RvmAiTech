import { useState, useMemo } from 'react';
import {
  TrendingUp, DollarSign, Clock, ShieldCheck, ArrowRight,
  Sparkles, CheckCircle2, AlertTriangle, Calculator, Car, Factory
} from 'lucide-react';

export default function RoiCalculator({ onOpenQuote }) {
  const [calcMode, setCalcMode] = useState('mdms'); // 'mdms' | 'parking'

  // MDMS Calculator State
  const [machines, setMachines] = useState(12);
  const [shiftHours, setShiftHours] = useState(16); // 8, 16, 24
  const [downtimeHoursPerMonth, setDowntimeHoursPerMonth] = useState(28);
  const [hourlyBreakdownCost, setHourlyBreakdownCost] = useState(2500);

  // Smart Parking Calculator State
  const [parkingSlots, setParkingSlots] = useState(180);
  const [avgOccupancy, setAvgOccupancy] = useState(65); // %
  const [hourlyTariff, setHourlyTariff] = useState(40); // INR
  const [dailyHours, setDailyHours] = useState(16); // 12 or 24

  // MDMS Calculations
  const mdmsMetrics = useMemo(() => {
    const totalDowntimeHours = machines * downtimeHoursPerMonth;
    const currentMonthlyLoss = totalDowntimeHours * hourlyBreakdownCost;
    const estimatedSavingsRate = 0.36; // 36% reduction in unplanned downtime
    const monthlySavings = currentMonthlyLoss * estimatedSavingsRate;
    const annualSavings = monthlySavings * 12;
    const hardwareAndSetupCost = machines * 18500; // estimated investment
    const paybackMonths = Math.max(0.8, (hardwareAndSetupCost / (monthlySavings || 1)).toFixed(1));

    return {
      totalDowntimeHours,
      currentMonthlyLoss: Math.round(currentMonthlyLoss),
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      paybackMonths,
      hardwareAndSetupCost,
    };
  }, [machines, downtimeHoursPerMonth, hourlyBreakdownCost]);

  // Smart Parking Calculations
  const parkingMetrics = useMemo(() => {
    const occupiedSlots = Math.round(parkingSlots * (avgOccupancy / 100));
    const dailyRevenue = occupiedSlots * hourlyTariff * (dailyHours * 0.7); // effective billed hours
    const monthlyRevenue = dailyRevenue * 30;
    const annualRevenue = monthlyRevenue * 12;
    // Labor savings from automatic ANPR barrier vs 4 security attendants
    const monthlyStaffSavings = 48000;
    const totalAnnualValue = annualRevenue + (monthlyStaffSavings * 12);

    return {
      occupiedSlots,
      monthlyRevenue: Math.round(monthlyRevenue),
      annualRevenue: Math.round(annualRevenue),
      monthlyStaffSavings,
      totalAnnualValue: Math.round(totalAnnualValue),
    };
  }, [parkingSlots, avgOccupancy, hourlyTariff, dailyHours]);

  return (
    <div style={{
      background: 'linear-gradient(180deg, #091728 0%, #060f1b 100%)',
      borderRadius: '16px',
      border: '1.5px solid rgba(56, 189, 248, 0.3)',
      padding: '32px 24px',
      color: '#ffffff',
      boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 28px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.78rem',
          fontWeight: 800,
          marginBottom: '10px',
        }}>
          <Calculator size={14} /> INTERACTIVE BUSINESS ROI ESTIMATOR
        </div>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
          Calculate Your Factory Savings &amp; System ROI
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '8px auto 0' }}>
          Simulate real-world cost recovery and payback periods before deploying RvmAiTech hardware on your shop floor or parking facility.
        </p>

        {/* Switcher Mode Tabs */}
        <div style={{
          display: 'inline-flex',
          background: 'rgba(15, 29, 52, 0.8)',
          padding: '5px',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          marginTop: '20px',
          gap: '6px',
        }}>
          <button
            type="button"
            onClick={() => setCalcMode('mdms')}
            style={{
              padding: '8px 18px',
              borderRadius: '7px',
              border: 'none',
              background: calcMode === 'mdms' ? '#0284c7' : 'transparent',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <Factory size={15} />
            <span>Factory MDMS Downtime ROI</span>
          </button>

          <button
            type="button"
            onClick={() => setCalcMode('parking')}
            style={{
              padding: '8px 18px',
              borderRadius: '7px',
              border: 'none',
              background: calcMode === 'parking' ? '#0284c7' : 'transparent',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <Car size={15} />
            <span>Smart Parking Revenue ROI</span>
          </button>
        </div>
      </div>

      {/* Calculator Body Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'center' }}>
        {/* Left Column: Sliders & Controls */}
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {calcMode === 'mdms' ? (
            <>
              {/* Slider 1: Machines */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Number of Shop-Floor Machines:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 900, fontSize: '1rem' }}>{machines} Units</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="60"
                  value={machines}
                  onChange={(e) => setMachines(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
                />
              </div>

              {/* Slider 2: Downtime Hours */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Avg Downtime Hours / Machine / Month:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: '1rem' }}>{downtimeHoursPerMonth} hrs</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="70"
                  value={downtimeHoursPerMonth}
                  onChange={(e) => setDowntimeHoursPerMonth(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                />
              </div>

              {/* Slider 3: Hourly Breakdown Cost */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Hourly Cost of Stoppage / Lost Production:</span>
                  <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1rem' }}>₹{hourlyBreakdownCost.toLocaleString('en-IN')}/hr</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="12000"
                  step="250"
                  value={hourlyBreakdownCost}
                  onChange={(e) => setHourlyBreakdownCost(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
                />
              </div>

              {/* Shift Selection */}
              <div>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Daily Plant Operation:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { val: 8, label: 'Single Shift (8h)' },
                    { val: 16, label: 'Double Shift (16h)' },
                    { val: 24, label: 'Continuous 24/7' },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setShiftHours(s.val)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: shiftHours === s.val ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        background: shiftHours === s.val ? '#0284c7' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Parking: Number of Bays */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Total Facility Parking Slots:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 900, fontSize: '1rem' }}>{parkingSlots} Slots</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="800"
                  step="10"
                  value={parkingSlots}
                  onChange={(e) => setParkingSlots(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
                />
              </div>

              {/* Parking: Occupancy */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Average Facility Occupancy:</span>
                  <span style={{ color: '#22c55e', fontWeight: 900, fontSize: '1rem' }}>{avgOccupancy}%</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="95"
                  value={avgOccupancy}
                  onChange={(e) => setAvgOccupancy(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#22c55e', cursor: 'pointer' }}
                />
              </div>

              {/* Parking: Hourly Tariff */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Hourly Parking Rate:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: '1rem' }}>₹{hourlyTariff}/hr</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={hourlyTariff}
                  onChange={(e) => setHourlyTariff(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                />
              </div>

              {/* Daily Operating Hours */}
              <div>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Parking Operating Window:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { val: 12, label: 'Daytime (12 Hours)' },
                    { val: 16, label: 'Commercial Mall (16h)' },
                    { val: 24, label: '24/7 Operations' },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setDailyHours(s.val)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: dailyHours === s.val ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        background: dailyHours === s.val ? '#0284c7' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Calculated ROI Results Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '14px',
          padding: '26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}>
          {calcMode === 'mdms' ? (
            <>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  PROJECTED MONTHLY RECOVERED CAPITAL:
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.02em', marginTop: '2px' }}>
                  ₹{mdmsMetrics.monthlySavings.toLocaleString('en-IN')}
                  <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}> / month</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Estimated Annual Savings:</span>
                  <div style={{ color: '#4ade80', fontWeight: 900, fontSize: '1.2rem', marginTop: '2px' }}>
                    ₹{mdmsMetrics.annualSavings.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Payback Period:</span>
                  <div style={{ color: '#f59e0b', fontWeight: 900, fontSize: '1.2rem', marginTop: '2px' }}>
                    &lt; {mdmsMetrics.paybackMonths} Months
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <CheckCircle2 size={14} color="#22c55e" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Based on historical data across 50+ manufacturing plants reducing average unplanned stoppage by 36% via RvmAiTech real-time telemetry.
              </div>
            </>
          ) : (
            <>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  PROJECTED MONTHLY PARKING EARNINGS:
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.02em', marginTop: '2px' }}>
                  ₹{parkingMetrics.monthlyRevenue.toLocaleString('en-IN')}
                  <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}> / month</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Annual Revenue Potential:</span>
                  <div style={{ color: '#4ade80', fontWeight: 900, fontSize: '1.2rem', marginTop: '2px' }}>
                    ₹{parkingMetrics.annualRevenue.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Staff Cost Automation Savings:</span>
                  <div style={{ color: '#f59e0b', fontWeight: 900, fontSize: '1.2rem', marginTop: '2px' }}>
                    ₹{parkingMetrics.monthlyStaffSavings.toLocaleString('en-IN')}/mo
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <CheckCircle2 size={14} color="#22c55e" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Automated ANPR number plate barrier entry eliminates cash leakage, long entry queues, and reduces manual attendant overhead.
              </div>
            </>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenQuote) {
                onOpenQuote(
                  calcMode === 'mdms'
                    ? `MDMS Simulation: ${machines} Machines (Est. ₹${mdmsMetrics.monthlySavings.toLocaleString('en-IN')}/mo savings)`
                    : `Smart Parking: ${parkingSlots} Slots (Est. ₹${parkingMetrics.monthlyRevenue.toLocaleString('en-IN')}/mo revenue)`
                );
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '8px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>Request Formal Proposal With These Figures</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
