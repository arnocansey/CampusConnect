import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useState, useEffect } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Image as ImageIcon, Type, Sparkles, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Story {
  id: string;
  imageUrl?: string;
  backgroundColor?: string;
  content?: string;
  expiresAt: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
  isViewed: boolean;
  _count: { views: number };
}

const PREMIUM_GRADIENTS = [
  { name: 'Sunset Glow', value: 'bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600' },
  { name: 'Ocean Breeze', value: 'bg-gradient-to-tr from-cyan-500 to-blue-600' },
  { name: 'Neon Dream', value: 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-700' },
  { name: 'Emerald Garden', value: 'bg-gradient-to-tr from-emerald-400 to-teal-700' },
  { name: 'Midnight Mist', value: 'bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950' },
  { name: 'Sweet Bubblegum', value: 'bg-gradient-to-tr from-pink-400 to-rose-600' },
  { name: 'Cosmic Dust', value: 'bg-gradient-to-tr from-violet-600 via-purple-500 to-orange-400' }
];

export function StoryTray() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<'photo' | 'text'>('photo');
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(PREMIUM_GRADIENTS[0].value);
  const [captionContent, setCaptionContent] = useState('');
  const [storyFile, setStoryFile] = useState<File | null>(null);

  // Viewer State
  const [viewingStoryList, setViewingStoryList] = useState<Story[] | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(0);

  const { data: stories } = useQuery<Story[]>({
    queryKey: ['stories'],
    queryFn: async () => {
      const { data } = await api.get('/stories');
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      setShowCreate(false);
      setStoryFile(null);
      setTextContent('');
      setCaptionContent('');
      toast.success('Story posted successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to post story');
    }
  });

  const viewMutation = useMutation({
    mutationFn: async (storyId: string) => {
      await api.post(`/stories/${storyId}/view`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    }
  });

  const handleCreate = () => {
    const formData = new FormData();
    if (createType === 'photo') {
      if (!storyFile) {
        toast.error('Please select an image file first');
        return;
      }
      formData.append('image', storyFile);
      if (captionContent.trim()) {
        formData.append('content', captionContent);
      }
    } else {
      if (!textContent.trim()) {
        toast.error('Please type some text for your story');
        return;
      }
      formData.append('content', textContent);
      formData.append('backgroundColor', selectedGradient);
    }
    createMutation.mutate(formData);
  };

  const handleViewStoryList = (authorId: string) => {
    if (!stories) return;
    const authorStories = stories.filter((s) => s.author.id === authorId);
    if (authorStories.length === 0) return;
    
    // Sort stories oldest to newest so they play in order
    const sortedStories = [...authorStories].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    setViewingStoryList(sortedStories);
    setCurrentStoryIndex(0);
    viewMutation.mutate(sortedStories[0].id);
  };

  const handleNextStory = () => {
    if (!viewingStoryList) return;
    if (currentStoryIndex < viewingStoryList.length - 1) {
      const nextIdx = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIdx);
      viewMutation.mutate(viewingStoryList[nextIdx].id);
    } else {
      setViewingStoryList(null);
    }
  };

  const handlePrevStory = () => {
    if (!viewingStoryList) return;
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  // Auto-play timer
  useEffect(() => {
    if (!viewingStoryList) return;
    const timer = setTimeout(() => {
      handleNextStory();
    }, 5000); // 5 seconds per story

    return () => clearTimeout(timer);
  }, [viewingStoryList, currentStoryIndex]);

  // Group stories by author for tray listing
  const groupedStories = stories?.reduce((acc: Record<string, Story[]>, story: Story) => {
    const key = story.author.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(story);
    return acc;
  }, {}) || {};

  const currentStory = viewingStoryList?.[currentStoryIndex];

  return (
    <>
      <style>{`
        @keyframes storyProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .story-progress-active {
          animation: storyProgress 5s linear forwards;
        }
      `}</style>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {/* Create Story Button */}
          <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
            <div className="story-ring rounded-full p-[2px]">
              <div
                className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-white dark:border-gray-900 cursor-pointer hover:scale-105 transition"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Add Story</span>
          </div>

          {/* Grouped Author Stories */}
          {Object.entries(groupedStories).map(([authorId, authorStories]) => {
            const lastStory = authorStories[authorStories.length - 1];
            const isAllViewed = authorStories.every((s) => s.isViewed);

            return (
              <div
                key={authorId}
                className="flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer group"
                onClick={() => handleViewStoryList(authorId)}
              >
                <div className={`rounded-full p-[2px] transition group-hover:scale-105 ${isAllViewed ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500'}`}>
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-white dark:border-gray-900 overflow-hidden">
                    {lastStory.author.profilePicture ? (
                      <img src={lastStory.author.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {lastStory.author.fullName?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[70px]">
                  {lastStory.author.fullName?.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Story Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>

            <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Create Story
            </h3>

            {/* Toggle Modes */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
              <button
                onClick={() => setCreateType('photo')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  createType === 'photo'
                    ? 'bg-white dark:bg-gray-750 text-blue-600 shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Photo Story
              </button>
              <button
                onClick={() => setCreateType('text')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  createType === 'text'
                    ? 'bg-white dark:bg-gray-750 text-blue-600 shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Type className="w-4 h-4" />
                Text Story
              </button>
            </div>

            {/* Photo Story Creator */}
            {createType === 'photo' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center bg-gray-50 dark:bg-gray-850 hover:bg-gray-100/50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="story-upload"
                    onChange={(e) => setStoryFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="story-upload" className="cursor-pointer block">
                    {storyFile ? (
                      <div className="relative group">
                        <img src={URL.createObjectURL(storyFile)} alt="" className="w-full h-52 object-cover rounded-xl shadow-md" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center text-white font-semibold">
                          Change Photo
                        </div>
                      </div>
                    ) : (
                      <div className="py-8">
                        <Plus className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload an image</p>
                        <p className="text-xs text-gray-500 mt-1">Supports JPEG, PNG, GIF, WebP</p>
                      </div>
                    )}
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 mb-1">Add Caption (Optional)</label>
                  <input
                    type="text"
                    placeholder="Write a caption..."
                    value={captionContent}
                    onChange={(e) => setCaptionContent(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Text Story Creator */}
            {createType === 'text' && (
              <div className="space-y-4">
                <div className={`w-full h-52 rounded-2xl flex items-center justify-center p-6 text-center text-white relative shadow-inner overflow-hidden ${selectedGradient}`}>
                  <textarea
                    placeholder="Type your story here..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="bg-transparent text-xl font-bold leading-relaxed text-center text-white placeholder-white/60 resize-none w-full h-full max-h-36 focus:outline-none scrollbar-none"
                    maxLength={150}
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-white/70">
                    {textContent.length}/150
                  </span>
                </div>

                {/* Gradient Picker */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 mb-2">Select Background Style</label>
                  <div className="flex flex-wrap gap-2.5">
                    {PREMIUM_GRADIENTS.map((grad, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedGradient(grad.value)}
                        title={grad.name}
                        className={`w-9 h-9 rounded-full transition-transform active:scale-95 ${grad.value} ${
                          selectedGradient === grad.value ? 'ring-4 ring-blue-500 scale-110' : 'ring-2 ring-transparent hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || (createType === 'photo' ? !storyFile : !textContent.trim())}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? 'Posting...' : 'Share to Story'}
            </button>
          </div>
        </div>
      )}

      {/* View Story Modal */}
      {viewingStoryList && currentStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
          {/* Header Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white/80">
                {currentStory.author.profilePicture ? (
                  <img src={currentStory.author.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  currentStory.author.fullName?.charAt(0)
                )}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{currentStory.author.fullName}</p>
                <p className="text-xs text-white/70 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {currentStory._count.views} views
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewingStoryList(null)}
              className="p-2 text-white hover:bg-white/20 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Previous/Next Navigation Zones (for Tapping/Clicking) */}
          <div className="absolute inset-0 flex select-none">
            <div
              className="w-[35%] h-full cursor-pointer z-10"
              onClick={handlePrevStory}
              title="Previous Story"
            />
            <div
              className="w-[65%] h-full cursor-pointer z-10"
              onClick={handleNextStory}
              title="Next Story"
            />
          </div>

          {/* Desktop Arrow Controls */}
          <div className="absolute left-6 z-20 hidden md:block">
            <button
              onClick={handlePrevStory}
              disabled={currentStoryIndex === 0}
              className="p-3 bg-white/10 hover:bg-white/25 disabled:opacity-30 disabled:pointer-events-none text-white rounded-full transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute right-6 z-20 hidden md:block">
            <button
              onClick={handleNextStory}
              className="p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Main Story Card */}
          <div className="relative max-w-[420px] w-full aspect-[9/16] mx-4 rounded-3xl overflow-hidden shadow-2xl bg-gray-950 flex flex-col justify-center border border-white/10 z-20">
            {/* Progress Indicators */}
            <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
              {viewingStoryList.map((story, index) => (
                <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-white transition-all rounded-full ${
                      index < currentStoryIndex
                        ? 'w-full'
                        : index === currentStoryIndex
                        ? 'story-progress-active'
                        : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Story Content Rendering */}
            {currentStory.imageUrl ? (
              <div className="w-full h-full relative flex items-center bg-gray-950">
                <img
                  src={currentStory.imageUrl}
                  alt=""
                  className="w-full h-full object-contain"
                />
                {currentStory.content && (
                  <div className="absolute bottom-12 left-4 right-4 bg-black/60 backdrop-blur-md text-white p-4 rounded-2xl text-center text-sm border border-white/10 shadow-lg">
                    {currentStory.content}
                  </div>
                )}
              </div>
            ) : (
              <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center text-white ${currentStory.backgroundColor || 'bg-gradient-to-tr from-purple-600 to-blue-500'}`}>
                <p className="text-2xl font-bold leading-relaxed tracking-wide drop-shadow-md break-words max-w-full">
                  {currentStory.content}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
