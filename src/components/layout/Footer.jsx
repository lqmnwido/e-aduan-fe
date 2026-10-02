import { useI18n } from '../../i18n/I18nContext'
import { APP_CONFIG } from '../../config'
import { SystemLogo } from './Emblems'

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="site-footer">
      <div className="container site-footer__main">
        <div className="site-footer__brand">
          <SystemLogo size={40} />
          <p className="site-footer__name">{APP_CONFIG.systemName}</p>
        </div>
        <p className="site-footer__about">{t('footer.about', { system: APP_CONFIG.systemName })}</p>
      </div>
    </footer>
  )
}
