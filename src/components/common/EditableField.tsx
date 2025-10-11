import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/atoms/input';
import { Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EditableFieldProps {
  value: string | number;
  onSubmit: (value: string | number) => void;
  type?: 'text' | 'number' | 'email' | 'tel';
  numberProps?: {
    min?: number;
    max?: number;
    step?: number;
  };
  validate?: (value: string) => boolean;
  formatter?: (value: string | number) => string;
  parser?: (value: string) => string | number;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
  showEditIcon?: boolean;
  onEditStart?: () => void;
  onEditCancel?: () => void;
  onEditConfirm?: (value: string | number) => void;
  autoSelect?: boolean;
  confirmOnEnter?: boolean;
  cancelOnEscape?: boolean;
  confirmOnBlur?: boolean;
  editOnFocus?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSubmit,
  type = 'text',
  numberProps,
  validate,
  formatter,
  parser,
  placeholder,
  className,
  buttonClassName,
  inputClassName,
  disabled = false,
  showEditIcon = true,
  onEditStart,
  onEditCancel,
  onEditConfirm,
  autoSelect = true,
  confirmOnEnter = true,
  cancelOnEscape = true,
  confirmOnBlur = true,
  editOnFocus = true,
  inputRef: externalInputRef,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Función para asignar ambos refs al input
  const setRefs = (el: HTMLInputElement | null) => {
    inputRef.current = el;

    if (typeof externalInputRef === 'function') {
      externalInputRef(el);
    } else if (externalInputRef && typeof externalInputRef === 'object') {
      (externalInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
    }
  };

  const getDisplayValue = (val: string | number): string => {
    if (formatter) {
      return formatter(val);
    }

    if (type === 'number' && typeof val === 'number') {
      return val.toFixed(numberProps?.step ? 2 : 0);
    }

    return val.toString();
  };

  const parseValue = (val: string): string | number => {
    if (parser) {
      return parser(val);
    }

    if (type === 'number') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? value : parsed;
    }

    return val;
  };

  const validateValue = (val: string): boolean => {
    if (validate) {
      return validate(val);
    }

    if (type === 'number') {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) return false;

      if (numberProps?.min !== undefined && parsed < numberProps.min) return false;
      if (numberProps?.max !== undefined && parsed > numberProps.max) return false;
    }

    return true;
  };

  const startEditing = () => {
    if (disabled) return;

    setIsEditing(true);
    setTempValue(value.toString());
    setError('');
    onEditStart?.();
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setTempValue('');
    setError('');
    onEditCancel?.();
  };

  const confirmEditing = () => {
    if (!validateValue(tempValue)) {
      setError('Valor inválido');
      return;
    }

    const parsedValue = parseValue(tempValue);
    setIsEditing(false);
    setError('');
    onEditConfirm?.(parsedValue);
    onSubmit(parsedValue);
    inputRef.current?.blur();
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (autoSelect) {
        inputRef.current.select();
      }
    }
  }, [isEditing, autoSelect]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (confirmOnEnter && e.key === 'Enter') {
      e.preventDefault();
      confirmEditing();
    }

    if (cancelOnEscape && e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
      inputRef.current?.blur()
    }
  };

  const handleBlur = () => {
    if (confirmOnBlur) {
      confirmEditing();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
    setError(''); // Limpiar error al escribir
  };

  const handleInputClick = () => {
    if (!isEditing && editOnFocus) {
      startEditing();
    }
  };

  const handleInputFocus = () => {
    if (!isEditing && editOnFocus) {
      startEditing();
    }
  };

  const displayValue = getDisplayValue(value);

  return (
    <div className={cn('relative w-full', className, buttonClassName)}>
      <Input
        ref={setRefs}
        type={type}
        value={isEditing ? tempValue : displayValue}
        onChange={isEditing ? handleChange : undefined}
        onBlur={isEditing ? handleBlur : undefined}
        onKeyDown={isEditing ? handleKeyDown : undefined}
        onClick={handleInputClick}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={!isEditing}
        className={cn(
          'cursor-pointer',
          !isEditing && 'hover:bg-accent',
          isEditing && 'cursor-text',
          error && 'border-red-500 focus:border-red-500 ring-red-500',
          inputClassName
        )}
        {...(type === 'number' && numberProps)}
      />
      {showEditIcon && !disabled && !isEditing && (
        <Edit3 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
      )}
      {error && (
        <div className="mt-1 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};