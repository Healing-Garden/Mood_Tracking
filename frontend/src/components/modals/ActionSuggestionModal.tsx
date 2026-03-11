import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, Clock, BookOpen, Quote, Video, FileText, ArrowLeft, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { aiApi } from '../../api/aiApi';
import { useActionSuggestionStore } from '../../store/actionSuggestionStore';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import type { Action } from '../../types/action';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'quote': return <Quote className="h-4 w-4" />;
    case 'video': return <Video className="h-4 w-4" />;
    case 'article': return <FileText className="h-4 w-4" />;
    default: return <BookOpen className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'quote': return 'Quote';
    case 'video': return 'Video';
    case 'article': return 'Article';
    default: return type;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'quote': return 'bg-purple-100 text-purple-700';
    case 'video': return 'bg-blue-100 text-blue-700';
    case 'article': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return null;
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
};

const ActionSuggestionModal: React.FC = () => {
  const { user } = useAuth();
  const {
    isOpen,
    mood,
    actions,
    selectedAction,
    excludeIds,
    loading,
    error,
    closeModal,
    setActions,
    setLoading,
    setError,
    addExcludeIds,
    setSelectedAction,
  } = useActionSuggestionStore();

  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && mood && user && !selectedAction) {
      fetchActions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mood, user, excludeIds]);

  const fetchActions = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await aiApi.suggestActions(user.id, mood, 3, excludeIds);
      const actionsData = response.data?.data?.actions || response.data?.actions || [];
      setActions(actionsData);
    } catch (err: any) {
      setError(err.message || 'Unable to load suggestions');
      toast.error('Unable to load suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActionSelect = (action: Action) => {
    setSelectedAction(action);
    setStartTime(Date.now());
    toast.success(`Starting: ${action.title}`);
  };

  const handleCompleteAction = async () => {
    if (!user || !selectedAction) return;
    
    const durationSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    
    try {
      setLoading(true);
      await aiApi.logActionCompletion(
        user.id, 
        selectedAction.id, 
        durationSeconds, 
        mood || undefined, 
        'suggestion'
      );
      toast.success('Well done! Mood improved.');
      closeModal();
    } catch (err) {
      toast.error('Failed to log completion');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user || !mood) return;
    try {
      await aiApi.logSkip(user.id, mood, actions.map(a => a.id), 'user_skipped');
      toast('Suggestions skipped');
    } catch (err) {
      console.error('Error logging skip:', err);
    } finally {
      closeModal();
    }
  };

  const handleShowMore = () => {
    const currentIds = actions.map(a => a.id);
    addExcludeIds(currentIds);
  };

  const renderExecutionView = (action: Action) => {
    const isVideo = action.type === 'video' && action.video_url;
    
    return (
      <div className="space-y-4">
        {/* Title and Category */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(action.type)}`}>
               {getTypeIcon(action.type)}
               {getTypeLabel(action.type)}
             </span>
          </div>
          {formatDuration(action.duration_seconds) && (
            <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
              <Clock className="h-3 w-3" />
              Est. {formatDuration(action.duration_seconds)}
            </span>
          )}
        </div>

        <h2 className="text-xl font-bold text-gray-900 leading-tight">
          {action.title}
        </h2>

        {/* Video Player */}
        {isVideo ? (
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
            <iframe
              src={action.video_url?.replace('watch?v=', 'embed/').replace('cloudinary.com', 'cloudinary.com')}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media"
              title={action.title}
            ></iframe>
          </div>
        ) : action.thumbnail && (
          <div className="rounded-xl overflow-hidden h-48 bg-gray-100 shadow-sm border border-gray-100">
            <img src={action.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content/Description */}
        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 max-h-[40vh] overflow-y-auto custom-scrollbar">
           {action.type === 'quote' ? (
             <blockquote className="italic text-gray-800 text-lg leading-relaxed text-center py-4">
               {action.description}
             </blockquote>
           ) : (
             <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
               {action.content || action.description}
             </div>
           )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 flex items-center justify-between gap-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedAction(null)} 
            className="flex-1 border-gray-200"
            disabled={loading}
          >
            Back to List
          </Button>
          <Button 
            onClick={handleCompleteAction} 
            className="flex-[2] bg-primary text-white hover:bg-primary/90 shadow-md flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            I've Finished
          </Button>
        </div>
      </div>
    );
  };

  const moodLabel = mood
    ? mood.charAt(0).toUpperCase() + mood.slice(1)
    : '';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full ${selectedAction ? 'max-w-2xl' : 'max-w-md'} transform overflow-hidden rounded-[2rem] bg-white p-8 text-left align-middle shadow-2xl transition-all duration-300`}>
                
                {/* Header (Hidden in Execution View for Focus) */}
                {!selectedAction && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                       <Dialog.Title
                        as="h3"
                        className="text-2xl font-bold leading-6 text-gray-900 flex items-center gap-2"
                      >
                       <span>🌱</span>
                       <span>Mood Boosters</span>
                      </Dialog.Title>
                      <button
                        onClick={closeModal}
                        className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                    <p className="text-gray-500 text-sm mb-6">
                      {moodLabel
                        ? `Feeling "${moodLabel}"? Try these short activities curated for your emotional balance.`
                        : 'Quick exercises and content to help you find balance.'}
                    </p>
                  </>
                )}

                {/* Loading */}
                {loading && !selectedAction && (
                  <div className="flex flex-col justify-center items-center py-12 gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-gray-400 text-sm font-medium animate-pulse">Personalizing suggestions...</p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl my-4 text-sm flex items-start gap-2">
                    <X className="h-4 w-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Action Cards (List View) */}
                {!loading && !error && !selectedAction && actions.length > 0 && (
                  <div className="space-y-4">
                    {actions.map((action) => (
                      <div
                        key={action.id}
                        className="group border border-gray-100 bg-gray-50/50 rounded-2xl p-5 hover:border-primary/50 hover:bg-white hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-300"
                        onClick={() => handleActionSelect(action)}
                      >
                        <div className="flex items-start gap-4">
                           {/* Icon/Thumbnail Circle */}
                           <div className={`p-3 rounded-xl shrink-0 ${getTypeColor(action.type)}`}>
                              {getTypeIcon(action.type)}
                           </div>
                           
                           <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-base">
                                  {action.title}
                                </h4>
                                {formatDuration(action.duration_seconds) && (
                                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                    {formatDuration(action.duration_seconds)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-2 leading-snug">
                                {action.description}
                              </p>
                           </div>
                           
                           {/* Play/Arrow Icon indicator */}
                           <div className="self-center">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                {action.type === 'video' ? <Play className="h-3 w-3 fill-current ml-0.5" /> : <Play className="h-3 w-3 fill-current ml-0.5" />}
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}

                    <div className="mt-8 flex items-center justify-between gap-4">
                      <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="flex-1 py-6 rounded-2xl hover:bg-gray-100"
                      >
                        Maybe later
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShowMore}
                        className="flex-1 py-6 rounded-2xl border-gray-100 flex items-center justify-center gap-2"
                        disabled={loading || actions.length === 0}
                      >
                        <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : 'hidden'}`} />
                        Give me more
                      </Button>
                    </div>
                  </div>
                )}

                {/* Execution View (Detail View) */}
                {selectedAction && renderExecutionView(selectedAction)}

                {/* Empty */}
                {!loading && !error && actions.length === 0 && !selectedAction && (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <BookOpen className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium font-serif italic text-lg">"Rest is resistance."</p>
                    <p className="text-gray-400 text-xs mt-3">Nothing fresh to suggest. Try taking a deep breath.</p>
                  </div>
                )}

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ActionSuggestionModal;