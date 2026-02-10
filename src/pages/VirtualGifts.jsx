import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaImage } from 'react-icons/fa';

const VirtualGifts = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    creditCost: 0,
    markAsFree: false,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/admin/gift-catalog');
      const all = data.gifts || [];
      // Show only non-physical items here (virtual / both)
      setGifts(all.filter((g) => g.type !== 'physical'));
    } catch (err) {
      console.error('Error fetching gift catalog:', err);
      setError(err.response?.data?.message || 'Failed to load virtual gifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      creditCost: 0,
      markAsFree: false,
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
      creditCost: cost,
      markAsFree: cost === 0,
      isActive: g.isActive !== false,
    });
    setImageFile(null);
    setError('');
    setShowModal(true);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const creditCost = formData.markAsFree ? 0 : (parseInt(formData.creditCost, 10) || 0);
      const fd = new FormData();
      fd.append('name', formData.name.trim());
      fd.append('description', '');
      fd.append('category', 'other');
      fd.append('type', 'virtual');
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
    if (!window.confirm('Delete this gift from the catalog?')) return;
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
        <div className="text-gray-500">Loading virtual gifts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Virtual Gifts Catalog</h2>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-nex text-white rounded-lg hover:opacity-90 transition shadow"
          >
            <FaPlus /> Add Gift
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Virtual gifts shown here appear in chat and email. Set credit cost or mark as free.
          Physical presents for real-world delivery are managed separately in the <strong>Presents</strong> section.
        </p>
        {error && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
          {gifts.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-500 text-sm">
              No virtual gifts yet. Add gift images, set credit values, and mark gifts as free if needed.
            </div>
          ) : (
            gifts.map((g) => (
              <div
                key={g.id}
                className="border border-gray-200 rounded-md overflow-hidden hover:shadow-md transition max-w-[140px]"
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center">
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
                  {(g.creditCost ?? 0) === 0 && (
                    <span className="absolute top-1 right-1 z-20 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded font-medium shadow">
                      FREE
                    </span>
                  )}
                </div>
                <div className="p-1.5">
                  <p className="font-medium text-gray-800 truncate text-xs" title={g.name}>
                    {g.name}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    {(g.creditCost ?? 0) === 0 ? 'Free' : `${g.creditCost} Cr`}
                  </p>
                  {!g.isActive && (
                    <p className="text-[10px] text-amber-600 font-medium">Inactive</p>
                  )}
                  <div className="flex justify-end gap-0.5 mt-0.5">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="p-1 text-nex-orange hover:bg-orange-50 rounded text-xs"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded text-xs"
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
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingId ? 'Edit Gift' : 'Add Gift'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Golden Crown"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nex-orange focus:border-transparent"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="markAsFree"
                  checked={formData.markAsFree}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      markAsFree: e.target.checked,
                      creditCost: e.target.checked ? 0 : formData.creditCost,
                    })
                  }
                  className="rounded border-gray-300 text-nex-orange focus:ring-nex-orange"
                />
                <label htmlFor="markAsFree" className="text-sm font-medium text-gray-700">
                  Mark as free
                </label>
              </div>
              {!formData.markAsFree && (
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
                    placeholder="e.g. 39"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nex-orange focus:border-transparent"
                  />
                </div>
              )}
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
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-nex-orange focus:ring-nex-orange"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (visible in chat/email)
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

export default VirtualGifts;
