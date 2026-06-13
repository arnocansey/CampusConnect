"use client";
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { ArrowLeft, MapPin, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${id}`);
      return data.data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/jobs/${id}/apply`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      toast.success('Application submitted!');
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
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold truncate">Job Details</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl shrink-0">
              💼
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold truncate">{job.title}</h2>
              <p className="text-gray-500 text-sm truncate">{job.company}</p>
            </div>
          </div>
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-semibold shrink-0">
            {job.jobType.replace('_', ' ')}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {job.location}
            </span>
          )}
          {job.isRemote && (
            <span className="flex items-center gap-1">
              🌐 Remote
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1">
              💰 {job.salary}
            </span>
          )}
          {job.deadline && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> Deadline: {new Date(job.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{job.description}</p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Requirements</h3>
          <ul className="space-y-2">
            {job.requirements.map((req: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {job.hasApplied ? (
          <Button className="w-full" variant="secondary" disabled>
            Already Applied
          </Button>
        ) : (
          <Button className="w-full" onClick={() => applyMutation.mutate()}>
            Apply Now
          </Button>
        )}
      </div>
    </div>
  );
}
