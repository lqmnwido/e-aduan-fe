import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { I18nProvider } from './i18n/I18nContext'
import { ComplaintProvider } from './context/ComplaintContext'
import Layout from './components/layout/Layout'
import RecordPage from './pages/RecordPage'
import FormPage from './pages/FormPage'

// record page then form page
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <RecordPage /> },
      { path: 'borang', element: <FormPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return (
    <I18nProvider>
      <ComplaintProvider>
        <RouterProvider router={router} />
      </ComplaintProvider>
    </I18nProvider>
  )
}
