import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaImage, FaVideo, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const ContentModeration = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, flagged, active

  useEffect(() => {
    fetchStories();
  }, [filter]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/stories?filter=${filter}`);
      setStories(response.data.stories || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStory = async (storyId) => {
    try {
      await axios.put(`/api/admin/stories/${storyId}/approve`);
      fetchStories();
    } catch (error) {
      console.error('Error approving story:', error);
      alert('Failed to approve story');
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }
    try {
      await axios.delete(`/api/admin/stories/${storyId}`);
      fetchStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Content Moderation</h2>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
            >
              <option value="all">All Content</option>
              <option value="flagged">Flagged</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <div
              key={story.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-video bg-gray-100">
                {story.mediaType === 'photo' ? (
                  <img
                    src={story.mediaUrl}
                    alt="Story"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                    }}
                  />
                ) : (
                  <video
                    src={story.mediaUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
                <div className="absolute top-2 right-2">
                  {story.mediaType === 'photo' ? (
                    <FaImage className="text-white bg-black bg-opacity-50 p-2 rounded" />
                  ) : (
                    <FaVideo className="text-white bg-black bg-opacity-50 p-2 rounded" />
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">
                    {story.user?.email || 'Unknown User'}
                  </p>
                  <span className="text-xs text-gray-500">
                    {new Date(story.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {story.isFlagged && (
                  <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded mb-2">
                    Flagged
                  </span>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleApproveStory(story.id)}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaCheck />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDeleteStory(story.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No content found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentModeration;
