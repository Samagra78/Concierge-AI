import { useState } from 'react'
import Button from './Button'

function UnvalidatedForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // No validation performed: accepts whatever was provided
    console.log('Unvalidated Form Submitted:\n', formData)
  }

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      age: '',
    })
  }

  const inputStyle = {
    border: '1px solid #767676',
    padding: '4px 8px',
    borderRadius: '4px',
    marginLeft: '6px',
  }

  return (
    <div>
      <h2>Form 1: Unvalidated Form</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="unval-name">Name: </label>
          <input
            id="unval-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="unval-email">Email: </label>
          <input
            id="unval-email"
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="unval-password">Password: </label>
          <input
            id="unval-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="unval-age">Age: </label>
          <input
            id="unval-age"
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            onWheel={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
              }
            }}
            style={inputStyle}
          />
        </div>

        <div style={{ marginTop: '12px' }}>
          <Button type="submit" variant="submit">
            Submit (No Validation)
          </Button>
          <Button type="button" onClick={handleReset} variant="default">
            Reset
          </Button>
        </div>
      </form>
    </div>
  )
}

export default UnvalidatedForm
