import React from 'react';
import { X } from 'lucide-react';
import type { HealingContent } from '../../../services/healingContentService';

interface HealingContentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: HealingContent | null;
}

const moodLabels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Neutral',
    4: 'Good',
    5: 'Great'
};

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

                    {/* Author Section */}
                    {(content.author || ((content.type === 'video' || content.type === 'podcast') && content.metadata?.author)) && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Author</h3>
                            <p className="text-gray-700 font-medium italic">
                                {content.author || content.metadata?.author}
                            </p>
                        </div>
                    )}

                    {/* Description Section */}
                    {content.description && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Description</h3>
                            <p className="text-gray-700">{content.description}</p>
                        </div>
                    )}

                    <div className="flex gap-8">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Type</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {content.type}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Mood Level</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${content.moodLevel === 1 ? 'bg-red-100 text-red-800' :
                                content.moodLevel === 2 ? 'bg-orange-100 text-orange-800' :
                                    content.moodLevel === 3 ? 'bg-gray-100 text-gray-800' :
                                        content.moodLevel === 4 ? 'bg-green-100 text-green-800' :
                                            'bg-teal-100 text-teal-800'
                                }`}>
                                {moodLabels[content.moodLevel] || 'Neutral'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Status</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${content.is_active === false ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-green-50 text-green-700 border border-green-200'
                                }`}>
                                {content.is_active === false ? 'Hidden (Draft)' : 'Active (Visible)'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Data / Media</h3>
                        <div className="mt-2 bg-gray-50 rounded-lg p-4 border border-gray-100 flex gap-4">
                            {content.thumbnail && content.type !== 'video' && (
                                <img
                                    src={content.thumbnail}
                                    alt="Thumbnail"
                                    className="w-32 h-32 object-cover rounded-md flex-shrink-0"
                                    onError={(e: any) => e.target.style.display = 'none'}
                                />
                            )}
                            <div className="flex-1 w-full overflow-hidden">
                                {content.type === 'quote' && (
                                    <blockquote className="text-xl italic text-gray-800 border-l-4 border-green-500 pl-4 py-2">
                                        "{content.content}"
                                    </blockquote>
                                )}

                                {content.type === 'podcast' && content.videoUrl && (
                                    <div className="rounded-lg overflow-hidden bg-black flex justify-center">
                                        <video
                                            src={content.videoUrl}
                                            controls
                                            className="w-full max-h-[500px]"
                                            poster={content.thumbnail}
                                        />
                                    </div>
                                )}

                                {content.type === 'podcast' && !content.videoUrl && (
                                    <p className="text-gray-500 italic">No podcast video file available.</p>
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
        </div>
    );
};

export default HealingContentDetailModal;
