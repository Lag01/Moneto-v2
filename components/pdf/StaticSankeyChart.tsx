'use client';

import { useEffect, useRef } from 'react';
import { sankey, sankeyLinkHorizontal, sankeyLeft } from 'd3-sankey';
import { select } from 'd3-selection';
import type { MonthlyPlan } from '@/store';
import { formatCurrency } from '@/lib/financial';

interface SankeyNode {
  name: string;
  color?: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface Props {
  plan: MonthlyPlan;
  width?: number;
  height?: number;
}

export default function StaticSankeyChart({ plan, width = 700, height = 250 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !plan) return;

    const totalIncome = plan.fixedIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = plan.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const availableAmount = totalIncome - totalExpenses;

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];
    let nodeIndex = 0;

    nodes.push({ name: 'Revenus', color: '#10b981' });
    const revenuesIndex = nodeIndex++;

    if (plan.fixedExpenses.length > 0) {
      plan.fixedExpenses.forEach((expense) => {
        nodes.push({ name: expense.name, color: '#ef4444' });
        const expenseIndex = nodeIndex++;
        links.push({ source: revenuesIndex, target: expenseIndex, value: expense.amount });
      });
    }

    if (availableAmount > 0 && plan.envelopes.length > 0) {
      nodes.push({ name: 'Disponible', color: '#3b82f6' });
      const availableIndex = nodeIndex++;
      links.push({ source: revenuesIndex, target: availableIndex, value: availableAmount });

      plan.envelopes.forEach((envelope) => {
        nodes.push({ name: envelope.name, color: '#8b5cf6' });
        const envelopeIndex = nodeIndex++;
        links.push({ source: availableIndex, target: envelopeIndex, value: envelope.amount });
      });
    }

    const margin = { top: 15, right: 80, bottom: 15, left: 80 };

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([
        [0, 0],
        [width - margin.left - margin.right, height - margin.top - margin.bottom],
      ])
      .nodeAlign(sankeyLeft);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({ nodes, links });

    g.append('g')
      .selectAll('path')
      .data(sankeyLinks)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', (d: any) => d.source.color || '#cbd5e1')
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('opacity', 0.4);

    g.append('g')
      .selectAll('rect')
      .data(sankeyNodes)
      .join('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any) => d.color || '#64748b')
      .attr('opacity', 0.9)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('rx', 4);

    g.append('g')
      .selectAll('text')
      .data(sankeyNodes)
      .join('text')
      .attr('x', (d: any) => (d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8))
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => (d.x0 < width / 2 ? 'start' : 'end'))
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#1e293b')
      .text((d: any) => `${d.name} (${formatCurrency(d.value || 0)})`);
  }, [plan, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
