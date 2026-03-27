'use client';

import { useState } from 'react';
import type { FixedItem } from '@/store';
import FixedItemInput from './FixedItemInput';
import { formatCurrency } from '@/lib/financial';
import { calculateFixedTotal } from '@/lib/monthly-plan';

interface Props {
  type: 'income' | 'expense';
  items: FixedItem[];
  onChange: (items: FixedItem[]) => void;
  title: string;
}

export default function IncomeExpenseForm({ type, items, onChange, title }: Props) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  const total = calculateFixedTotal(items);

  const handleAdd = () => {
    if (!newItemName.trim() || !newItemAmount) return;

    const amount = parseFloat(newItemAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newItem: FixedItem = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newItemName.trim(),
      amount,
    };

    onChange([...items, newItem]);
    setNewItemName('');
    setNewItemAmount('');
  };

  const handleUpdate = (id: string, name: string, amount: number) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, name, amount } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const themeColors = {
    income: {
      primary: 'emerald',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-300 dark:border-emerald-800',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      ring: 'focus:ring-emerald-500',
    },
    expense: {
      primary: 'red',
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-300 dark:border-red-800',
      button: 'bg-red-600 hover:bg-red-700',
      ring: 'focus:ring-red-500',
    },
  };

  const colors = themeColors[type];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 md:p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className={`text-lg md:text-xl font-semibold ${colors.text}`}>{title}</h2>
        <div className={`px-4 py-2 rounded-lg ${colors.bg}`}>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">Total</p>
          <p className={`text-xl md:text-2xl font-bold ${colors.text}`}>
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      {/* Liste des items */}
      <div className="space-y-2 mb-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <p>Aucun {type === 'income' ? 'revenu' : 'dépense'} ajouté</p>
            <p className="text-sm mt-1">
              Utilisez le formulaire ci-dessous pour en ajouter
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <FixedItemInput
              key={item.id}
              id={item.id}
              name={item.name}
              amount={item.amount}
              type={type}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              autoFocus={index === items.length - 1 && item.name === ''}
            />
          ))
        )}
      </div>

      {/* Formulaire d'ajout */}
      <div className={`border-t ${colors.border} pt-4`}>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Ajouter un{type === 'income' ? ' revenu' : 'e dépense'}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={type === 'income' ? 'Ex: Salaire' : 'Ex: Loyer'}
            className={`flex-1 px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded focus:outline-none focus:ring-2 ${colors.ring} min-h-[44px]`}
          />
          <input
            type="number"
            inputMode="decimal"
            value={newItemAmount}
            onChange={(e) => setNewItemAmount(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Montant"
            min="0"
            step="0.01"
            className={`w-full sm:w-32 px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-right focus:outline-none focus:ring-2 ${colors.ring} min-h-[44px]`}
          />
          <button
            onClick={handleAdd}
            disabled={!newItemName.trim() || !newItemAmount}
            className={`px-6 py-3 md:py-2 text-white rounded font-medium transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed ${colors.button} min-h-[44px] flex items-center justify-center`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Aide rapide */}
        <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p>
            Appuyez sur <kbd className="px-1 bg-slate-200 dark:bg-slate-700 rounded">Entrée</kbd> pour
            ajouter rapidement
          </p>
        </div>
      </div>

      {/* Statistiques */}
      {items.length > 0 && (
        <div className={`mt-4 pt-4 border-t ${colors.border}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              {items.length} {type === 'income' ? 'revenu' : 'dépense'}
              {items.length > 1 ? 's' : ''}
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Moyenne : {formatCurrency(items.length > 0 ? total / items.length : 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
