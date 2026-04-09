import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import axios from 'axios';
import RegistrationSuccessModal from './RegistrationSuccessModal';

const RegistrationWizard = ({ completeProfileOnly = false, initialProfile = null, onComplete, crmCreateUser = false, onSuccessRedirectTo = '/users' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnToCrm = searchParams.get('returnTo');
  const auth = useAuth();
  const register = auth?.register;
  const [currentStep, setCurrentStep] = useState(completeProfileOnly || crmCreateUser ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '', // CRM only, for validation
    userRole: 'user', // 'user' | 'streamer' | 'admin' (CRM only)
    firstName: '',
    gender: '',
    seeking: '',
    birthday: {
      month: '',
      day: '',
      year: '',
    },
    hometown: '',
    // Step 2: About you details
    bio: '',
    // Step 3: Ideal partner
    idealPartner: '',
    // Step 4: Interests
    interests: [],
    // Step 5: Photo
    photo: null,
  });

  const interests = [
    'Lying on the beach',
    'Camping',
    'Dancing',
    'Fishing & Hunting',
    'Hockey',
    'Music & Concerts',
    'Sailing',
    'Travelling',
    'Biking',
    'Cars',
    'Diving',
    'Games',
    'Movies',
    'Nature',
    'Shopping',
    'Watching TV',
    'Reading books',
    'Cooking',
    'Fashion',
    'Hobbies & Crafts',
    'Museums & Art',
    'Party & Night Clubs',
    'Sports',
    'Meditation & Yoga',
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i);

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Prefill form when completing profile (magic-link signup)
  useEffect(() => {
    if (!completeProfileOnly || !initialProfile) return;
    const loc = initialProfile.location || {};
    const city = loc.city || '';
    const country = loc.country || '';
    const hometown = city && country ? `${city}, ${country}` : (city || country || '');
    const age = initialProfile.age || 18;
    const prefs = initialProfile.preferences || {};
    setFormData(prev => ({
      ...prev,
      firstName: initialProfile.firstName || prev.firstName,
      lastName: initialProfile.lastName != null ? initialProfile.lastName : prev.lastName,
      gender: initialProfile.gender || prev.gender,
      seeking: prefs.lookingFor || prev.seeking,
      birthday: {
        month: prev.birthday.month || '1',
        day: prev.birthday.day || '1',
        year: String(new Date().getFullYear() - age),
      },
      hometown: hometown || prev.hometown,
      bio: initialProfile.bio != null ? initialProfile.bio : prev.bio,
      idealPartner: (prefs.description != null ? prefs.description : prev.idealPartner) || '',
      interests: Array.isArray(initialProfile.interests) ? initialProfile.interests : prev.interests,
    }));
  }, [completeProfileOnly, initialProfile]);

  // Auto-detect city/country for hometown when step 1 is shown
  useEffect(() => {
    if (currentStep !== 1) return;
    const base = import.meta.env.VITE_API_URL || '';
    const url = base ? `${base}/api/auth/location` : '/api/auth/location';
    axios.get(url)
      .then((res) => {
        const { city, country } = res.data || {};
        if (city && country && String(city).trim() && String(country).trim()) {
          const c = String(city).trim();
          const co = String(country).trim();
          if (c !== 'Unknown' && co !== 'Unknown') {
            setFormData((prev) => ({
              ...prev,
              hometown: prev.hometown || `${c}, ${co}`,
            }));
          }
        }
      })
      .catch(() => {});
  }, [currentStep]);

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        photo: e.target.files[0],
      }));
    }
  };

  const calculateAge = () => {
    if (formData.birthday.year && formData.birthday.month && formData.birthday.day) {
      const birthDate = new Date(
        parseInt(formData.birthday.year),
        parseInt(formData.birthday.month) - 1,
        parseInt(formData.birthday.day)
      );
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return null;
  };

  const checkEmailExists = async (email) => {
    if (!email || !email.includes('@')) {
      return false; // Invalid email format, let validation handle it
    }
    
    try {
      setCheckingEmail(true);
      setEmailError('');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/auth/check-email`, { email });
      return response.data.exists;
    } catch (error) {
      console.error('Email check error:', error);
      // If there's an error, don't block the user - let backend handle it during registration
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateStep = async (step) => {
    switch (step) {
      case 0:
        if (!formData.email || !formData.password) {
          setError('Please enter email and password');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        
        // Check if email already exists
        const emailExists = await checkEmailExists(formData.email);
        if (emailExists) {
          setEmailError('This email address is already registered. Please use a different email or log in.');
          return false;
        }
        
        return true;
      case 1:
        if (crmCreateUser) {
          if (!formData.email || !formData.email.includes('@')) {
            setError('Please enter a valid email');
            return false;
          }
          if (formData.password) {
            if (formData.password.length < 6) {
              setError('Password must be at least 6 characters');
              return false;
            }
            if (formData.password !== formData.confirmPassword) {
              setError('Password and confirm password do not match');
              return false;
            }
          }
        }
        if (!formData.firstName || !formData.gender || !formData.seeking) {
          setError('Please fill in all required fields');
          return false;
        }
        if (!formData.birthday.month || !formData.birthday.day || !formData.birthday.year) {
          setError('Please select your birthday');
          return false;
        }
        const age = calculateAge();
        if (age < 18) {
          setError('You must be 18 or older to register');
          return false;
        }
        return true;
      case 2:
        // Bio is optional
        return true;
      case 3:
        // Ideal partner is optional
        return true;
      case 4:
        // Interests are optional
        return true;
      case 5:
        return !!formData.photo;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    setError('');
    setEmailError('');
    const isValid = await validateStep(currentStep);
    if (isValid) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSkip = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      if (crmCreateUser && onSuccessRedirectTo) navigate(onSuccessRedirectTo);
      return;
    }
    if (currentStep === 1 && (completeProfileOnly || crmCreateUser)) {
      if (crmCreateUser && onSuccessRedirectTo) navigate(onSuccessRedirectTo);
      return;
    }
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const age = calculateAge() ?? 18;

      if (crmCreateUser) {
        const email = formData.email.trim();
        const password = (formData.password && formData.password.trim()) ? formData.password.trim() : null;
        const payload = {
          email,
          firstName: formData.firstName.trim(),
          lastName: (formData.lastName || '').trim(),
          age,
          gender: formData.gender || 'male',
          seeking: formData.seeking || 'both',
          hometown: formData.hometown || '',
          bio: formData.bio || '',
          idealPartner: formData.idealPartner || '',
          interests: Array.isArray(formData.interests) ? formData.interests : [],
        };
        if (password) payload.password = password;
        const role = formData.userRole || 'user';
        let response;
        if (role === 'streamer') {
          response = await axios.post('/api/admin/streamers', payload);
        } else if (role === 'admin') {
          const adminPayload = {
            email,
            firstName: formData.firstName.trim(),
            lastName: (formData.lastName || '').trim(),
            role: 'admin',
          };
          if (password) adminPayload.password = password;
          response = await axios.post('/api/admin/admins', adminPayload);
        } else {
          response = await axios.post('/api/admin/users', payload);
        }
        const createdId = response?.data?.user?.id ?? response?.data?.admin?.id ?? response?.data?.streamer?.id;
        if (formData.photo && createdId) {
          const photoFormData = new FormData();
          photoFormData.append('photo', formData.photo);
          try {
            await axios.post(`/api/admin/profiles/${createdId}/photo`, photoFormData);
          } catch (photoErr) {
            console.error('Profile photo upload failed:', photoErr);
            setError(photoErr.response?.data?.message || 'User created but profile photo upload failed.');
            setLoading(false);
            return;
          }
        }
        setRegisteredUser({
          firstName: formData.firstName,
          email: formData.email,
          userRole: role,
        });
        setShowSuccessModal(true);
        return;
      }

      if (completeProfileOnly) {
        const profilePayload = {
          firstName: formData.firstName,
          lastName: formData.lastName || '',
          age: age,
          gender: formData.gender,
          bio: formData.bio || null,
          preferences: {
            lookingFor: formData.seeking,
            description: formData.idealPartner || '',
          },
          interests: formData.interests,
          location: {
            city: formData.hometown.split(',')[0]?.trim() || '',
            country: formData.hometown.split(',')[1]?.trim() || '',
          },
        };
        await axios.put('/api/profiles/me', profilePayload);
        if (formData.photo) {
          const photoFormData = new FormData();
          photoFormData.append('photo', formData.photo);
          await axios.post('/api/profiles/me/photos', photoFormData);
        }
        await axios.put('/api/auth/me/registration-complete');
        if (onComplete) onComplete();
        return;
      }

      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName || '',
        age: age,
        gender: formData.gender,
        userType: 'regular',
        bio: formData.bio,
        preferences: {
          lookingFor: formData.seeking,
          description: formData.idealPartner,
        },
        interests: formData.interests,
        location: {
          city: formData.hometown.split(',')[0] || formData.hometown,
          country: formData.hometown.split(',')[1]?.trim() || '',
        },
      };

      const result = register ? await register(registrationData) : { success: false, message: 'Not available' };

      if (result.success) {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        if (formData.photo) {
          const photoFormData = new FormData();
          photoFormData.append('photo', formData.photo);
          try {
            await axios.post(`${apiUrl}/api/profiles/me/photos`, photoFormData);
          } catch (photoError) {
            console.error('Photo upload error:', photoError);
          }
        }
        setRegisteredUser({
          firstName: formData.firstName,
          email: formData.email,
        });
        setShowSuccessModal(true);
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || (completeProfileOnly ? 'Failed to save profile' : crmCreateUser ? 'Failed to create user' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    try {
      // Call API to resend verification email
      await axios.post('/api/auth/resend-verification', {
        email: formData.email,
      });
      return true;
    } catch (error) {
      console.error('Resend email error:', error);
      throw error;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>
            
            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  handleChange('email', e.target.value);
                  setEmailError(''); // Clear error when user types
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
                required
              />
              {emailError && (
                <p className="mt-2 text-sm text-red-600">{emailError}</p>
              )}
              {checkingEmail && (
                <p className="mt-2 text-sm text-gray-500">Checking email availability...</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Password (min 6 characters)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Create a password"
                minLength={6}
                required
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">About you</h2>

            {crmCreateUser && (
              <div className="space-y-4 pb-4 border-b border-gray-200">
                <div>
                  <label className="block text-gray-700 mb-2">User role</label>
                  <select
                    value={formData.userRole || 'user'}
                    onChange={(e) => handleChange('userRole', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="user">Real users</option>
                    <option value="streamer">Streamer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => { handleChange('email', e.target.value); setEmailError(''); }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter email"
                  />
                  {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Password (optional)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                  <p className="mt-1 text-sm text-gray-500">Min 6 characters if set. Optional.</p>
                </div>
                {formData.password && (
                  <div>
                    <label className="block text-gray-700 mb-2">Confirm password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Confirm password"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-gray-700 mb-2">Name or nickname:</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">I am a:</label>
                <div className="flex space-x-8 sm:space-x-10">
                  <button
                    type="button"
                    onClick={() => handleChange('gender', 'male')}
                    className={`flex flex-col items-center justify-center transition ${
                      formData.gender === 'male'
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-1 overflow-hidden ${
                        formData.gender === 'male'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <img src="/male_icon.png" alt="Man" className="w-16 h-16 object-cover" />
                    </div>
                    <span className="text-sm font-medium">Man</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('gender', 'female')}
                    className={`flex flex-col items-center justify-center transition ${
                      formData.gender === 'female'
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-1 overflow-hidden ${
                        formData.gender === 'female'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <img src="/female_icon.png" alt="Woman" className="w-16 h-16 object-cover" />
                    </div>
                    <span className="text-sm font-medium">Woman</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Seeking a:</label>
                <div className="flex space-x-8 sm:space-x-10">
                  <button
                    type="button"
                    onClick={() => handleChange('seeking', 'male')}
                    className={`flex flex-col items-center justify-center transition ${
                      formData.seeking === 'male'
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-1 overflow-hidden ${
                        formData.seeking === 'male'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <img src="/male_icon.png" alt="Man" className="w-16 h-16 object-cover" />
                    </div>
                    <span className="text-sm font-medium">Man</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('seeking', 'female')}
                    className={`flex flex-col items-center justify-center transition ${
                      formData.seeking === 'female'
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-1 overflow-hidden ${
                        formData.seeking === 'female'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <img src="/female_icon.png" alt="Woman" className="w-16 h-16 object-cover" />
                    </div>
                    <span className="text-sm font-medium">Woman</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Birthday:</label>
              <div className="grid grid-cols-3 gap-4">
                <select
                  value={formData.birthday.month}
                  onChange={(e) => handleChange('birthday.month', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Month</option>
                  {months.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{month}</option>
                  ))}
                </select>
                <select
                  value={formData.birthday.day}
                  onChange={(e) => handleChange('birthday.day', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Day</option>
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <select
                  value={formData.birthday.year}
                  onChange={(e) => handleChange('birthday.year', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Hometown:</label>
              <input
                type="text"
                value={formData.hometown}
                onChange={(e) => handleChange('hometown', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="City, Country"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">Some interesting details about you</h2>
            
            <div className="text-sm text-gray-600 italic mb-4">
              <p className="mb-2">E.G.:</p>
              <p>
                Hello, I'm looking for a companion. Someone with a big personality but able to give me plenty of attention too. 
                Please message me if you've got a good appetite, interesting conversation and the ability to laugh at yourself.
              </p>
            </div>

            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="w-full h-48 px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Some interesting details about me..."
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">About your ideal partner</h2>
            
            <textarea
              value={formData.idealPartner}
              onChange={(e) => handleChange('idealPartner', e.target.value)}
              className="w-full h-48 px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Few words about your ideal partner"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">Your interests</h2>
            
            <div className="grid grid-cols-3 gap-2">
              {interests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-2 py-2 text-xs sm:text-sm rounded-lg border transition ${
                    formData.interests.includes(interest)
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-6">Add photo. Get noticed.</h2>
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center relative">
                {formData.photo ? (
                  <img
                    src={URL.createObjectURL(formData.photo)}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center flex flex-col items-center">
                    <img
                      src="/profile.png"
                      alt="Profile placeholder"
                      className={`${crmCreateUser ? 'w-20 h-20' : 'w-32 h-32'} object-cover rounded-full mb-4`}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="bg-gray-700 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition"
                    >
                      UPLOAD PROFILE PHOTO
                    </label>
                  </div>
                )}
                {formData.photo && (
                  <button
                    type="button"
                    onClick={() => handleChange('photo', null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {showSuccessModal && (
        <RegistrationSuccessModal
          user={registeredUser}
          email={formData.email}
          onClose={() => {
            setShowSuccessModal(false);
            if (crmCreateUser && onSuccessRedirectTo) {
              navigate(onSuccessRedirectTo);
            } else if (returnToCrm) {
              window.location.href = returnToCrm;
            } else {
              navigate('/dashboard');
            }
          }}
          onResendEmail={crmCreateUser ? undefined : handleResendVerificationEmail}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-b from-blue-200 via-blue-100 to-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cloud background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-20 bg-white opacity-30 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-40 h-25 bg-white opacity-30 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-22 bg-white opacity-30 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {renderStep()}

            <div className="mt-8 pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {currentStep >= 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="min-h-[44px] min-w-[44px] px-4 py-2.5 text-blue-600 hover:text-blue-800 cursor-pointer touch-manipulation"
                >
                  Back
                </button>
              )}

              {currentStep > 0 && currentStep < 5 && !completeProfileOnly && !crmCreateUser && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="min-h-[44px] px-4 py-2.5 text-blue-600 hover:text-blue-800 cursor-pointer touch-manipulation"
                >
                  Skip
                </button>
              )}
            </div>

            <div className="flex flex-col items-end pt-4">
              <button
                type="button"
                onClick={handleNext}
                className={`min-h-[48px] min-w-[120px] px-6 py-3 sm:px-12 rounded-lg font-semibold text-white transition bg-gradient-nex hover:opacity-90 active:opacity-95 shadow-md cursor-pointer touch-manipulation select-none ${
                  loading || checkingEmail || (currentStep === 5 && !formData.photo) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
                disabled={loading || checkingEmail || (currentStep === 5 && !formData.photo)}
              >
                {loading
                  ? (completeProfileOnly ? 'Saving...' : 'Registering...')
                  : checkingEmail
                    ? 'Checking...'
                    : (currentStep === 5 ? 'REGISTER' : 'NEXT')}
              </button>

              <div className="flex space-x-2 mt-4">
                {(completeProfileOnly || crmCreateUser ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5]).map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full ${
                      step === currentStep ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default RegistrationWizard;

