import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Search, X, Loader2 } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    subLabel?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string, label?: string) => void;
    onSearch?: (query: string) => void;
    placeholder?: string;
    label?: string;
    isLoading?: boolean;
    disabled?: boolean;
    error?: string;
    helperText?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    onSearch,
    placeholder = 'Select...',
    label,
    isLoading = false,
    disabled = false,
    error,
    helperText
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update internal state when value changes externally
    useEffect(() => {
        const selectedOption = options.find(opt => opt.value === value);
        if (selectedOption) {
            setSearchTerm(selectedOption.label); // Sync input display with selected value
        } else if (!value && !onSearch) {
            // Only clear search term if value is empty AND we are not in search mode
            // If onSearch is provided, we assume the user might be typing/searching
            setSearchTerm('');
        }
    }, [value, options, onSearch]);

    // Handle outside click to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset search term to selected label if we closed without selecting
                const selectedOption = options.find(opt => opt.value === value);
                if (selectedOption) {
                    setSearchTerm(selectedOption.label);
                } else {
                    setSearchTerm('');
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value, options]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchTerm(query);
        setIsOpen(true);
        if (onSearch) {
            onSearch(query);
        }
    };

    const handleSelect = (option: Option) => {
        onChange(option.value, option.label);
        setSearchTerm(option.label);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('', '');
        setSearchTerm('');
        if (onSearch) onSearch('');
        inputRef.current?.focus();
    };


    const handleFocus = () => {
        setIsOpen(true);
        if (!searchTerm && onSearch) {
            onSearch('');
        }
    };

    const displayOptions = onSearch ? options : options.filter(option => {
        const query = searchTerm.toLowerCase();
        return (
            option.label.toLowerCase().includes(query) ||
            (option.subLabel && option.subLabel.toLowerCase().includes(query))
        );
    });

    return (
        <div className="w-full" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={clsx(
                            'w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white dark:bg-surface-800 transition-all duration-200 outline-none',
                            error
                                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-surface-200 dark:border-surface-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                            disabled && 'bg-surface-50 dark:bg-surface-800 text-surface-400 cursor-not-allowed'
                        )}
                    />
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-surface-400 pointer-events-none" />

                    {/* Right side icons */}
                    <div className="absolute right-3 top-2.5 flex items-center gap-2">
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                        ) : searchTerm && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-surface-400 hover:text-surface-600 dark:text-surface-400 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Dropdown Options */}
                {isOpen && !disabled && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-100 dark:border-surface-700 max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200">
                        {displayOptions.length > 0 ? (
                            <ul className="py-1">
                                {displayOptions.map((option) => (
                                    <li
                                        key={option.value}
                                        onClick={() => handleSelect(option)}
                                        className={clsx(
                                            'px-4 py-2.5 cursor-pointer hover:bg-surface-50 dark:bg-surface-800 transition-colors',
                                            option.value === value && 'bg-primary-50 text-primary-700 font-medium'
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm">{option.label}</span>
                                            {option.subLabel && (
                                                <span className="text-xs text-surface-500 dark:text-surface-400">{option.subLabel}</span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-surface-500 dark:text-surface-400">
                                {isLoading ? 'Searching...' : 'No results found'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-red-500">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{helperText}</p>
            )}
        </div>
    );
}
