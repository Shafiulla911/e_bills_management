import React, { useState } from 'react';
import { Package, Search, Plus, Edit2, Trash2 } from 'lucide-react';

const ProductCatalog = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('');

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setCategory('Grocery');
    setPrice('');
    setUnit('kg');
    setStock('50');
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price);
    setUnit(product.unit);
    setStock(product.stock);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) return;

    const payload = {
      name,
      category,
      price: parseFloat(price),
      unit,
      stock: parseFloat(stock) || 0
    };

    if (editingId) {
      await onUpdateProduct(editingId, payload);
    } else {
      await onAddProduct(payload);
    }

    setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Package color="#6366f1" size={28} />
            Shop Product Catalog & Inventory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
            Manage item prices, units, categories, and stock quantities for fast billing.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>+ Add Product</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="form-control"
            placeholder="Search products..."
            style={{ paddingLeft: '2.75rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
        {filteredProducts.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products found matching your search.
          </div>
        ) : (
          filteredProducts.map(p => (
            <div 
              key={p.id}
              className="glass-card glass-card-hover"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>
                    {p.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: p.stock < 10 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                    Stock: {p.stock} {p.unit}s
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: '0.4rem 0' }}>
                  {p.name}
                </h3>

                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', margin: '0.5rem 0 1rem 0' }}>
                  ₹{p.price} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {p.unit}</span>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => openEditModal(p)}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => onDeleteProduct(p.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
              {editingId ? '✏️ Edit Product' : '📦 Add New Product'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input 
                  type="text" 
                  className="form-control"
                  required
                  placeholder="e.g. Basmati Rice 5kg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Grocery, Dairy, Household..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <select 
                    className="form-control"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="bag">bag</option>
                    <option value="packet">packet</option>
                    <option value="bottle">bottle</option>
                    <option value="pcs">pcs</option>
                    <option value="litre">litre</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Unit Price (₹) *</label>
                  <input 
                    type="number" 
                    className="form-control"
                    required
                    placeholder="Price in ₹"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Available Stock</label>
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Quantity"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductCatalog;
