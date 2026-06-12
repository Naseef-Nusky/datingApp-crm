import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import axios from 'axios';
import RegistrationSuccessModal from './RegistrationSuccessModal';
import PasswordInput from './PasswordInput';
import ImageCropEditor from '../src/components/ImageCropEditor';
import {
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_HINT,
  isAllowedProfileImageFile,
  prepareProfileImageForUpload,
} from '../src/utils/profileImage';

const REQUIRED_GALLERY_PHOTOS = 2;
const PHOTO_SLOT_COUNT = 1 + REQUIRED_GALLERY_PHOTOS; // profile + 2 gallery

/** Clear gap between male/female icons (inline style — reliable in all CRM layouts). */
const GENDER_ICON_GAP = '3.5rem';

function GenderIconPicker({ label, value, onSelect, className = '' }) {
  const optionClass = (active) =>
    `flex shrink-0 flex-col items-center justify-center min-w-[4.5rem] transition ${
      active ? 'text-red-600' : 'text-gray-700'
    }`;
  const ringClass = (active) =>
    `w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2 overflow-hidden ${
      active ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
    }`;

  return (
    <div className={`min-w-0 ${className}`}>
      <label className="block text-gray-700 mb-2 text-sm whitespace-nowrap">{label}</label>
      <div
        className="flex flex-row flex-nowrap items-end justify-start py-1"
        style={{ gap: GENDER_ICON_GAP }}
      >
        <button type="button" onClick={() => onSelect('male')} className={optionClass(value === 'male')}>
          <div className={ringClass(value === 'male')}>
            <img src="/male_icon.png" alt="Man" className="w-16 h-16 object-cover" />
          </div>
          <span className="text-sm font-medium">Man</span>
        </button>
        <button type="button" onClick={() => onSelect('female')} className={optionClass(value === 'female')}>
          <div className={ringClass(value === 'female')}>
            <img src="/female_icon.png" alt="Woman" className="w-16 h-16 object-cover" />
          </div>
          <span className="text-sm font-medium">Woman</span>
        </button>
      </div>
    </div>
  );
}

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
  const [photoCropSource, setPhotoCropSource] = useState(null);
  const [photoCropTarget, setPhotoCropTarget] = useState(null);
  const [existingPhotos, setExistingPhotos] = useState({ profile: null, gallery: [] });
  /** Prevents double REGISTER (e.g. double-click) from calling the create API twice. */
  const createSubmitLockRef = useRef(false);

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
    // Step 5: [profile, gallery1, gallery2]
    photos: Array(PHOTO_SLOT_COUNT).fill(null),
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

    const serverPhotos = Array.isArray(initialProfile.photos) ? initialProfile.photos : [];
    const toUrl = (p) => (typeof p === 'string' ? p : p?.url || null);
    const profileUrl = serverPhotos.length > 0 ? toUrl(serverPhotos[0]) : null;
    const galleryUrls = serverPhotos.slice(1).map(toUrl).filter(Boolean);
    setExistingPhotos({ profile: profileUrl, gallery: galleryUrls });
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

  const photosRequiredForRole = () =>
    !(crmCreateUser && formData.userRole === 'admin');

  const registrationPhotosComplete = () => {
    if (!photosRequiredForRole()) return true;
    const newProfile = formData.photos?.[0];
    const newGallery = (formData.photos || []).slice(1).filter(Boolean);
    const hasProfile = Boolean(existingPhotos.profile) || Boolean(newProfile);
    const galleryCount = existingPhotos.gallery.length + newGallery.length;
    return hasProfile && galleryCount >= REQUIRED_GALLERY_PHOTOS;
  };

  const uploadRegistrationPhotos = async (photos) => {
    const profileFile = photos?.[0];
    const galleryFiles = (photos || []).slice(1).filter(Boolean);

    if (profileFile) {
      const profileFormData = new FormData();
      profileFormData.append('photo', profileFile);
      await axios.post('/api/profiles/me/photos', profileFormData);
    }

    for (const file of galleryFiles) {
      const galleryFormData = new FormData();
      galleryFormData.append('photo', file);
      await axios.post('/api/profiles/me/photos/add', galleryFormData);
    }
  };

  const uploadCrmUserGalleryPhotos = async (userId, photos) => {
    const galleryFiles = (photos || []).slice(1).filter(Boolean);
    for (const file of galleryFiles) {
      const galleryFormData = new FormData();
      galleryFormData.append('photo', file);
      await axios.post(`/api/admin/profiles/${userId}/photos/add`, galleryFormData);
    }
  };

  const handlePhotoChange = async (e, photoIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedProfileImageFile(file)) {
      alert(`Please select a supported image (${PROFILE_IMAGE_HINT})`);
      return;
    }
    try {
      const ready = await prepareProfileImageForUpload(file);
      setPhotoCropTarget(photoIndex);
      setPhotoCropSource((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(ready);
      });
    } catch (err) {
      console.error('Photo prepare error:', err);
      alert('Could not open this photo. Try JPG or PNG, or take a new photo.');
    }
    e.target.value = '';
  };

  const handlePhotoCropConfirm = (file) => {
    const targetIndex = photoCropTarget;
    setPhotoCropSource((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoCropTarget(null);
    if (targetIndex === null || targetIndex === undefined) return;
    setFormData((prev) => {
      const photos = [...(prev.photos || Array(PHOTO_SLOT_COUNT).fill(null))];
      photos[targetIndex] = file;
      return { ...prev, photos };
    });
    if (targetIndex === 0) {
      setExistingPhotos((prev) => ({ ...prev, profile: null }));
    }
  };

  const handlePhotoCropCancel = () => {
    setPhotoCropSource((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoCropTarget(null);
  };

  const removeRegistrationPhoto = (photoIndex) => {
    setFormData((prev) => {
      const photos = [...(prev.photos || Array(PHOTO_SLOT_COUNT).fill(null))];
      photos[photoIndex] = null;
      return { ...prev, photos };
    });
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

  const crmAccountTypeForRole = (userRole) => (userRole === 'streamer' ? 'streamer' : 'member');

  const checkEmailExists = async (email) => {
    if (!email || !email.includes('@')) {
      return false;
    }

    try {
      setCheckingEmail(true);
      setEmailError('');
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const url = base ? `${base}/api/auth/check-email` : '/api/auth/check-email';
      const response = await axios.post(url, { email: email.trim() });
      return response.data.exists;
    } catch (error) {
      console.error('Email check error:', error);
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  /** CRM create: role-aware check (same email allowed across different account types). */
  const checkCrmEmailTaken = async (email, userRole = 'user') => {
    if (!email || !email.includes('@')) {
      return null;
    }

    try {
      setCheckingEmail(true);
      const response = await axios.post('/api/admin/check-email', {
        email: email.trim(),
        accountType: crmAccountTypeForRole(userRole),
      });
      if (response.data.exists) {
        return response.data.message || 'This email is already registered. Please use a different email.';
      }
      return null;
    } catch (error) {
      console.error('CRM email check error:', error);
      return null;
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateCrmEmailField = async (email, userRole = 'user') => {
    const takenMessage = await checkCrmEmailTaken(email, userRole);
    if (takenMessage) {
      setEmailError(takenMessage);
      return false;
    }
    setEmailError('');
    return true;
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
          const emailTrimmed = formData.email.trim();
          const emailOk = await validateCrmEmailField(emailTrimmed, formData.userRole || 'user');
          if (!emailOk) {
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
        if (!registrationPhotosComplete()) {
          setError('Please add your profile photo and 2 gallery photos to continue');
          return false;
        }
        return true;
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
    if (createSubmitLockRef.current) return;
    createSubmitLockRef.current = true;
    setLoading(true);
    setError('');

    try {
      const age = calculateAge() ?? 18;

      if (crmCreateUser) {
        const email = formData.email.trim();
        const password = (formData.password && formData.password.trim()) ? formData.password.trim() : null;
        const role = formData.userRole || 'user';

        if (role !== 'admin' && !registrationPhotosComplete()) {
          setError('Please add your profile photo and 2 gallery photos before registering.');
          return;
        }

        const emailTakenMsg = await checkCrmEmailTaken(email, role);
        if (emailTakenMsg) {
          setEmailError(emailTakenMsg);
          setError(emailTakenMsg);
          return;
        }

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

        let response;
        if (role === 'streamer') {
          const fd = new FormData();
          fd.append('email', payload.email);
          fd.append('firstName', payload.firstName);
          fd.append('lastName', payload.lastName);
          fd.append('age', String(payload.age));
          fd.append('gender', payload.gender);
          fd.append('seeking', payload.seeking);
          fd.append('hometown', payload.hometown);
          fd.append('bio', payload.bio);
          fd.append('idealPartner', payload.idealPartner);
          fd.append('interests', JSON.stringify(payload.interests));
          if (password) fd.append('password', password);
          fd.append('photo', formData.photos[0]);
          response = await axios.post('/api/admin/streamers/with-photo', fd);
          const streamerId = response.data?.user?.id;
          if (streamerId) {
            await uploadCrmUserGalleryPhotos(streamerId, formData.photos);
          }
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
          const fd = new FormData();
          fd.append('email', payload.email);
          fd.append('firstName', payload.firstName);
          fd.append('lastName', payload.lastName);
          fd.append('age', String(payload.age));
          fd.append('gender', payload.gender);
          fd.append('seeking', payload.seeking);
          fd.append('hometown', payload.hometown);
          fd.append('bio', payload.bio);
          fd.append('idealPartner', payload.idealPartner);
          fd.append('interests', JSON.stringify(payload.interests));
          if (password) fd.append('password', password);
          fd.append('photo', formData.photos[0]);
          response = await axios.post('/api/admin/users/with-photo', fd);
          const memberId = response.data?.user?.id;
          if (memberId) {
            await uploadCrmUserGalleryPhotos(memberId, formData.photos);
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
        if (registrationPhotosComplete()) {
          await uploadRegistrationPhotos(formData.photos);
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
        if (registrationPhotosComplete()) {
          try {
            await uploadRegistrationPhotos(formData.photos);
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
      createSubmitLockRef.current = false;
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
              <PasswordInput
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                boxClassName="w-full border border-gray-300 rounded-lg bg-white focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent"
                inputClassName="py-3"
                placeholder="Create a password"
                minLength={6}
                required
                autoComplete="new-password"
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
                    onChange={(e) => {
                      handleChange('userRole', e.target.value);
                      setEmailError('');
                      if (formData.email?.includes('@')) {
                        validateCrmEmailField(formData.email.trim(), e.target.value);
                      }
                    }}
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
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value.includes('@')) {
                        validateCrmEmailField(value, formData.userRole || 'user');
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter email"
                  />
                  {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
                  {checkingEmail && (
                    <p className="mt-2 text-sm text-gray-500">Checking if email is available...</p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Password (optional)</label>
                  <PasswordInput
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    boxClassName="w-full border border-gray-300 rounded-lg bg-white focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent"
                    inputClassName="py-3"
                    placeholder="Optional"
                    autoComplete="new-password"
                  />
                  <p className="mt-1 text-sm text-gray-500">Min 6 characters if set. Optional.</p>
                </div>
                {formData.password && (
                  <div>
                    <label className="block text-gray-700 mb-2">Confirm password</label>
                    <PasswordInput
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      boxClassName="w-full border border-gray-300 rounded-lg bg-white focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent"
                      inputClassName="py-3"
                      placeholder="Confirm password"
                      autoComplete="new-password"
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

            <div
              className="flex flex-row flex-nowrap items-start w-full"
              style={{ columnGap: '2.5rem' }}
            >
              <GenderIconPicker
                className="flex-1 min-w-0"
                label="I am a:"
                value={formData.gender}
                onSelect={(g) => handleChange('gender', g)}
              />
              <GenderIconPicker
                className="flex-1 min-w-0"
                label="Seeking a:"
                value={formData.seeking}
                onSelect={(g) => handleChange('seeking', g)}
              />
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

      case 5: {
        if (crmCreateUser && formData.userRole === 'admin') {
          return (
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold mb-2">Admin account</h2>
              <p className="text-sm text-gray-600">No photos required for CRM admin accounts.</p>
            </div>
          );
        }

        const renderPhotoSlot = (slotIndex, label, previewUrl, isExisting = false) => {
          const photo = formData.photos?.[slotIndex];
          const inputId = `photo-upload-${slotIndex}`;
          const displaySrc = photo ? URL.createObjectURL(photo) : previewUrl;

          return (
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
              <div className="relative w-full max-w-[220px] aspect-square">
                <input
                  type="file"
                  accept={PROFILE_IMAGE_ACCEPT}
                  onChange={(e) => handlePhotoChange(e, slotIndex)}
                  className="hidden"
                  id={inputId}
                />
                <label
                  htmlFor={inputId}
                  className="w-full h-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center relative cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition overflow-hidden"
                >
                  {displaySrc ? (
                    <img
                      src={displaySrc}
                      alt={label}
                      className="w-full h-full object-cover rounded-lg pointer-events-none"
                    />
                  ) : (
                    <div className="text-center flex flex-col items-center px-3 pointer-events-none">
                      <img
                        src="/profile.png"
                        alt="Photo placeholder"
                        className="w-20 h-20 object-cover rounded-full mb-3 opacity-70"
                      />
                      <span className="text-black font-semibold text-xs sm:text-sm">
                        UPLOAD PHOTO
                      </span>
                    </div>
                  )}
                  {displaySrc && (
                    <span className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-95 text-black text-xs font-semibold py-2 text-center rounded border border-gray-300 pointer-events-none">
                      TAP TO CHANGE PHOTO
                    </span>
                  )}
                </label>
                {isExisting && !photo && displaySrc && (
                  <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded pointer-events-none">
                    ADDED
                  </span>
                )}
                {photo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeRegistrationPhoto(slotIndex);
                    }}
                    className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    aria-label={`Remove ${label}`}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-2">Add your photos</h2>
            <p className="text-center text-sm text-gray-900 mb-6">
              1 profile photo{existingPhotos.profile ? ' (already on profile)' : ''} and 2 gallery photos required.
            </p>
            {photoCropSource ? (
              <ImageCropEditor
                imageSrc={photoCropSource}
                aspect={1}
                onConfirm={handlePhotoCropConfirm}
                onCancel={handlePhotoCropCancel}
              />
            ) : (
              <div className="space-y-8">
                <div className="flex justify-center">
                  {renderPhotoSlot(
                    0,
                    'Profile photo',
                    existingPhotos.profile,
                    Boolean(existingPhotos.profile)
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Array.from({ length: REQUIRED_GALLERY_PHOTOS }, (_, galleryIndex) => {
                    const slotIndex = galleryIndex + 1;
                    const existingUrl = existingPhotos.gallery[galleryIndex] || null;
                    return (
                      <div key={slotIndex}>
                        {renderPhotoSlot(
                          slotIndex,
                          `Gallery photo ${galleryIndex + 1}`,
                          existingUrl,
                          Boolean(existingUrl)
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!photoCropSource && (
              <p className="text-xs text-gray-900 text-center">Supported: {PROFILE_IMAGE_HINT}</p>
            )}
          </div>
        );
      }

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
                  loading || checkingEmail || (currentStep === 5 && !registrationPhotosComplete())
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : ''
                }`}
                disabled={loading || checkingEmail || (currentStep === 5 && !registrationPhotosComplete())}
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

