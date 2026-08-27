import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Lock, FileText, Shield } from 'lucide-react';
import DocumentList from '../../components/vault/DocumentList';
import CredentialManager from '../../components/vault/CredentialManager';
import { vaultApi } from '../../api/vault';
import { Document, Credential, DocumentCategory } from '../../types/vault';

const VaultPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'documents' | 'credentials'>('documents');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Upload state
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(DocumentCategory.OTHER);
    const [uploadDescription, setUploadDescription] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [docs, creds] = await Promise.all([
                vaultApi.getDocuments(),
                vaultApi.getCredentials()
            ]);
            setDocuments(docs);
            setCredentials(creds);
        } catch (error) {
            console.error('Failed to fetch vault data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;

        setIsUploading(true);
        try {
            await vaultApi.uploadDocument(uploadFile, uploadCategory, uploadDescription);
            await fetchData(); // Refresh list
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadDescription('');
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (id: number) => {
        if (confirm('Are you sure you want to delete this document?')) {
            try {
                await vaultApi.deleteDocument(id);
                setDocuments(docs => docs.filter(d => d.id !== id));
            } catch (error) {
                console.error('Delete failed', error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-900/50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="p-2 bg-primary-600/10 rounded-lg text-primary-600">
                                <Shield className="w-8 h-8" />
                            </span>
                            Document Vault
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                            Securely store and manage your academic documents, credentials, and application materials in one place.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-surface-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-surface-900/50 flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Storage Used:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{documents.length} Files</span>
                        </div>
                        {activeTab === 'documents' && (
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-600/90 transition-all shadow-sm dark:shadow-surface-900/50 hover:shadow-md"
                            >
                                <UploadCloud className="w-5 h-5" />
                                Upload Document
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'documents'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Documents
                    </button>
                    <button
                        onClick={() => setActiveTab('credentials')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'credentials'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        <Lock className="w-4 h-4" />
                        Credentials & Portals
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-[500px]">
                    {activeTab === 'documents' ? (
                        <DocumentList
                            documents={documents}
                            onDelete={handleDeleteDocument}
                            isLoading={isLoading}
                        />
                    ) : (
                        <CredentialManager
                            credentials={credentials}
                            onUpdate={fetchData}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl max-w-lg w-full p-6"
                    >
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload Document</h3>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:bg-surface-900 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    required
                                />
                                <div className="space-y-2">
                                    <UploadCloud className="w-10 h-10 text-gray-400 mx-auto" />
                                    {uploadFile ? (
                                        <p className="text-primary-600 font-medium">{uploadFile.name}</p>
                                    ) : (
                                        <>
                                            <p className="text-gray-600 dark:text-gray-400 font-medium">Click to browse or drag file here</p>
                                            <p className="text-xs text-gray-400">PDF, JPG, PNG up to 10MB</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-primary-600 focus:border-primary-600"
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                                >
                                    {Object.values(DocumentCategory).map(cat => (
                                        <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-primary-600 focus:border-primary-600"
                                    placeholder="e.g. Fall 2025 Application"
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!uploadFile || isUploading}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-600/90 transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : 'Upload File'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default VaultPage;
