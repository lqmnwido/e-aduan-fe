import { Outlet, ScrollRestoration } from 'react-router'
import { useI18n } from '../../i18n/I18nContext'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const { t } = useI18n()
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        {t('a11y.skip')}
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="app-main">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
