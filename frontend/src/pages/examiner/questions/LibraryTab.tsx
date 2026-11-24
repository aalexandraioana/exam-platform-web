import { useTranslation } from 'react-i18next'
import type { LibraryEntry } from '../../../api/questions'
import Button from '../../../components/Button'

// DS-007 "Bibliotecă comună" (D-027, D-040): every published entry; copy one into your bank.
export default function LibraryTab({ entries, onCopy }: { entries: LibraryEntry[]; onCopy: (entry: LibraryEntry) => void }) {
  const { t } = useTranslation()
  const cell = 'border-b border-subtle px-4 py-3 align-top'
  const head = 'border-b border-subtle bg-surface-subtle px-4 py-3 text-left text-caption font-semibold text-secondary'

  if (entries.length === 0) {
    return <p className="rounded-lg border border-dashed border-strong px-6 py-12 text-center text-secondary">{t('bank.libraryEmpty')}</p>
  }
  return (
    <div className="overflow-hidden rounded-lg border border-subtle bg-surface shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={head}>{t('bank.colCode')}</th>
              <th className={head}>{t('bank.colStatement')}</th>
              <th className={head}>{t('bank.colCompetence')}</th>
              <th className={`${head} hidden tablet:table-cell`}>{t('bank.colType')}</th>
              <th className={`${head} hidden tablet:table-cell`}>{t('bank.colAuthor')}</th>
              <th className={head}>{t('bank.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className={`${cell} whitespace-nowrap font-mono text-caption`}>{entry.code}</td>
                <td className={`${cell} w-full max-w-0 truncate`} title={entry.statement ?? ''}>{entry.statement}</td>
                <td className={cell}>
                  <span className="grid justify-items-start gap-1">
                    {entry.competence && <span className="rounded-sm bg-surface-subtle px-2 text-caption text-secondary">{entry.competence.code}</span>}
                    <span className="text-caption text-secondary">{entry.topic?.name ?? t('bank.noTopic')}</span>
                  </span>
                </td>
                <td className={`${cell} hidden tablet:table-cell`}>{t(`bank.type.${entry.type}`)}</td>
                <td className={`${cell} hidden tablet:table-cell`}>{entry.author}</td>
                <td className={cell}>
                  {entry.copied_as ? (
                    <span className="whitespace-nowrap rounded-full bg-success-bg px-2 text-caption font-semibold text-success">{t('bank.copiedAs', { code: entry.copied_as })}</span>
                  ) : (
                    <Button className="whitespace-nowrap" onClick={() => onCopy(entry)}>{t('bank.copy')}</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 text-caption text-secondary">{t('bank.libraryNote')}</p>
    </div>
  )
}
