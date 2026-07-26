import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function MenuManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newCategory, setNewCategory] = useState('')
  const [newItem, setNewItem] = useState({ category: '', name: '', price: '' })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/menu/categories/')
      setCategories(data)
      setError('')
    } catch (err) {
      setError('Could not load menu. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const addCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    await api.post('/menu/categories/', { name: newCategory, display_order: categories.length })
    setNewCategory('')
    load()
  }

  const addItem = async (e) => {
    e.preventDefault()
    if (!newItem.category || !newItem.name || !newItem.price) return
    await api.post('/menu/items/', {
      category: newItem.category,
      name: newItem.name,
      price: newItem.price,
      is_veg: true,
      is_available: true,
    })
    setNewItem({ category: '', name: '', price: '' })
    load()
  }

  const toggleAvailability = async (item) => {
    await api.patch(`/menu/items/${item.id}/`, { is_available: !item.is_available })
    load()
  }

  if (loading) return <p>Loading menu...</p>

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Menu Management</h1>
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      <section style={styles.card}>
        <h3>Add Category</h3>
        <form onSubmit={addCategory} style={styles.inlineForm}>
          <input
            style={styles.input}
            placeholder="e.g. Starters"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button style={styles.button} type="submit">Add</button>
        </form>
      </section>

      <section style={styles.card}>
        <h3>Add Menu Item</h3>
        <form onSubmit={addItem} style={styles.inlineForm}>
          <select
            style={styles.input}
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            style={styles.input}
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Price"
            type="number"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          />
          <button style={styles.button} type="submit">Add</button>
        </form>
      </section>

      {categories.map((cat) => (
        <section key={cat.id} style={styles.card}>
          <h3>{cat.name}</h3>
          {cat.items.length === 0 && <p style={{ color: '#9ca3af' }}>No items yet.</p>}
          {cat.items.map((item) => (
            <div key={item.id} style={styles.itemRow}>
              <span>{item.name}</span>
              <span>₹{item.price}</span>
              <button
                style={{
                  ...styles.toggleBtn,
                  background: item.is_available ? '#dcfce7' : '#fee2e2',
                  color: item.is_available ? '#166534' : '#991b1b',
                }}
                onClick={() => toggleAvailability(item)}
              >
                {item.is_available ? 'Available' : 'Unavailable'}
              </button>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    padding: '1.25rem',
    borderRadius: 10,
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  inlineForm: { display: 'flex', gap: 8 },
  input: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: 14,
  },
  button: {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    background: '#111827',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  toggleBtn: {
    border: 'none',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
}
