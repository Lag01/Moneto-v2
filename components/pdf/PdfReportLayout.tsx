'use client';

import type { MonthlyPlan } from '@/store';
import type { PlanSummary } from '@/lib/monthly-plan';
import { formatCurrency } from '@/lib/financial';
import StaticSankeyChart from './StaticSankeyChart';

interface Props {
  plan: MonthlyPlan;
  summary: PlanSummary;
}

export default function PdfReportLayout({ plan, summary }: Props) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const envelopeCols = plan.envelopes.length > 8 ? 5 : 4;
  const envelopeFontSize = plan.envelopes.length > 8 ? '10px' : '12px';

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        backgroundColor: '#ffffff',
        color: '#1e293b',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '28px 32px',
        boxSizing: 'border-box',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #10b981',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#10b981',
              letterSpacing: '-0.5px',
            }}
          >
            Moneto
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            {plan.name}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {dateStr}
          </div>
        </div>
      </div>

      {/* RÉSUMÉ - 5 cartes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <SummaryCard label="Revenus totaux" value={summary.totalIncome} color="#10b981" />
        <SummaryCard label="Dépenses fixes" value={summary.totalFixedExpenses} color="#ef4444" />
        <SummaryCard label="Disponible" value={summary.availableAmount} color="#3b82f6" />
        <SummaryCard label="Enveloppes" value={summary.totalEnvelopes} color="#8b5cf6" />
        <SummaryCard
          label="Solde final"
          value={summary.finalBalance}
          color={summary.finalBalance >= 0 ? '#10b981' : '#ef4444'}
        />
      </div>

      {/* REVENUS / DÉPENSES FIXES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {/* Revenus fixes */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#15803d',
              marginBottom: '10px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '6px',
            }}
          >
            Revenus fixes
          </div>
          {plan.fixedIncomes.map((income) => (
            <div
              key={income.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                padding: '3px 0',
              }}
            >
              <span style={{ color: '#475569' }}>{income.name}</span>
              <span style={{ fontWeight: '600', color: '#16a34a' }}>
                {formatCurrency(income.amount)}
              </span>
            </div>
          ))}
        </div>

        {/* Dépenses fixes */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#b91c1c',
              marginBottom: '10px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '6px',
            }}
          >
            Dépenses fixes
          </div>
          {plan.fixedExpenses.map((expense) => (
            <div
              key={expense.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                padding: '3px 0',
              }}
            >
              <span style={{ color: '#475569' }}>{expense.name}</span>
              <span style={{ fontWeight: '600', color: '#dc2626' }}>
                {formatCurrency(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ENVELOPPES */}
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#7c3aed',
            marginBottom: '10px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '6px',
          }}
        >
          Répartition des enveloppes
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${envelopeCols}, 1fr)`,
            gap: '8px',
          }}
        >
          {plan.envelopes.map((envelope) => (
            <div
              key={envelope.id}
              style={{
                backgroundColor: '#f5f3ff',
                borderRadius: '6px',
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  fontSize: envelopeFontSize,
                  color: '#475569',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {envelope.name}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#7c3aed',
                }}
              >
                {formatCurrency(envelope.amount)}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                {envelope.type === 'fixed' ? 'Fixe' : `${envelope.percentage}%`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SANKEY */}
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '10px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '6px',
          }}
        >
          Diagramme de flux
        </div>
        <StaticSankeyChart plan={plan} width={720} height={240} />
      </div>

      {/* FOOTER */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '10px',
          color: '#94a3b8',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '10px',
        }}
      >
        Généré par Moneto le {dateStr}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '10px 12px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '700', color }}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}
