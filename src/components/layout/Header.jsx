import { Link } from 'react-router'
import { APP_CONFIG } from '../../config'
import { SystemLogo } from './Emblems'
import LanguageSwitch from './LanguageSwitch'

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand">
          <SystemLogo className="brand__logo" />
          <span className="brand__name">{APP_CONFIG.systemName}</span>
        </Link>

        <LanguageSwitch className="site-header__lang" />
      </div>
    </header>
  )
}
