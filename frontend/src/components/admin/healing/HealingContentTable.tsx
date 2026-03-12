import React, { useState } from 'react';
import { Edit, Trash2, Eye, PlayCircle } from 'lucide-react';
import type { HealingContent } from '../../../services/healingContentService';

interface HealingContentTableProps {
    contents: HealingContent[];
    type: 'quote' | 'video' | 'podcast';
    onEdit: (content: HealingContent) => void;
    onDelete: (content: HealingContent) => void;
    onView: (content: HealingContent) => void;
}

const moodLabels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Neutral',
    4: 'Good',
    5: 'Great'
};

const HealingContentTable: React.FC<HealingContentTableProps> = ({
    contents,
    type,
    onEdit,
    onDelete,
    onView,
}) => {
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

    const getPreview = (content: HealingContent) => {
        switch (type) {
            case 'quote':
                return (
                    <div className="italic text-gray-700">
                        "{content.content ? (content.content.length > 100 ? content.content.substring(0, 100) + '...' : content.content) : ''}"
                    </div>
                );
            case 'podcast':
                if (content.videoUrl) {
                    if (playingVideoId === content._id) {
                        return (
                            <video
                                className="h-20 w-32 object-cover rounded bg-black"
                                src={content.videoUrl}
                                controls
                                autoPlay
                                onEnded={() => setPlayingVideoId(null)}
                            />
                        );
                    }

                    return (
                        <div
                            className="relative h-20 w-32 bg-gray-900 rounded cursor-pointer overflow-hidden group flex items-center justify-center"
                            onClick={() => setPlayingVideoId(content._id)}
                        >
                            {content.thumbnail && (
                                <img src={content.thumbnail} alt="thumbnail" className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            )}
                            <PlayCircle className="text-white z-10 w-8 h-8 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-md" />
                        </div>
                    );
                }
                return <div className="h-20 w-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Video</div>;
            case 'video':
                if (content.videoUrl) {
                    if (playingVideoId === content._id) {
                        return (
                            <video
                                className="h-20 w-32 object-cover rounded bg-black"
                                src={content.videoUrl}
                                controls
                                autoPlay
                                onEnded={() => setPlayingVideoId(null)}
                            />
                        );
                    }

                    return (
                        <div
                            className="relative h-20 w-32 bg-gray-900 rounded cursor-pointer overflow-hidden group flex items-center justify-center"
                            onClick={() => setPlayingVideoId(content._id)}
                        >
                            {content.thumbnail && (
                                <img src={content.thumbnail} alt="thumbnail" className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            )}
                            <PlayCircle className="text-white z-10 w-8 h-8 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-md" />
                        </div>
                    );
                }
                return <div className="h-20 w-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Video</div>;
            default:
                return null;
        }
    };

    if (!contents || contents.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-100 mt-4">
                <p className="text-gray-500">No {type}s found. Add one to get started.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow mt-4">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                            Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mood Level
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                            Preview
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {contents.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                {item.author && <div className="text-xs text-blue-600 font-medium italic">By: {item.author}</div>}
                                {item.type === 'video' && item.metadata?.author && <div className="text-xs text-blue-600 font-medium italic">By: {item.metadata.author}</div>}
                                {item.description && <div className="text-xs text-gray-400 truncate max-w-[200px] mt-1">{item.description}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.moodLevel === 1 ? 'bg-red-100 text-red-800' :
                                    item.moodLevel === 2 ? 'bg-orange-100 text-orange-800' :
                                        item.moodLevel === 3 ? 'bg-gray-100 text-gray-800' :
                                            item.moodLevel === 4 ? 'bg-green-100 text-green-800' :
                                                'bg-teal-100 text-teal-800'
                                    }`}>
                                    {moodLabels[item.moodLevel] || 'Neutral'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {item.is_active === false ? (
                                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                                        Hidden
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 rounded bg-green-50 text-green-600 text-xs font-medium border border-green-200">
                                        Active
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {getPreview(item)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => onView(item)}
                                    className="text-gray-500 hover:text-gray-900 mr-3 inline-flex items-center p-1 rounded hover:bg-gray-100 transition-colors"
                                    title="View Details"
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => onEdit(item)}
                                    className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center p-1 rounded hover:bg-blue-50 transition-colors"
                                    title="Edit"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => onDelete(item)}
                                    className="text-red-600 hover:text-red-900 inline-flex items-center p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default HealingContentTable;
