import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Eye, Edit3, Bold, Italic, List, Link as LinkIcon, Code } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
    autoFocus?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, minHeight = "200px", autoFocus }) => {
    const [mode, setMode] = useState<'write' | 'preview'>('write');

    const insertInitial = (syntax: string) => {
        onChange(value + syntax);
    };

    return (
        <div className="border border-gray-200 dark:border-surface-700 rounded-xl overflow-hidden bg-white dark:bg-surface-800 transition-colors">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800/50">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setMode('write')}
                        className={`p-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${mode === 'write' ? 'bg-white dark:bg-surface-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-surface-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <Edit3 className="w-4 h-4" />
                        Write
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('preview')}
                        className={`p-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${mode === 'preview' ? 'bg-white dark:bg-surface-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-surface-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <Eye className="w-4 h-4" />
                        Preview
                    </button>
                </div>

                {mode === 'write' && (
                    <div className="flex items-center gap-1 border-l border-gray-200 dark:border-surface-700 pl-2 ml-2">
                        <button type="button" onClick={() => insertInitial('**bold**')} className="p-1.5 text-gray-500 dark:text-surface-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-surface-700 transition-colors" title="Bold">
                            <Bold className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertInitial('*italic*')} className="p-1.5 text-gray-500 dark:text-surface-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-surface-700 transition-colors" title="Italic">
                            <Italic className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertInitial('\n- list item')} className="p-1.5 text-gray-500 dark:text-surface-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-surface-700 transition-colors" title="List">
                            <List className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertInitial('[text](url)')} className="p-1.5 text-gray-500 dark:text-surface-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-surface-700 transition-colors" title="Link">
                            <LinkIcon className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertInitial('`code`')} className="p-1.5 text-gray-500 dark:text-surface-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-surface-700 transition-colors" title="Code">
                            <Code className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Editor/Preview Area */}
            <div className="relative">
                {mode === 'write' ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        autoFocus={autoFocus}
                        className="w-full p-4 bg-transparent outline-none resize-y min-h-[200px] text-gray-900 dark:text-surface-100 font-mono text-sm"
                        style={{ minHeight }}
                    />
                ) : (
                    <div className="prose dark:prose-invert max-w-none p-4 overflow-y-auto" style={{ minHeight }}>
                        {value ? <ReactMarkdown>{value}</ReactMarkdown> : <span className="text-gray-400 dark:text-surface-400 italic">Nothing to preview</span>}
                    </div>
                )}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 dark:border-surface-700 bg-gray-50 dark:bg-surface-800/30 text-xs text-gray-400 dark:text-surface-400 flex justify-between">
                <span>Markdown supported</span>
                <span>{value.length} characters</span>
            </div>
        </div>
    );
};

export default RichTextEditor;
