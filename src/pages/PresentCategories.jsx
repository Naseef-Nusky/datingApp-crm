import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaImage } from 'react-icons/fa';

const PresentCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', sortOrder: 0, imageUrl: '' });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/admin/present-categories', {
        headers: getAuthHeaders(),
      });
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching present categories:', err);
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', slug: '', sortOrder: 0, imageUrl: '' });
    setImageFile(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      sortOrder: cat.sortOrder ?? 0,
      imageUrl: cat.imageUrl || '',
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
      const fd = new FormData();
      fd.append('name', formData.name.trim());
      fd.append('slug', formData.slug.trim());
      fd.append('sortOrder', String(formData.sortOrder ?? 0));
      if (imageFile) fd.append('image', imageFile);
      if (editingId) {
        if (formData.imageUrl && !imageFile) fd.append('imageUrl', formData.imageUrl);
        await axios.put(`/api/admin/present-categories/${editingId}`, fd, {
          headers: getAuthHeaders(),
        });
      } else {
        await axios.post('/api/admin/present-categories', fd, {
          headers: getAuthHeaders(),
        });
      }
      setShowModal(false);
      fetchCategories();
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
    if (!window.confirm('Delete this present category? It must not be used by any presents.')) return;
    try {
      await axios.delete(`/api/admin/present-categories/${id}`, {
        headers: getAuthHeaders(),
      });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading present categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Present Categories</h2>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-nex text-white rounded-lg hover:opacity-90 transition shadow"
          >
            <FaPlus /> Add Category
          </button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No present categories yet. Add some to organize the Present Shop (e.g. Flowers, Gadgets, Pets).
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-4 py-3">
                      {cat.imageUrl ? (
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="w-10 h-10 rounded object-cover border border-gray-200"
                        />
                      ) : (
                        <span className="text-gray-400"><FaImage className="w-8 h-8" /></span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                    <td className="px-4 py-3 text-gray-600">{cat.slug}</td>
                    <td className="px-4 py-3 text-gray-600">{cat.sortOrder}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="p-2 text-nex-orange hover:bg-orange-50 rounded"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingId ? 'Edit Category' : 'Add Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug:
                        formData.slug ||
                        e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  placeholder="e.g. Flowers, Gadgets, Pets"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nex-orange focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. flowers, gadgets"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-nex-orange focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                <input
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value, 10) || 0,
                    })
                  }
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
                {(formData.imageUrl || imageFile) && (
                  <div className="mt-2">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl}
                      alt="Preview"
                      className="w-20 h-20 rounded object-cover border border-gray-200"
                    />
                  </div>
                )}
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

export default PresentCategories;

