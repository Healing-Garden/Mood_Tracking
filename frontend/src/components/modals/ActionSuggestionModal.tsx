import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, Clock, BookOpen, Quote, Video, Headphones, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { aiApi } from '../../api/aiApi';
import { useActionSuggestionStore } from '../../store/actionSuggestionStore';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import type { Action } from '../../types/action';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'quote': return <Quote className="h-4 w-4" />;
    case 'video': return <Video className="h-4 w-4" />;
    case 'podcast': return <Headphones className="h-4 w-4" />;
    default: return <BookOpen className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'quote': return 'Quote';
    case 'video': return 'Video';
    case 'podcast': return 'Podcast';
    default: return type;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'quote': return 'bg-purple-100 text-purple-700';
    case 'video': return 'bg-blue-100 text-blue-700';
    case 'podcast': return 'bg-green-100 text-green-700';
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
  const [phase, setPhase] = useState<'list' | 'execute' | 'celebrate'>('list');
  const [postMoodScore, setPostMoodScore] = useState<number>(3);
  const [completedDuration, setCompletedDuration] = useState<number>(0);
  const hasLoggedOutcomeRef = useRef(false);
  const { width, height } = useWindowSize();

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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle YouTube API messages for auto-completion
      if (typeof event.origin === 'string' && event.origin.includes('youtube.com')) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          // State 0 = ended in YouTube API
          if (data.event === 'onStateChange' && data.info === 0) {
            handleCompleteAction();
          }
        } catch (e) {
          // Ignore non-YouTube/malformed messages
        }
      }
    };

    if (phase === 'execute' && selectedAction) {
      window.addEventListener('message', handleMessage);
    }
    return () => window.removeEventListener('message', handleMessage);
  }, [phase, selectedAction]);

  const handleActionSelect = (action: Action) => {
    setSelectedAction(action);
    setStartTime(Date.now());
    setPhase('execute');
    toast.success(`Starting: ${action.title}`);
  };

  const handleCompleteAction = async () => {
    if (!selectedAction || phase === 'celebrate') return;
    const durationSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    setCompletedDuration(durationSeconds);
    hasLoggedOutcomeRef.current = false;
    setPhase('celebrate');
  };

  const submitCompletionWithoutMood = async () => {
    // User skipped mood update step, still consider the flow completed
    if (!user || !selectedAction) {
      handleClose();
      return;
    }
    if (hasLoggedOutcomeRef.current) {
      handleClose();
      return;
    }
    try {
      setLoading(true);
      hasLoggedOutcomeRef.current = true;
      await aiApi.logActionCompletion(
        user.id,
        selectedAction.id,
        completedDuration,
        mood || undefined,
        'suggestion',
        undefined
      );
      toast.success(`Saved completion for "${selectedAction.title}".`);
    } catch (err) {
      console.error(err);
      // Do not block user if logging fails
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const submitCompletionWithMood = async () => {
    if (!user || !selectedAction) return;
    
    try {
      setLoading(true);
      hasLoggedOutcomeRef.current = true;
      await aiApi.logActionCompletion(
        user.id,
        selectedAction.id,
        completedDuration,
        mood || undefined,
        'suggestion',
        postMoodScore
      );
      toast.success(`Great job! You've completed "${selectedAction.title}".`);
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log completion');
      hasLoggedOutcomeRef.current = false;
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
    const isVideoOrPodcast = (action.type === 'video' || action.type === 'podcast') && action.video_url;
    const isYouTube = action.video_url?.includes('youtube.com') || action.video_url?.includes('youtu.be');
    
    let videoSrc = action.video_url || '';
    if (isYouTube && videoSrc) {
      const videoId = videoSrc.includes('v=') 
        ? videoSrc.split('v=')[1]?.split('&')[0] 
        : videoSrc.split('/').pop();
      videoSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
    }

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

        {/* Media Player */}
        {isVideoOrPodcast ? (
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
            {isYouTube ? (
              <iframe
                src={videoSrc}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
                title={action.title}
              ></iframe>
            ) : (
              <video
                src={videoSrc}
                className="w-full h-full"
                autoPlay
                controls
                onEnded={handleCompleteAction}
              />
            )}
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

  const handleClose = () => {
    // If user closes while in celebrate phase, treat it as completion with mood skipped
    if (phase === 'celebrate' && selectedAction && user && !hasLoggedOutcomeRef.current) {
      // fire-and-forget, do not await UI close
      aiApi
        .logActionCompletion(
          user.id,
          selectedAction.id,
          completedDuration,
          mood || undefined,
          'suggestion',
          undefined
        )
        .catch(() => {});
      hasLoggedOutcomeRef.current = true;
    }
    setSelectedAction(null);
    setStartTime(null);
    setPhase('list');
    setPostMoodScore(3);
    setCompletedDuration(0);
    hasLoggedOutcomeRef.current = false;
    closeModal();
  };

  // If component unmounts during celebrate, also persist completion (mood skipped)
  useEffect(() => {
    return () => {
      if (phase === 'celebrate' && selectedAction && user && !hasLoggedOutcomeRef.current) {
        aiApi
          .logActionCompletion(
            user.id,
            selectedAction.id,
            completedDuration,
            mood || undefined,
            'suggestion',
            undefined
          )
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectedAction, user, completedDuration, mood]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                        onClick={handleClose}
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
                                <span className="text-[10px] tracking-wider font-bold text-gray-400">
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
                {selectedAction && phase === 'execute' && renderExecutionView(selectedAction)}

                {selectedAction && phase === 'celebrate' && (
                  <div className="space-y-6 text-center">
                    <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />
                    <div className="relative py-6">
                      <div className="text-5xl mb-2">🎉</div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Great job! You've completed "{selectedAction.title}"
                      </h2>
                      <p className="text-sm text-gray-500 mt-2">
                        Take a moment to reflect on how you're feeling after completing this activity.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-800">
                        How would you rate your current mood (1–5)?
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-xs text-gray-400">1</span>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={postMoodScore}
                          onChange={(e) => setPostMoodScore(Number(e.target.value))}
                          className="w-56 accent-primary"
                        />
                        <span className="text-xs text-gray-400">5</span>
                      </div>
                      <div className="text-sm font-semibold text-primary">
                        {postMoodScore}/5
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={submitCompletionWithoutMood}
                        className="w-full sm:w-auto"
                        disabled={loading}
                      >
                        Skip this step
                      </Button>
                      <Button
                        onClick={submitCompletionWithMood}
                        className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2"
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Save my reflection
                      </Button>
                    </div>
                  </div>
                )}

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