function Button({
  children,
  type = 'button',
  onClick,
  disabled = false,
  variant = 'default',
}) {
  const styles = {
    padding: '6px 14px',
    fontSize: '14px',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid #999',
    backgroundColor: variant === 'submit' ? '#0070f3' : '#f0f0f0',
    color: variant === 'submit' ? '#ffffff' : '#000000',
    marginRight: '8px',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={styles}
    >
      {children}
    </button>
  )
}

export default Button
