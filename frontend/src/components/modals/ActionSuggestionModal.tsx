import React, { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { aiApi } from '../../api/aiApi';
import { useActionSuggestionStore } from '../../store/actionSuggestionStore';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import type { Action } from '../../types/action';

const ActionSuggestionModal: React.FC = () => {
  const { user } = useAuth();
  const {
    isOpen,
    mood,
    actions,
    excludeIds,
    loading,
    error,
    closeModal,
    setActions,
    setLoading,
    setError,
    addExcludeIds,
  } = useActionSuggestionStore();

  useEffect(() => {
    if (isOpen && mood && user) {
      fetchActions();
    }
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

  const handleActionClick = async (action: Action) => {
    if (!user) return;
    try {
      await aiApi.logActionCompletion(user.id, action.id, 0, mood || undefined, 'suggestion');
      toast.success(`Starting: ${action.title}`);
      closeModal();
    } catch (err) {
      toast.error('Failed to log action');
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
          <div className="fixed inset-0 bg-black/25" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between text-lg font-medium leading-6 text-gray-900"
                >
                  <span>🌱 Quick Suggestions for You</span>
                  <button
                    onClick={closeModal}
                    className="rounded-full p-1 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Based on your current mood, these short exercises might help you find balance.
                  </p>
                </div>

                {loading && (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md my-3">
                    {error}
                  </div>
                )}

                {!loading && !error && actions.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {actions.map((action) => (
                      <div
                        key={action.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary cursor-pointer transition"
                        onClick={() => handleActionClick(action)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {action.duration_seconds} sec
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs capitalize bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {action.type}
                          </span>
                          <span className="text-xs capitalize bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {action.difficulty === 'easy' ? 'Easy' : action.difficulty === 'medium' ? 'Medium' : 'Hard'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!loading && !error && actions.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    No suggestions available at the moment.
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="flex-1"
                  >
                    Skip
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShowMore}
                    className="flex-1"
                    disabled={loading || actions.length === 0}
                  >
                    More Options
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ActionSuggestionModal;