import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Gauge, AlertTriangle, CheckCircle2,
  ArrowRight, ShieldCheck, Zap, Factory, Sparkles, RefreshCw, BarChart2
} from 'lucide-react';

/**
 * FactoryEfficiencyCalculator (OEE: Overall Equipment Effectiveness)
 * Calculates:
 *   - Current Baseline Efficiency (Without MDMS): Manual reporting, hidden idle losses, slow breakdown responses.
 *   - Projected Efficiency With RvmAiTech MDMS: Zero-program PLC pulse tracking, instant breakdown alerts, live OEE.
 *   - Availability, Performance, Quality, and overall OEE %
 *   - Monthly Production Output Gain (Units & Value)
 */
export default function FactoryEfficiencyCalculator({ onOpenQuote }) {
  // Inputs
  const [machines, setMachines] = useState(10);
  const [workingDays, setWorkingDays] = useState(26); // days per month
  const [shiftHours, setShiftHours] = useState(16); // 8, 16, 24 hrs/day
  const [plannedDowntime, setPlannedDowntime] = useState(60); // minutes/shift for tea/lunch/setup
  const [unplannedBreakdownMinutes, setUnplannedBreakdownMinutes] = useState(90); // minutes/shift breakdown/idle
  const [idealCycleTimeSec, setIdealCycleTimeSec] = useState(30); // sec per piece
  const [rejectRatePercent, setRejectRatePercent] = useState(4.5); // % scrap/rework
  const [pieceValueINR, setPieceValueINR] = useState(150); // Value per finished piece

  // Calculations
  const metrics = useMemo(() => {
    const totalShiftMinutes = shiftHours * 60;
    const netPlannedOperatingTime = totalShiftMinutes - plannedDowntime;

    // --- WITHOUT MDMS (Current Baseline) ---
    // In typical Indian factories without IoT MDMS:
    // Unplanned breakdowns take 90+ mins, speed losses are ~15% due to minor idling, and scrap is ~4-6%.
    const currentOperatingTime = Math.max(0, netPlannedOperatingTime - unplannedBreakdownMinutes);
    const currentAvailability = Math.min(100, Math.max(0, (currentOperatingTime / netPlannedOperatingTime) * 100));

    // Performance without MDMS: Micro-stops (5-10 sec pauses) are never recorded manually -> ~82% performance
    const currentPerformance = 82;

    // Quality without MDMS: (100 - rejectRatePercent)
    const currentQuality = 100 - rejectRatePercent;

    // Current Overall OEE %
    const currentOEE = (currentAvailability * currentPerformance * currentQuality) / 10000;

    // Actual Pieces Produced Per Shift without MDMS
    const currentOperatingSec = currentOperatingTime * 60;
    const currentPiecesPerShift = Math.floor((currentOperatingSec / idealCycleTimeSec) * (currentPerformance / 100) * (currentQuality / 100));
    const currentMonthlyPieces = currentPiecesPerShift * workingDays * machines;
    const currentMonthlyRevenue = currentMonthlyPieces * pieceValueINR;

    // --- WITH RVMAITECH MDMS (After Digital Twin IoT Deployment) ---
    // What MDMS actually fixes:
    // 1. Unplanned Downtime drops by 45%: Instant Telegram/WhatsApp breakdown siren to maintenance team + root-cause logging.
    const mdmsUnplannedBreakdownMinutes = Math.round(unplannedBreakdownMinutes * 0.55);
    const mdmsOperatingTime = Math.max(0, netPlannedOperatingTime - mdmsUnplannedBreakdownMinutes);
    const mdmsAvailability = Math.min(100, Math.max(0, (mdmsOperatingTime / netPlannedOperatingTime) * 100));

    // 2. Performance jumps from 82% to 94%: Spindle RPM & Cycle-time tracking stops operator slow-pedaling and micro-idling.
    const mdmsPerformance = 94;

    // 3. Quality improves by 35% reduction in rejects: Real-time sensor alerts (temperature/vibration/tool wear) prevent bad batches.
    const mdmsRejectRate = rejectRatePercent * 0.65;
    const mdmsQuality = 100 - mdmsRejectRate;

    // MDMS Overall OEE %
    const mdmsOEE = (mdmsAvailability * mdmsPerformance * mdmsQuality) / 10000;

    // Actual Pieces Produced Per Shift with MDMS
    const mdmsOperatingSec = mdmsOperatingTime * 60;
    const mdmsPiecesPerShift = Math.floor((mdmsOperatingSec / idealCycleTimeSec) * (mdmsPerformance / 100) * (mdmsQuality / 100));
    const mdmsMonthlyPieces = mdmsPiecesPerShift * workingDays * machines;
    const mdmsMonthlyRevenue = mdmsMonthlyPieces * pieceValueINR;

    // Deltas (Gains)
    const oeeDelta = mdmsOEE - currentOEE;
    const extraPiecesPerMonth = mdmsMonthlyPieces - currentMonthlyPieces;
    const extraRevenuePerMonth = extraPiecesPerMonth * pieceValueINR;
    const extraRevenuePerYear = extraRevenuePerMonth * 12;

    return {
      current: {
        oee: currentOEE.toFixed(1),
        availability: currentAvailability.toFixed(1),
        performance: currentPerformance.toFixed(1),
        quality: currentQuality.toFixed(1),
        downtimeMin: unplannedBreakdownMinutes,
        monthlyPieces: currentMonthlyPieces,
        monthlyRevenue: currentMonthlyRevenue,
      },
      mdms: {
        oee: mdmsOEE.toFixed(1),
        availability: mdmsAvailability.toFixed(1),
        performance: mdmsPerformance.toFixed(1),
        quality: mdmsQuality.toFixed(1),
        downtimeMin: mdmsUnplannedBreakdownMinutes,
        monthlyPieces: mdmsMonthlyPieces,
        monthlyRevenue: mdmsMonthlyRevenue,
      },
      oeeDelta: oeeDelta.toFixed(1),
      extraPiecesPerMonth,
      extraRevenuePerMonth,
      extraRevenuePerYear,
    };
  }, [machines, workingDays, shiftHours, plannedDowntime, unplannedBreakdownMinutes, idealCycleTimeSec, rejectRatePercent, pieceValueINR]);

  return (
    <div style={{
      background: 'linear-gradient(180deg, #071526 0%, #030a14 100%)',
      borderRadius: '20px',
      border: '1.5px solid rgba(56, 189, 248, 0.35)',
      padding: '32px 26px',
      color: '#ffffff',
      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow highlight */}
      <div style={{
        position: 'absolute',
        top: '-80px',
        right: '-80px',
        width: '260px',
        height: '260px',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 28px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(56, 189, 248, 0.12)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '5px 14px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 800,
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          <Gauge size={15} color="#38bdf8" /> Factory OEE &amp; Efficiency Diagnostic Simulator
        </div>

        <h3 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
          Factory Efficiency Calculator: Before vs After MDMS
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: '10px auto 0', lineHeight: 1.6 }}>
          Pata karein ki aapki factory ka current <b>OEE (Overall Equipment Effectiveness)</b> kitna hai, aur <b>RvmAiTech MDMS IoT Controller</b> lagane ke baad efficiency <b>kitne percent INCREASE hogi</b> aur extra production profit kitna milega.
        </p>
      </div>

      {/* Main Grid: Controls vs Efficiency Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '26px' }}>

        {/* LEFT COLUMN: Factory Parameters (Sliders) */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <Factory size={18} color="#38bdf8" />
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f8fafc' }}>Aapke Factory Parameters Input Karein:</span>
          </div>

          {/* Slider 1: Machines */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Total Shop-Floor Machines (CNC / Lathe / Press):</span>
              <span style={{ color: '#38bdf8', fontWeight: 900, fontSize: '0.95rem' }}>{machines} Machines</span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              value={machines}
              onChange={(e) => setMachines(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
            />
          </div>

          {/* Shift Hours & Working Days */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Shift Hours / Day:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[8, 16, 24].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setShiftHours(hrs)}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      borderRadius: '6px',
                      border: shiftHours === hrs ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      background: shiftHours === hrs ? '#0284c7' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {hrs} hrs
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Working Days / Mo:</span>
                <span style={{ color: '#38bdf8', fontWeight: 800 }}>{workingDays} Days</span>
              </div>
              <input
                type="range"
                min="20"
                max="31"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Slider 3: Unplanned Breakdown / Idle minutes */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Current Breakdown / Unplanned Idle (per shift):</span>
              <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '0.95rem' }}>{unplannedBreakdownMinutes} mins/shift</span>
            </div>
            <input
              type="range"
              min="15"
              max="180"
              step="5"
              value={unplannedBreakdownMinutes}
              onChange={(e) => setUnplannedBreakdownMinutes(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              (Tool change delay, tea lag, material waiting, undetected machine stoppage)
            </span>
          </div>

          {/* Cycle Time & Piece Value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Cycle Time:</span>
                <span style={{ color: '#f59e0b', fontWeight: 800 }}>{idealCycleTimeSec}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={idealCycleTimeSec}
                onChange={(e) => setIdealCycleTimeSec(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Piece Value:</span>
                <span style={{ color: '#22c55e', fontWeight: 800 }}>₹{pieceValueINR}</span>
              </div>
              <input
                type="range"
                min="20"
                max="2000"
                step="10"
                value={pieceValueINR}
                onChange={(e) => setPieceValueINR(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#22c55e', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Slider 4: Reject Rate % */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Current Rejection / Rework Rate:</span>
              <span style={{ color: '#f97316', fontWeight: 900, fontSize: '0.95rem' }}>{rejectRatePercent}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="15"
              step="0.5"
              value={rejectRatePercent}
              onChange={(e) => setRejectRatePercent(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f97316', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: BEFORE vs AFTER COMPARISON & OEE GAIN */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}>
          {/* Top Big Answer: DOES EFFICIENCY INCREASE OR DECREASE? */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(14, 165, 233, 0.12) 100%)',
            border: '2px solid #22c55e',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 8px 30px rgba(34, 197, 94, 0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#22c55e', color: '#052e16', padding: '6px 10px', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem' }}>
                  ✓ VERDICT
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>
                    MDMS Lagane Se Efficiency <span style={{ color: '#4ade80', textDecoration: 'underline' }}>BAHUT JAYADA (INCREASE)</span> Hogi!
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#cbd5e1' }}>
                    Zero manual registers, instant breakdown alert, aur live machine speed tracking se overall plant OEE <b>+{metrics.oeeDelta}%</b> badh jati hai.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(5, 46, 22, 0.8)',
                border: '1.5px solid #4ade80',
                padding: '8px 16px',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '0.7rem', color: '#86efac', fontWeight: 700, textTransform: 'uppercase' }}>OEE Jump</span>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#4ade80' }}>
                  +{metrics.oeeDelta}%
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Side-by-Side: WITHOUT MDMS vs WITH MDMS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            
            {/* Box A: WITHOUT MDMS */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 800, fontSize: '0.8rem', marginBottom: '8px' }}>
                <AlertTriangle size={15} /> BINA MDMS KE (Current)
              </div>

              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fca5a5' }}>
                {metrics.current.oee}%
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}> OEE</span>
              </div>

              <div style={{ margin: '10px 0', fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>• Availability: <b style={{ color: '#fff' }}>{metrics.current.availability}%</b></div>
                <div>• Performance: <b style={{ color: '#fff' }}>{metrics.current.performance}%</b></div>
                <div>• Quality Rate: <b style={{ color: '#fff' }}>{metrics.current.quality}%</b></div>
                <div>• Breakdown Loss: <b style={{ color: '#f87171' }}>{metrics.current.downtimeMin} m/shift</b></div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', fontSize: '0.74rem', color: '#94a3b8' }}>
                Monthly Output: <b style={{ color: '#fff' }}>{metrics.current.monthlyPieces.toLocaleString('en-IN')} pcs</b>
              </div>
            </div>

            {/* Box B: WITH RVMAITECH MDMS */}
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1.5px solid rgba(34, 197, 94, 0.45)',
              borderRadius: '12px',
              padding: '16px',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontWeight: 800, fontSize: '0.8rem', marginBottom: '8px' }}>
                <Sparkles size={15} /> RVMAITECH MDMS KE SATH
              </div>

              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4ade80' }}>
                {metrics.mdms.oee}%
                <span style={{ fontSize: '0.78rem', color: '#bbf7d0', fontWeight: 600 }}> OEE</span>
              </div>

              <div style={{ margin: '10px 0', fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>• Availability: <b style={{ color: '#4ade80' }}>{metrics.mdms.availability}%</b></div>
                <div>• Performance: <b style={{ color: '#4ade80' }}>{metrics.mdms.performance}%</b></div>
                <div>• Quality Rate: <b style={{ color: '#4ade80' }}>{metrics.mdms.quality}%</b></div>
                <div>• Breakdown Loss: <b style={{ color: '#4ade80' }}>{metrics.mdms.downtimeMin} m/shift</b> (45% Cut)</div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', fontSize: '0.74rem', color: '#94a3b8' }}>
                Monthly Output: <b style={{ color: '#4ade80' }}>{metrics.mdms.monthlyPieces.toLocaleString('en-IN')} pcs</b>
              </div>
            </div>
          </div>

          {/* Bottom Financial Production Gain Bar */}
          <div style={{
            background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#bae6fd', fontWeight: 700, textTransform: 'uppercase' }}>
                EXTRA PRODUCTION VALUE PER MONTH:
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>
                +₹{metrics.extraRevenuePerMonth.toLocaleString('en-IN')}
                <span style={{ fontSize: '0.8rem', color: '#e0f2fe', fontWeight: 600 }}> / month</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#bae6fd' }}>
                (+{metrics.extraPiecesPerMonth.toLocaleString('en-IN')} additional finished pieces without buying new machines)
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenQuote) {
                  onOpenQuote(`Factory Efficiency Consultation: ${machines} Machines, Current OEE ${metrics.current.oee}% -> Target ${metrics.mdms.oee}% (+₹${metrics.extraRevenuePerMonth.toLocaleString('en-IN')}/mo gain)`);
                } else {
                  window.location.href = `/contact?subject=${encodeURIComponent(`Factory Efficiency Audit for ${machines} Machines`)}`;
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#0369a1',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <span>Get Free Efficiency Audit</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Explanation bullet points for User */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '0.76rem',
            color: '#94a3b8',
            lineHeight: 1.5,
          }}>
            <b style={{ color: '#38bdf8' }}>💡 MDMS Se Efficiency Kaise Badhti Hai?</b>
            <div style={{ marginTop: '4px' }}>
              1. <b>Zero Manipulation:</b> Operator register me jhoothi reading nahi bhar sakta; MDMS seedha machine ke spindle pulse se real count leta hai.<br />
              2. <b>Fast Breakdown Response:</b> Machine rukte hi supervisor ke mobile par alert chala jata hai, jisse idle time 45% kam ho jata hai.<br />
              3. <b>Preventive Maintenance:</b> Breakdown aane se pehle motor overload aur cycle speed drop alert mil jata hai.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
