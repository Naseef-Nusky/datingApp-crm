import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaUser, FaMapMarkerAlt, FaHeart, FaEye, FaEdit } from 'react-icons/fa';

const Profiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [filter, setFilter] = useState('all'); // all, verified, unverified, active, inactive

  useEffect(() => {
    fetchProfiles();
  }, [filter]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/profiles?filter=${filter}`);
      setProfiles(response.data.profiles || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (userId) => {
    try {
      const response = await axios.get(`/api/admin/profiles/${userId}`);
      setSelectedProfile(response.data.profile);
    } catch (error) {
      console.error('Error fetching profile details:', error);
      alert('Failed to load profile details');
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.firstName?.toLowerCase().includes(searchLower) ||
      profile.lastName?.toLowerCase().includes(searchLower) ||
      profile.user?.email?.toLowerCase().includes(searchLower) ||
      profile.bio?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile List */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">User Profiles</h2>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
            >
              <option value="all">All Profiles</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="relative mb-6">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search profiles by name, email, or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-admin-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {profile.photos?.[0]?.url ? (
                    <img
                      src={profile.photos[0].url}
                      alt={profile.firstName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <FaUser className="text-gray-600 text-xl" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{profile.age} years old</p>
                  <p className="text-sm text-gray-500 truncate">{profile.user?.email}</p>
                  {profile.location && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <FaMapMarkerAlt className="mr-1" />
                      <span>
                        {profile.location.city}, {profile.location.country}
                      </span>
                    </div>
                  )}
                  {profile.bio && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{profile.bio}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <FaEye className="mr-1" />
                        {profile.profileViews || 0}
                      </span>
                      <span className="flex items-center">
                        <FaHeart className="mr-1" />
                        {profile.matches?.length || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewProfile(profile.userId)}
                      className="px-3 py-1 bg-gradient-nex text-white text-sm rounded hover:opacity-90 transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No profiles found matching your search.
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-gray-800">
                Profile Details
              </h3>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Photos */}
                <div className="md:w-1/3">
                  <div className="space-y-4">
                    {selectedProfile.photos && selectedProfile.photos.length > 0 ? (
                      selectedProfile.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full rounded-lg object-cover"
                        />
                      ))
                    ) : (
                      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FaUser className="text-gray-400 text-4xl" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Information */}
                <div className="md:w-2/3 space-y-6">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">
                      {selectedProfile.firstName} {selectedProfile.lastName}
                    </h4>
                    <p className="text-gray-600">{selectedProfile.age} years old</p>
                    <p className="text-gray-600">{selectedProfile.gender}</p>
                  </div>

                  {selectedProfile.bio && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">Bio</h5>
                      <p className="text-gray-600">{selectedProfile.bio}</p>
                    </div>
                  )}

                  {selectedProfile.location && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">Location</h5>
                      <p className="text-gray-600">
                        {selectedProfile.location.city}, {selectedProfile.location.country}
                      </p>
                    </div>
                  )}

                  {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">Interests</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProfile.lifestyle && (
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">Lifestyle</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {selectedProfile.lifestyle.work && (
                          <div>
                            <span className="text-gray-500">Work:</span>{' '}
                            <span className="text-gray-800">{selectedProfile.lifestyle.work}</span>
                          </div>
                        )}
                        {selectedProfile.lifestyle.education && (
                          <div>
                            <span className="text-gray-500">Education:</span>{' '}
                            <span className="text-gray-800">
                              {selectedProfile.lifestyle.education}
                            </span>
                          </div>
                        )}
                        {selectedProfile.lifestyle.height && (
                          <div>
                            <span className="text-gray-500">Height:</span>{' '}
                            <span className="text-gray-800">{selectedProfile.lifestyle.height}</span>
                          </div>
                        )}
                        {selectedProfile.lifestyle.bodyType && (
                          <div>
                            <span className="text-gray-500">Body Type:</span>{' '}
                            <span className="text-gray-800">
                              {selectedProfile.lifestyle.bodyType}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold bg-gradient-nex bg-clip-text text-transparent">
                          {selectedProfile.profileViews || 0}
                        </p>
                        <p className="text-sm text-gray-500">Profile Views</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold bg-gradient-nex bg-clip-text text-transparent">
                          {selectedProfile.matches?.length || 0}
                        </p>
                        <p className="text-sm text-gray-500">Matches</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold bg-gradient-nex bg-clip-text text-transparent">
                          {selectedProfile.user?.credits || 0}
                        </p>
                        <p className="text-sm text-gray-500">Credits</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profiles;
