import React, { useState, useEffect, useRef } from 'react';
import type { HealingContent } from '../../../services/healingContentService';
import { X, PlayCircle } from 'lucide-react';

interface HealingContentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData | Record<string, any>) => Promise<void>;
    initialData?: HealingContent | null;
    type: 'quote' | 'video' | 'article';
    isSubmitting: boolean;
}

const HealingContentFormModal: React.FC<HealingContentFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    type,
    isSubmitting,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [moodLevel, setMoodLevel] = useState<number>(3);
    const [isActive, setIsActive] = useState<boolean>(true);
    const [content, setContent] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [removeVideo, setRemoveVideo] = useState(false);

    // Metadata states for video
    const [durationDisplay, setDurationDisplay] = useState<string>('01:00');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [moodTags, setMoodTags] = useState<string>(''); // comma separated
    const [author, setAuthor] = useState<string>('');
    const [thumbnailUrl, setThumbnailUrl] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setDescription(initialData.description || '');
                setMoodLevel(initialData.moodLevel || 3);
                setIsActive(initialData.is_active !== undefined ? initialData.is_active : true);
                setThumbnailUrl(initialData.thumbnail || '');
                setContent(initialData.content || '');
                setVideoFile(null); // resets file input
                setVideoPreviewUrl(null);
                setRemoveVideo(false);

                if (initialData.type === 'video' && initialData.metadata) {
                    const totalSec = initialData.metadata.duration_seconds || 60;
                    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
                    const s = (totalSec % 60).toString().padStart(2, '0');
                    setDurationDisplay(`${m}:${s}`);
                    setDifficulty(initialData.metadata.difficulty || 'easy');
                    setMoodTags(initialData.metadata.mood_tags?.join(', ') || '');
                    setAuthor(initialData.metadata.author || '');
                } else {
                    setDurationDisplay('01:00');
                    setDifficulty('easy');
                    setMoodTags('');
                    // For quote and article, author is top-level
                    setAuthor(initialData.author || '');
                }
            } else {
                setThumbnailUrl('');
                setDescription('');
                setMoodLevel(3);
                setIsActive(true);
                setContent('');
                setVideoFile(null);
                setVideoPreviewUrl(null);
                setRemoveVideo(false);
                setDurationDisplay('01:00');
                setDifficulty('easy');
                setMoodTags('');
                setAuthor('');
                setThumbnailUrl('');
            }
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (!videoFile) {
            setVideoPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(videoFile);
        setVideoPreviewUrl(objectUrl);

        // Auto-extract duration from local video file
        const videoElement = document.createElement('video');
        videoElement.src = objectUrl;
        videoElement.onloadedmetadata = () => {
            const totalSec = Math.round(videoElement.duration);
            if (!isNaN(totalSec) && totalSec > 0) {
                const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
                const s = (totalSec % 60).toString().padStart(2, '0');
                setDurationDisplay(`${m}:${s}`);
            }
        };

        // free memory whenever this component is unmounted
        return () => URL.revokeObjectURL(objectUrl);
    }, [videoFile]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (type === 'video') {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('type', type);
            formData.append('moodLevel', moodLevel.toString());
            formData.append('is_active', isActive.toString());

            let parsedSec = 60;
            if (durationDisplay.includes(':')) {
                const [min, sec] = durationDisplay.split(':');
                parsedSec = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0);
            } else {
                parsedSec = parseInt(durationDisplay) || 0;
            }

            formData.append('metadata', JSON.stringify({
                duration_seconds: parsedSec,
                difficulty,
                mood_tags: moodTags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                author
            }));

            if (videoFile) {
                formData.append('video', videoFile);
            }
            if (removeVideo && !videoFile) {
                formData.append('removeVideo', 'true');
            }

            await onSubmit(formData);
        } else if (type === 'quote') {
            await onSubmit({
                title,
                author,
                moodLevel,
                is_active: isActive,
                type,
                content,
                thumbnail: thumbnailUrl,
            });
        } else if (type === 'article') {
            await onSubmit({
                title,
                description,
                author,
                moodLevel,
                is_active: isActive,
                type,
                content,
                thumbnail: thumbnailUrl,
            });
        }
    };

    const getTitleForm = () => {
        return initialData ? `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}` : `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800">{getTitleForm()}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    <form id="healing-content-form" onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={`Enter ${type} title`}
                            />
                        </div>

                        {type === 'quote' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Author (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    placeholder="Author name..."
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description..."
                                />
                            </div>
                        )}

                        {type === 'article' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Author (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    placeholder="Author name..."
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL (Optional)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                value={thumbnailUrl}
                                onChange={(e) => setThumbnailUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mood Level *</label>
                            <select
                                required
                                value={moodLevel}
                                onChange={(e) => setMoodLevel(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                            >
                                <option value={1}>1 - Very Low</option>
                                <option value={2}>2 - Low</option>
                                <option value={3}>3 - Neutral</option>
                                <option value={4}>4 - Good</option>
                                <option value={5}>5 - Great</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Status:</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-700">
                                    {isActive ? 'Active (Visible to users)' : 'Hidden (Draft)'}
                                </span>
                            </label>
                        </div>

                        {(type === 'quote' || type === 'article') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {type === 'quote' ? 'Quote Text *' : 'Article Content *'}
                                </label>
                                <textarea
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
                                    rows={type === 'quote' ? 4 : 8}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={type === 'article' ? 'Enter article text, or paste a full URL (http://...) to embed an external page' : `Enter ${type} content...`}
                                />
                            </div>
                        )}

                        {type === 'video' && (
                            <div className="space-y-4">
                                <h3 className="text-md font-medium text-gray-800 border-b border-gray-100 pb-2">Video Metadata & Settings</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mm:ss)</label>
                                        <div className="flex bg-white items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-green-500 pr-3 transition-all">
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-transparent outline-none"
                                                value={durationDisplay}
                                                onChange={(e) => {
                                                    // Allow only numbers and colon
                                                    const val = e.target.value.replace(/[^0-9:]/g, '');
                                                    if (val.length <= 5) {
                                                        setDurationDisplay(val);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    // Auto format to mm:ss on blur
                                                    if (durationDisplay.length > 0 && !durationDisplay.includes(':')) {
                                                        const num = parseInt(durationDisplay);
                                                        if (!isNaN(num)) {
                                                            const m = Math.floor(num / 60).toString().padStart(2, '0');
                                                            const s = (num % 60).toString().padStart(2, '0');
                                                            setDurationDisplay(`${m}:${s}`);
                                                        }
                                                    }
                                                }}
                                                placeholder="01:00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                        <select
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mood Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                            value={moodTags}
                                            onChange={(e) => setMoodTags(e.target.value)}
                                            placeholder="e.g. relaxation, sleep"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Author / Instructor</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                            value={author}
                                            onChange={(e) => setAuthor(e.target.value)}
                                            placeholder="Author name"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Video File {initialData ? '(Leave empty to keep existing)' : '*'}
                                    </label>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        ref={fileInputRef}
                                        required={!initialData || (removeVideo && !videoFile)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setVideoFile(e.target.files[0]);
                                                setRemoveVideo(false);
                                            } else {
                                                setVideoFile(null);
                                            }
                                        }}
                                    />
                                </div>

                                {initialData?.videoUrl && !videoFile && !removeVideo && (
                                    <div className="text-sm text-gray-500 flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <span className="font-medium text-gray-700">Current video:</span>
                                        <a href={initialData.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View File</a>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            type="button"
                                            onClick={() => setRemoveVideo(true)}
                                            className="text-red-500 hover:text-red-700 hover:underline font-medium transition-colors"
                                        >
                                            Remove Video
                                        </button>
                                    </div>
                                )}

                                {removeVideo && !videoFile && (
                                    <div className="text-sm text-amber-700 flex items-center gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                        <span className="font-medium">Video marked for removal.</span>
                                        <button
                                            type="button"
                                            onClick={() => setRemoveVideo(false)}
                                            className="text-blue-600 hover:underline transition-colors"
                                        >
                                            Undo
                                        </button>
                                    </div>
                                )}

                                {(videoPreviewUrl || (initialData?.videoUrl && !removeVideo && !videoFile)) && (
                                    <div className="p-4 bg-gray-900 rounded-xl overflow-hidden shadow-inner relative group">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <PlayCircle size={14} className="text-blue-400" />
                                            {videoPreviewUrl ? 'New Video Preview' : 'Current Video'}
                                        </div>
                                        <div className="rounded-lg overflow-hidden border border-gray-800 bg-black aspect-video flex items-center justify-center">
                                            <video
                                                key={videoPreviewUrl || initialData?.videoUrl}
                                                src={videoPreviewUrl || initialData?.videoUrl}
                                                controls
                                                className="max-h-[240px] w-full"
                                                poster={initialData?.thumbnail}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="healing-content-form"
                        disabled={isSubmitting}
                        className="px-5 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors focus:ring-4 focus:ring-green-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </span>
                        ) : (
                            'Save Content'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HealingContentFormModal;
