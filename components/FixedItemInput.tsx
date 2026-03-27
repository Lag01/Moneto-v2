'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/financial';
import { validateName, validateAmount } from '@/lib/validation';
import ValidationError from './ValidationError';

interface Props {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  onUpdate: (id: string, name: string, amount: number) => void;
  onDelete: (id: string) => void;
  autoFocus?: boolean;
}

export default function FixedItemInput({
  id,
  name: initialName,
  amount: initialAmount,
  type,
  onUpdate,
  onDelete,
  autoFocus = false,
}: Props) {
  const [name, setName] = useState(initialName);
  const [amount, setAmount] = useState(initialAmount.toString());
  const [isEditing, setIsEditing] = useState(autoFocus);
  const [nameError, setNameError] = useState<string>();
  const [amountError, setAmountError] = useState<string>();

  const handleNameChange = (value: string) => {
    setName(value);

    // Validation
    const validation = validateName(value);
    setNameError(validation.error);

    const numAmount = parseFloat(amount) || 0;
    if (validation.valid) {
      onUpdate(id, value, numAmount);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);

    // Validation
    const validation = validateAmount(value);
    setAmountError(validation.error);

    const numAmount = parseFloat(value) || 0;
    if (validation.valid && numAmount >= 0) {
      onUpdate(id, name, numAmount);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    // S'assurer que le montant est valide
    const numAmount = parseFloat(amount) || 0;
    if (numAmount < 0) {
      setAmount('0');
      setAmountError('Le montant ne peut pas être négatif');
    } else {
      setAmount(numAmount.toString());
      setAmountError(undefined);
    }
  };

  const bgColor = type === 'income' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';
  const borderColor = type === 'income' ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800';
  const textColor = type === 'income' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';

  const hasError = nameError || amountError;

  return (
    <div className="space-y-1">
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border ${borderColor} ${bgColor} transition-all duration-200 hover:shadow-md ${
          hasError ? 'ring-2 ring-red-500' : ''
        }`}
      >
        {/* Nom */}
        <div className="flex-1 w-full">
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={handleBlur}
            placeholder={type === 'income' ? 'Ex: Salaire' : 'Ex: Loyer'}
            autoFocus={autoFocus}
            className={`w-full px-3 py-3 md:py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-${
              type === 'income' ? 'green' : 'red'
            }-500 text-slate-800 dark:text-slate-100 min-h-[44px] ${
              nameError ? 'border-red-500' : ''
            }`}
          />
        </div>

        {/* Montant et bouton supprimer sur mobile */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Montant */}
          <div className="flex-1 sm:w-32">
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onFocus={() => setIsEditing(true)}
              onBlur={handleBlur}
              placeholder="0"
              min="0"
              step="0.01"
              className={`w-full px-3 py-3 md:py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-right focus:outline-none focus:ring-2 focus:ring-${
                type === 'income' ? 'green' : 'red'
              }-500 text-slate-800 dark:text-slate-100 font-semibold min-h-[44px] ${
                amountError ? 'border-red-500' : ''
              }`}
            />
          </div>

          {/* Affichage formaté (visible quand non en édition) */}
          {!isEditing && parseFloat(amount) > 0 && (
            <div className={`hidden sm:block text-sm font-medium ${textColor} dark:opacity-90 w-24 text-right`}>
              {formatCurrency(parseFloat(amount))}
            </div>
          )}

          {/* Bouton supprimer */}
          <button
            onClick={() => onDelete(id)}
            className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Supprimer"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Erreurs de validation */}
      {nameError && <ValidationError error={nameError} />}
      {amountError && <ValidationError error={amountError} />}
    </div>
  );
}
