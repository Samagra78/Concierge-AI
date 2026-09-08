import UnvalidatedForm from './components/UnvalidatedForm'
import ValidatedForm from './components/ValidatedForm'

function App() {
  return (
    <main style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <h1>Form Comparison Demo</h1>
      <UnvalidatedForm />
      <hr style={{ margin: '24px 0' }} />
      <ValidatedForm />
    </main>
  )
}

export default App

