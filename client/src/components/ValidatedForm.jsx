import { useState } from 'react'
import Button from './Button'

function ValidatedForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const nextErrors = {}

    // 1. Name validation
    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required'
    } 
    else if (/\d/.test(formData.name)) {
      nextErrors.name = 'Name cannot contain numbers'
    }

    // 2. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required'
    } 
    else if (!emailRegex.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address'
    }

    // 3. Password validation
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
    if (!formData.password) {
      nextErrors.password = 'Password is required'
    } 
    else if (!passwordPattern.test(formData.password)) {
    nextErrors.password = 'Use 8+ characters with 1 uppercase letter, 1 number, and 1 special character.'
  }

    // 4. Age validation
    if (!formData.age) {
      nextErrors.age = 'Age is required'
    } 
    else if (Number(formData.age) <= 0 || isNaN(Number(formData.age))) {
      nextErrors.age = 'Age must be a positive number'
    }

    return nextErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validate()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    console.log('Validated Form Submitted:', formData)
  }

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      age: '',
    })
    setErrors({})
  }

  const inputStyle = {
    border: '1px solid #767676',
    padding: '4px 8px',
    borderRadius: '4px',
    marginLeft: '6px',
  }

  return (
    <div>
      <h2>Form 2: Validated Form</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="val-name">Name: </label>
          <input
            id="val-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={inputStyle}
          />
          {errors.name && <span style={{ color: 'red' }}> {errors.name}</span>}
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="val-email">Email: </label>
          <input
            id="val-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
          />
          {errors.email && <span style={{ color: 'red' }}> {errors.email}</span>}
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="val-password">Password: </label>
          <input
            id="val-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={inputStyle}
          />
          {errors.password && <span style={{ color: 'red' }}> {errors.password}</span>}
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="val-age">Age: </label>
          <input
            id="val-age"
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
          {errors.age && <span style={{ color: 'red' }}> {errors.age}</span>}
        </div>

        <div style={{ marginTop: '12px' }}>
          <Button type="submit" variant="submit">
            Submit (With Validation)
          </Button>
          <Button type="button" onClick={handleReset} variant="default">
            Reset
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ValidatedForm
