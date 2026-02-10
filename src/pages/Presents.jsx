import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaImage, FaGift } from 'react-icons/fa';

const defaultCategoryOptions = [
  { value: 'cake', label: 'Cakes' },
  { value: 'flower', label: 'Flowers' },
  { value: 'ceremony', label: 'Ceremony / Special' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'pet', label: 'Pets' },
  { value: 'present', label: 'Presents' },
  { value: 'other', label: 'Other' },
];

const getCategoryLabel = (value) => {
  const found = defaultCategoryOptions.find((c) => c.value === value);
  if (found) return found.label;
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const Presents = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    creditCost: 0,
    category: 'ceremony',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [presentCategories, setPresentCategories] = useState([]);

  const categoryOptions = useMemo(() => {
    if (presentCategories.length > 0) {
      // Use category NAME everywhere (value = name) so slug is internal only
      return presentCategories.map((c) => ({
        value: c.name,
        label: c.name,
      }));
    }
    const values = new Set(defaultCategoryOptions.map((c) => c.value));
    gifts.forEach((g) => {
      if (g.category) values.add(g.category);
    });
    return Array.from(values).map((value) => ({
      value,
      label: getCategoryLabel(value),
    }));
  }, [gifts, presentCategories]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/admin/gift-catalog?includeInactive=1', {
        headers: getAuthHeaders(),
      });
      const all = data.gifts || [];
      // Only show physical presents here
      setGifts(all.filter((g) => g.type === 'physical'));
    } catch (err) {
      console.error('Error fetching presents catalog:', err);
      setError(err.response?.data?.message || 'Failed to load presents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifts();
    const loadCategories = async () => {
      try {
        const { data } = await axios.get('/api/admin/present-categories', {
          headers: getAuthHeaders(),
        });
        setPresentCategories(data.categories || []);
      } catch (err) {
        console.error('Error fetching present categories:', err);
      }
    };
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      creditCost: 0,
      category: categoryOptions[0]?.value || 'ceremony',
      isActive: true,
    });
    setImageFile(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (g) => {
    setEditingId(g.id);
    const cost = g.creditCost ?? 0;
    setFormData({
      name: g.name,
      description: g.description || '',
      creditCost: cost,
      category: g.category || 'ceremony',
      isActive: g.isActive !== false,
    });
    setImageFile(null);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const creditCost = parseInt(formData.creditCost, 10) || 0;
      const fd = new FormData();
      fd.append('name', formData.name.trim());
      fd.append('description', (formData.description || '').trim());
      fd.append('category', formData.category);
      fd.append('type', 'physical');
      fd.append('creditCost', String(creditCost));
      fd.append('isActive', formData.isActive ? 'true' : 'false');
      if (imageFile) fd.append('image', imageFile);
      if (editingId) {
        await axios.put(`/api/admin/gift-catalog/${editingId}`, fd, {
          headers: getAuthHeaders(),
        });
      } else {
        await axios.post('/api/admin/gift-catalog', fd, {
          headers: getAuthHeaders(),
        });
      }
      setShowModal(false);
      fetchGifts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (Array.isArray(err.response?.data?.errors) && err.response.data.errors[0]?.msg) ||
          'Save failed'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this present from the catalog? (History of sent gifts will be preserved)')) return;
    try {
      await axios.delete(`/api/admin/gift-catalog/${id}`, { headers: getAuthHeaders() });
      fetchGifts();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading && gifts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading presents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FaGift /> Presents (Physical Gifts)
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nex-orange"
            >
              <option value="all">All categories</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-nex text-white rounded-lg hover:opacity-90 transition shadow"
            >
              <FaPlus /> Add Present
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Manage physical presents used in the Present Shop. These use credits and are delivered offline to the member.
        </p>
        {error && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

        {(() => {
          const visibleGifts =
            categoryFilter === 'all'
              ? gifts
              : gifts.filter((g) => g.category === categoryFilter);

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {visibleGifts.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-500 text-sm">
              No presents yet. Add physical gifts with images, categories, and credit prices.
            </div>
          ) : (
            visibleGifts.map((g) => (
              <div
                key={g.id}
                className="border border-gray-200 rounded-md overflow-hidden hover:shadow-md transition bg-white"
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  {g.imageUrl ? (
                    <img
                      src={g.imageUrl}
                      alt={g.name}
                      className="w-full h-full object-contain z-10"
                      onError={(e) => e.target.classList.add('opacity-0')}
                    />
                  ) : (
                    <span className="text-gray-400 z-0">
                      <FaImage className="w-8 h-8" />
                    </span>
                  )}
                </div>
                <div className="p-2.5 space-y-0.5">
                  <p className="font-medium text-gray-800 truncate text-sm" title={g.name}>
                    {g.name}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {getCategoryLabel(g.category)}
                  </p>
                  <p className="text-[11px] text-gray-800 font-semibold">
                    {g.creditCost ?? 0} Credits
                  </p>
                  {!g.isActive && (
                    <p className="text-[10px] text-amber-600 font-medium">Inactive</p>
                  )}
                  <div className="flex justify-end gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="p-1.5 text-nex-orange hover:bg-orange-50 rounded text-xs"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded text-xs"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
          );
        })()}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingId ? 'Edit Present' : 'Add Present'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 60 Red Roses"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nex-orange focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Short description shown in the Present Shop..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nex-orange focus:border-transparent text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  list="present-category-options"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Flowers, Gadgets, Pets"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nex-orange focus:border-transparent text-sm"
                />
                <datalist id="present-category-options">
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input
                  type="number"
                  min={0}
                  value={formData.creditCost || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creditCost: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  placeholder="e.g. 3449"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nex-orange focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image {editingId ? '(leave empty to keep current)' : ''}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nex-orange"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActivePresent"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-nex-orange focus:ring-nex-orange"
                />
                <label htmlFor="isActivePresent" className="text-sm font-medium text-gray-700">
                  Active (visible in Present Shop)
                </label>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-nex text-white rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presents;

