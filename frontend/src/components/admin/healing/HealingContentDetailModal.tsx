import React from 'react';
import { X } from 'lucide-react';
import type { HealingContent } from '../../../services/healingContentService';

interface HealingContentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: HealingContent | null;
}

const HealingContentDetailModal: React.FC<HealingContentDetailModalProps> = ({ isOpen, onClose, content }) => {
    if (!isOpen || !content) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800">Content Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Title</h3>
                        <p className="text-lg font-medium text-gray-900">{content.title}</p>
                    </div>

                    {content.description && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Description</h3>
                            <p className="text-gray-700">{content.description}</p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Type</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {content.type}
                        </span>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Data / Media</h3>
                        <div className="mt-2 bg-gray-50 rounded-lg p-4 border border-gray-100">
                            {content.type === 'quote' && (
                                <blockquote className="text-xl italic text-gray-800 border-l-4 border-green-500 pl-4 py-2">
                                    "{content.content}"
                                </blockquote>
                            )}

                            {content.type === 'article' && (
                                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {content.content?.trim().startsWith('http') ? (
                                        <div className="flex flex-col gap-3">
                                            <a href={content.content.trim()} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all inline-flex items-center gap-1">
                                                {content.content.trim()}
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                            </a>
                                            <iframe
                                                src={content.content.trim()}
                                                className="w-full h-[600px] border border-gray-200 rounded-lg bg-white shadow-inner"
                                                title={content.title}
                                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                            />
                                        </div>
                                    ) : (
                                        content.content
                                    )}
                                </div>
                            )}

                            {content.type === 'video' && content.videoUrl && (
                                <div className="rounded-lg overflow-hidden bg-black flex justify-center">
                                    <video
                                        src={content.videoUrl}
                                        controls
                                        className="w-full max-h-[500px]"
                                        poster={content.thumbnail}
                                    />
                                </div>
                            )}

                            {content.type === 'video' && !content.videoUrl && (
                                <p className="text-gray-500 italic">No video file available.</p>
                            )}
                        </div>
                    </div>

                    <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
                        Created on: {new Date(content.createdAt).toLocaleString()}
                        <br />
                        Last updated: {new Date(content.updatedAt).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealingContentDetailModal;
