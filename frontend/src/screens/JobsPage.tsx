"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Job } from '../types';
import { Search, MapPin, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

const jobTypes = ['All', 'Part-time', 'Full-time', 'Internship', 'Freelance'];
const jobTypeOptions = [
  { label: 'Part-Time', value: 'PART_TIME' },
  { label: 'Full-Time', value: 'FULL_TIME' },
  { label: 'Internship', value: 'INTERNSHIP' },
  { label: 'Freelance', value: 'FREELANCE' },
  { label: 'Volunteer', value: 'VOLUNTEER' },
];

export function JobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Modal states
  const [showPostModal, setShowPostModal] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [salary, setSalary] = useState('');
  const [jobType, setJobType] = useState('PART_TIME');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const queryClient = useQueryClient();

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs', searchQuery, selectedType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType !== 'All') {
        params.append('jobType', selectedType.toUpperCase().replace('-', '_'));
      }
      const { data } = await api.get(`/jobs?${params}`);
      return data.data;
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (newJob: any) => {
      const { data } = await api.post('/jobs', newJob);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowPostModal(false);
      setTitle('');
      setCompany('');
      setDescription('');
      setRequirements('');
      setSalary('');
      setJobType('PART_TIME');
      setLocation('');
      setIsRemote(false);
      setDeadline('');
      setApplicationUrl('');
      setContactEmail('');
      toast.success('Job posted successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to post job');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    const reqList = requirements
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    createJobMutation.mutate({
      title,
      company,
      description,
      requirements: reqList,
      salary: salary.trim() || null,
      jobType,
      location: location.trim() || null,
      isRemote,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      applicationUrl: applicationUrl.trim() || null,
      contactEmail: contactEmail.trim() || null,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💼 Jobs & Internships</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Find opportunities near you</p>
        </div>
        <Button size="sm" onClick={() => setShowPostModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Post Job
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-2 mb-4 transition-colors">
        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search jobs, internships..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
        />
      </div>

      {/* Job Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {jobTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition ${
              selectedType === type
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {jobsData?.jobs?.map((job: Job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
                    💼
                  </div>
                  <div>
                    <p className="font-semibold text-sm dark:text-white">{job.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {job.company} · {job.jobType?.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                      {job.isRemote ? (
                        <span>🌐 Remote</span>
                      ) : job.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                      ) : null}
                      {job.salary && <span> · 💰 {job.salary}</span>}
                    </p>
                  </div>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] px-2 py-1 rounded-full font-semibold">
                  New
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {job.requirements?.slice(0, 3).map((req, i) => (
                  <span key={i} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-1 rounded-full">
                    {req}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPostModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-955 dark:text-white mb-4">Post a Job / Internship</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Job Title *</label>
                  <Input
                    type="text"
                    placeholder="e.g. Frontend Intern"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Company *</label>
                  <Input
                    type="text"
                    placeholder="e.g. Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description *</label>
                <textarea
                  placeholder="Describe the role and responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Requirements (one per line)</label>
                <textarea
                  placeholder="React knowledge&#10;TypeScript experience&#10;Good communication skills"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Salary Range</label>
                  <Input
                    type="text"
                    placeholder="e.g. ₦100,000/mo"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Job Type *</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white dark:bg-gray-800 focus:outline-none"
                  >
                    {jobTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Location</label>
                  <Input
                    type="text"
                    placeholder="e.g. Lagos, Nigeria"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isRemote}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Application Deadline</label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRemote"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="isRemote" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
                  Remote Position
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Application URL</label>
                  <Input
                    type="url"
                    placeholder="https://company.com/apply"
                    value={applicationUrl}
                    onChange={(e) => setApplicationUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Contact Email</label>
                  <Input
                    type="email"
                    placeholder="hr@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" type="button" onClick={() => setShowPostModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createJobMutation.isPending}>
                  {createJobMutation.isPending ? 'Posting...' : 'Post Job'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
