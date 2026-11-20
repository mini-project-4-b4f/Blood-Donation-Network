import { useLanguage } from '../../context/LanguageContext';
import type { ExcludedDonorsSummary as ExcludedCounts } from '../../types/request.types';

interface ExcludedDonorsSummaryProps {
  excludedSummary: ExcludedCounts;
}

export function ExcludedDonorsSummary({ excludedSummary }: ExcludedDonorsSummaryProps) {
  const { t } = useLanguage();
  return (
    <section className="eligible-donors-excluded" aria-label={t("Excluded donors summary")}>
      <div className="eligible-donors-excluded__card eligible-donors-excluded__card--rest">
        <h2 className="eligible-donors-excluded__title">{t('In Rest Period')}</h2>
        <p className="eligible-donors-excluded__count">{excludedSummary.restPeriod} {t('donors')}</p>
        <p className="eligible-donors-excluded__description">{t('Compatible donors in this area inside their 56-day cooldown.')}</p>
      </div>
      <div className="eligible-donors-excluded__card">
        <h2 className="eligible-donors-excluded__title">{t('Unavailable')}</h2>
        <p className="eligible-donors-excluded__count">{excludedSummary.unavailable} {t('donors')}</p>
        <p className="eligible-donors-excluded__description">{t('Active, non-resting compatible donors in this area currently marked unavailable.')}</p>
      </div>
      <div className="eligible-donors-excluded__card eligible-donors-excluded__card--inactive">
        <h2 className="eligible-donors-excluded__title">{t('Inactive accounts')}</h2>
        <p className="eligible-donors-excluded__count">{excludedSummary.inactive} {t('donors')}</p>
        <p className="eligible-donors-excluded__description">{t('Deactivated compatible donor accounts in this area.')}</p>
      </div>
    </section>
  );
}
