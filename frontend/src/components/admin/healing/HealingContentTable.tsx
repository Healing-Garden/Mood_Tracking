import React, { useState } from 'react';
import { Edit, Trash2, Eye, PlayCircle } from 'lucide-react';
import type { HealingContent } from '../../../services/healingContentService';

interface HealingContentTableProps {
    contents: HealingContent[];
    type: 'quote' | 'video' | 'article';
    onEdit: (content: HealingContent) => void;
    onDelete: (content: HealingContent) => void;
    onView: (content: HealingContent) => void;
}

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
            case 'article':
                const isLink = content.content?.trim().startsWith('http');
                return (
                    <div className="text-gray-600 text-sm flex items-center gap-2">
                        {isLink ? (
                            <>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs border border-blue-100 font-medium">Link</span>
                                <span className="truncate max-w-[300px] text-blue-500 hover:underline cursor-pointer" onClick={() => onView(content)}>
                                    {content.content?.trim()}
                                </span>
                            </>
                        ) : (
                            <span>{content.content ? (content.content.length > 150 ? content.content.substring(0, 150) + '...' : content.content) : ''}</span>
                        )}
                    </div>
                );
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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/4">
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
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                {item.description && <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</div>}
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
