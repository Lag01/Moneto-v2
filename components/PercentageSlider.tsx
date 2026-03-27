'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/financial';
import { validatePercentage } from '@/lib/validation';
import ValidationError from './ValidationError';

interface Props {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  percentage: number;
  amount: number;
  availableForPercentage: number;
  onChange: (id: string, percentage: number) => void;
  onAmountChange: (id: string, amount: number) => void;
  onToggleType: (id: string) => void;
  onDelete: (id: string) => void;
  color?: string;
  maxPercentage?: number;
}

export default function PercentageSlider({
  id,
  name,
  type,
  percentage,
  amount,
  availableForPercentage,
  onChange,
  onAmountChange,
  onToggleType,
  onDelete,
  color = '#3b82f6',
  maxPercentage = 100,
}: Props) {
  const [localPercentage, setLocalPercentage] = useState(percentage.toString());
  const [localAmount, setLocalAmount] = useState(amount.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!isEditing && type === 'percentage') {
      setLocalPercentage(percentage.toFixed(1));
    }
  }, [percentage, isEditing, type]);

  useEffect(() => {
    if (!isEditing && type === 'fixed') {
      setLocalAmount(amount.toFixed(2));
    }
  }, [amount, isEditing, type]);

  const handleSliderChange = (value: string) => {
    let num = parseFloat(value);
    // Limiter la valeur au maximum disponible
    if (num > maxPercentage) {
      num = maxPercentage;
    }
    setLocalPercentage(num.toFixed(1));
    setError(undefined);
    onChange(id, num);
  };

  const handleInputChange = (value: string) => {
    setLocalPercentage(value);

    // Validation
    const validation = validatePercentage(value);
    setError(validation.error);

    const num = parseFloat(value);
    if (validation.valid && !isNaN(num)) {
      onChange(id, num);
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (type === 'percentage') {
      let num = parseFloat(localPercentage);
      if (isNaN(num) || num < 0) {
        num = 0;
        setError('Le pourcentage ne peut pas être négatif');
      } else if (num > maxPercentage) {
        num = maxPercentage;
        setError(`Le pourcentage ne peut pas dépasser ${maxPercentage.toFixed(1)}% (maximum disponible)`);
      } else {
        setError(undefined);
      }
      setLocalPercentage(num.toFixed(1));
      onChange(id, num);
    }
  };

  const handleAmountChange = (value: string) => {
    setLocalAmount(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setError(undefined);
      onAmountChange(id, num);
    } else if (num < 0) {
      setError('Le montant ne peut pas être négatif');
    }
  };

  const handleAmountBlur = () => {
    setIsEditing(false);
    let num = parseFloat(localAmount);
    if (isNaN(num) || num < 0) {
      num = 0;
      setError('Le montant ne peut pas être négatif');
    } else {
      setError(undefined);
    }
    setLocalAmount(num.toFixed(2));
    onAmountChange(id, num);
  };

  return (
    <div className="space-y-1">
      <div className={`bg-white dark:bg-slate-800 rounded-lg p-4 md:p-5 border-l-4 border-slate-200 dark:border-slate-700 hover:border-l-slate-400 dark:hover:border-l-slate-500 transition-all ${
        error ? 'border-l-red-500' : ''
      }`}
      style={!error ? { borderLeftColor: color } : undefined}
      >
        {/* En-tête avec nom, badge type et boutons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
            <h3 className="text-base md:text-lg font-medium text-slate-800 dark:text-slate-100">{name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              type === 'fixed'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              {type === 'fixed' ? 'Fixe' : '%'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onToggleType(id)}
              className="p-2 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title={type === 'fixed' ? 'Convertir en pourcentage' : 'Convertir en montant fixe'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-2 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Supprimer cette enveloppe"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Affichage selon le type */}
        {type === 'percentage' ? (
          <>
            {/* Pourcentage et Montant */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-4">
              {/* Input pourcentage */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={localPercentage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => setIsEditing(true)}
                  onBlur={handleInputBlur}
                  min="0"
                  max={maxPercentage}
                  step="0.5"
                  className={`w-20 px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-center font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 min-h-[44px] ${
                    error ? 'border-red-500' : ''
                  }`}
                />
                <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">%</span>
              </div>

              {/* Montant calculé */}
              <div className="flex-1 sm:text-right">
                <p className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(amount)}</p>
              </div>
            </div>

            {/* Slider */}
            <div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={percentage}
                onChange={(e) => handleSliderChange(e.target.value)}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-700"
                style={{
                  background: `linear-gradient(to right, ${color}40 0%, ${color}40 ${percentage}%, #f1f5f9 ${percentage}%, #f1f5f9 100%)`,
                }}
              />
            </div>
          </>
        ) : (
          <>
            {/* Montant fixe */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
              {/* Input montant */}
              <div className="flex items-center gap-2 flex-1">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Montant :</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={localAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onFocus={() => setIsEditing(true)}
                  onBlur={handleAmountBlur}
                  min="0"
                  step="0.01"
                  className={`flex-1 px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-right font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 min-h-[44px] ${
                    error ? 'border-red-500' : ''
                  }`}
                />
                <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">€</span>
              </div>

              {/* Info pourcentage équivalent */}
              <div className="text-sm text-slate-500 dark:text-slate-400 sm:text-right">
                {availableForPercentage > 0 ? (
                  <>≈ {((amount / availableForPercentage) * 100).toFixed(1)}% du disponible</>
                ) : (
                  <>Montant fixe</>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Erreur de validation */}
      {error && <ValidationError error={error} />}
    </div>
  );
}
