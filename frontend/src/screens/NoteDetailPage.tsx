"use client";
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Download, Star, MessageCircle, Bookmark, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      const { data } = await api.get(`/notes/${id}`);
      return data.data;
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/notes/${id}/download`);
      return data.data;
    },
    onSuccess: (data) => {
      window.open(data.fileUrl, '_blank');
      queryClient.invalidateQueries({ queryKey: ['note', id] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/notes/${id}/bookmark`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      toast.success(note?.isBookmarked ? 'Bookmark removed' : 'Note bookmarked!');
    },
  });

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      const { data } = await api.post(`/notes/${id}/rate`, { rating });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      toast.success('Rating submitted!');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="bg-white rounded-2xl p-6">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Note Details</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{note.title}</h2>
            <p className="text-sm text-gray-500">
              {note.course} · Level {note.level} · {note.fileType}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              by {note.uploader.fullName} · {note.createdAt}
            </p>
          </div>
        </div>

        {note.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">{note.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {note.tags.map((tag: string, i: number) => (
            <span key={i} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" /> {note._count.downloads} downloads
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4" /> {note.averageRating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" /> {note._count.comments}
          </span>
        </div>

        {/* Dynamic Note Preview */}
        {(() => {
          if (!note.fileUrl) return null;

          const absoluteUrl = note.fileUrl.startsWith('http')
            ? note.fileUrl
            : `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'}${note.fileUrl}`;

          if (note.fileType === 'PDF') {
            return (
              <div className="mb-6">
                <h3 className="font-semibold mb-2 flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                  <FileText className="w-4 h-4 text-blue-600" /> Note Preview
                </h3>
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 h-[600px] shadow-inner">
                  <iframe
                    src={`${absoluteUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full"
                    title={note.title}
                  />
                </div>
              </div>
            );
          }

          if (['DOCX', 'PPT'].includes(note.fileType)) {
            return (
              <div className="mb-6">
                <h3 className="font-semibold mb-2 flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                  <FileText className="w-4 h-4 text-blue-600" /> Document Preview
                </h3>
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 h-[600px] shadow-inner">
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(absoluteUrl)}&embedded=true`}
                    className="w-full h-full border-0"
                    title={note.title}
                  />
                </div>
              </div>
            );
          }

          return null;
        })()}

        {/* Rating */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Rate this note</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => rateMutation.mutate(star)}
                className="text-2xl hover:scale-110 transition"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= note.averageRating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => bookmarkMutation.mutate()}
          >
            <Bookmark className={`w-4 h-4 mr-2 ${note.isBookmarked ? 'fill-current' : ''}`} />
            {note.isBookmarked ? 'Saved' : 'Save'}
          </Button>
          <Button
            className="flex-1"
            onClick={() => downloadMutation.mutate()}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
