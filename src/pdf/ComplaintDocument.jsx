import { Document, Font, Page, Path, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import { COMPLAINT_FIELDS } from '../data/complaintFields'
import { APP_CONFIG } from '../config'
import { formatDateTime, formatDuration } from '../utils/format'

// no auto hyphenation
Font.registerHyphenationCallback((word) => [word])

const C = {
  navy: '#1e3a8a',
  blue: '#2563eb',
  gold: '#facc15',
  text: '#0f172a',
  muted: '#475569',
  faint: '#94a3b8',
  border: '#cbd5e1',
  red: '#b91c1c',
  redTint: '#fee2e2',
}

const s = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 72,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    // no lineHeight here or page numbers disappear
    color: C.text,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10 },
  headerText: { flex: 1, marginLeft: 10 },
  systemName: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: C.navy },
  rule: { height: 2, backgroundColor: C.navy },
  ruleAccent: { height: 1.5, backgroundColor: C.gold, marginTop: 1.5 },
  titleWrap: { alignItems: 'center', marginTop: 16, marginBottom: 12 },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 16, letterSpacing: 1.5, color: C.navy },
  subtitle: { fontSize: 9, color: C.muted, marginTop: 3 },
  meta: { flexDirection: 'row', borderWidth: 1, borderColor: C.border, borderRadius: 3, marginBottom: 16 },
  metaCell: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: C.border },
  metaCellLast: { borderRightWidth: 0 },
  metaLabel: { fontSize: 6.5, color: C.muted, letterSpacing: 0.6 },
  metaValue: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, marginTop: 2 },
  urgent: {
    alignSelf: 'flex-start',
    color: C.red,
    backgroundColor: C.redTint,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: '#ffffff',
    backgroundColor: C.navy,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  field: { marginBottom: 10 },
  fieldHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  fieldNo: { width: 16, fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: C.navy },
  fieldLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, letterSpacing: 0.3 },
  fieldValue: {
    marginLeft: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  // need fontSize w/ lineHeight
  valueText: { fontSize: 10, lineHeight: 1.45 },
  empty: { color: C.faint },
  verify: { marginTop: 8, borderWidth: 1, borderColor: C.border, borderRadius: 3, padding: 10 },
  verifyTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, letterSpacing: 0.6, color: C.navy, marginBottom: 6 },
  verifyRow: { flexDirection: 'row' },
  verifyCol: { flex: 1, marginRight: 14 },
  verifyColLast: { flex: 1 },
  signLine: { height: 30, borderBottomWidth: 0.8, borderBottomColor: C.text, marginBottom: 3 },
  verifyLabel: { fontSize: 7.5, color: C.muted },
  transcript: {
    lineHeight: 1.5,
    fontSize: 9.5,
    color: '#334155',
    borderLeftWidth: 3,
    borderLeftColor: C.blue,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  // kept separate or page numbers dont show
  footerRule: { position: 'absolute', left: 48, right: 48, bottom: 56, height: 0.5, backgroundColor: C.border },
  footerText: { position: 'absolute', bottom: 42, fontSize: 7.5, color: C.muted },
  footerLeft: { left: 48, right: 180 },
  footerRight: { right: 48, width: 130, textAlign: 'right' },
})

function Emblem() {
  return (
    <Svg viewBox="0 0 64 64" style={{ width: 38, height: 38 }}>
      <Path d="M32 3 L8 12 V30 C8 45.5 18.2 56.6 32 61 C45.8 56.6 56 45.5 56 30 V12 Z" fill="#1e3a8a" />
      <Path d="M32 3 L8 12 V30 C8 45.5 18.2 56.6 32 61 Z" fill="#2563eb" />
      <Rect x="26" y="15" width="12" height="21" rx="6" ry="6" fill="#ffffff" />
      <Path d="M20 30 A12 12 0 0 0 44 30" fill="none" stroke="#facc15" strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M32 42 V48" stroke="#facc15" strokeWidth={3.5} strokeLinecap="round" />
    </Svg>
  )
}

function MetaCell({ label, children, last }) {
  return (
    <View style={last ? [s.metaCell, s.metaCellLast] : s.metaCell}>
      <Text style={s.metaLabel}>{label.toUpperCase()}</Text>
      {children}
    </View>
  )
}

function FieldBlock({ number, field, value, lang }) {
  const text = String(value ?? '').trim()
  return (
    // only long blocks can split pages
    <View style={s.field} wrap={text.length > 900}>
      <View style={s.fieldHead}>
        <Text style={s.fieldNo}>{number}.</Text>
        <Text style={s.fieldLabel}>{field.label[lang].toUpperCase()}</Text>
      </View>
      <View style={s.fieldValue}>
        <Text style={text ? s.valueText : [s.valueText, s.empty]}>{text || '—'}</Text>
      </View>
    </View>
  )
}

// complaint pdf doc
export function ComplaintDocument({ form, transcript, audioDuration, generatedAt, lang, t }) {
  const complaintFields = COMPLAINT_FIELDS.filter((f) => f.section === 'aduan')
  const remarkFields = COMPLAINT_FIELDS.filter((f) => f.section === 'ulasan')
  const hasTranscript = Boolean(transcript?.trim())

  let source = t('doc.sourceManual')
  if (audioDuration) source = t('doc.sourceVoice', { duration: formatDuration(audioDuration) })
  else if (hasTranscript) source = t('doc.sourceVoicePlain')

  return (
    <Document
      title={t('doc.title')}
      subject={form.tajuk}
      author={APP_CONFIG.systemName}
      creator={APP_CONFIG.systemName}
      producer={APP_CONFIG.systemName}
      language={lang === 'ms' ? 'ms-MY' : 'en-GB'}
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Emblem />
          <View style={s.headerText}>
            <Text style={s.systemName}>{APP_CONFIG.systemName}</Text>
          </View>
        </View>
        <View style={s.rule} />
        <View style={s.ruleAccent} />

        <View style={s.titleWrap}>
          <Text style={s.title}>{t('doc.title')}</Text>
          <Text style={s.subtitle}>{t('doc.subtitle')}</Text>
        </View>

        <View style={s.meta}>
          <MetaCell label={t('doc.date')}>
            <Text style={s.metaValue}>{formatDateTime(generatedAt, lang)}</Text>
          </MetaCell>
          <MetaCell label={t('doc.priority')}>
            <Text style={form.priority ? [s.metaValue, s.urgent] : s.metaValue}>
              {form.priority ? t('doc.priorityUrgent') : t('doc.priorityNormal')}
            </Text>
          </MetaCell>
          <MetaCell label={t('doc.source')} last>
            <Text style={s.metaValue}>{source}</Text>
          </MetaCell>
        </View>

        <Text style={s.sectionTitle}>{t('doc.sectionA')}</Text>
        {complaintFields.map((field, i) => (
          <FieldBlock key={field.id} number={i + 1} field={field} value={form[field.id]} lang={lang} />
        ))}

        <View wrap={false}>
          <Text style={s.sectionTitle}>{t('doc.sectionB')}</Text>
          {remarkFields.map((field, i) => (
            <FieldBlock
              key={field.id}
              number={complaintFields.length + i + 1}
              field={field}
              value={form[field.id]}
              lang={lang}
            />
          ))}
          <View style={s.verify}>
            <Text style={s.verifyTitle}>{t('doc.verify')}</Text>
            <View style={s.verifyRow}>
              {['doc.sign', 'doc.name', 'doc.designation', 'doc.dateLabel'].map((key, i, all) => (
                <View key={key} style={i === all.length - 1 ? s.verifyColLast : s.verifyCol}>
                  <View style={s.signLine} />
                  <Text style={s.verifyLabel}>{t(key)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {hasTranscript && (
          <View break>
            <Text style={s.sectionTitle}>{t('doc.sectionC')}</Text>
            <Text style={s.transcript}>{transcript.trim()}</Text>
          </View>
        )}

        <View style={s.footerRule} fixed />
        <Text style={[s.footerText, s.footerLeft]} fixed>
          {t('doc.footer', { system: APP_CONFIG.systemName })}
        </Text>
        <Text
          style={[s.footerText, s.footerRight]}
          fixed
          render={({ pageNumber, totalPages }) => t('doc.page', { p: pageNumber, total: totalPages })}
        />
      </Page>
    </Document>
  )
}
