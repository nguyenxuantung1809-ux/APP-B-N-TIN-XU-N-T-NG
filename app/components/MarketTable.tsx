import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { changeTone, formatMarketNumber, formatPercent, formatShortDate } from '../lib/formatters';
import type { BulletinLabels, BulletinLocale, MarketSection } from '../types/bulletin';
import { GoldBarIcon, OilBarrelIcon } from './BulletinIcons';
import type { EditableImageRenderer } from './EditableImage';

const CURRENCY_FLAGS: Record<string, { code: string; label: string }> = {
  'USD INDEX': { code: 'us', label: 'United States' },
  EURUSD: { code: 'eu', label: 'European Union' },
  USDCNY: { code: 'cn', label: 'China' },
  USDJPY: { code: 'jp', label: 'Japan' },
  USDKRW: { code: 'kr', label: 'South Korea' },
  USDSGD: { code: 'sg', label: 'Singapore' },
  USDTWD: { code: 'tw', label: 'Taiwan' },
  USDTHB: { code: 'th', label: 'Thailand' },
};

const COMMODITY_ICONS: Record<string, { label: string; node: React.ReactNode }> = {
  OIL: { label: 'Oil barrel', node: <OilBarrelIcon /> },
  GOLD: { label: 'Premium gold bar', node: <GoldBarIcon /> },
  '.DJI': { label: 'United States flag', node: <span className="fi fi-us" role="img" aria-label="United States" title="United States" /> },
};

interface MarketTableProps {
  kind: 'currencies' | 'commodities';
  title: string;
  section: MarketSection;
  icon: React.ReactNode;
  labels: BulletinLabels['table'];
  locale: BulletinLocale;
  renderEditableImage: EditableImageRenderer;
}

export function MarketTable({ kind, title, section, icon, labels, locale, renderEditableImage }: MarketTableProps) {
  return (
    <section className="data-card market-table-card">
      <div className="data-card-heading">
        <div className="section-icon">{icon}</div>
        <div><span className="section-label">{locale === 'vi' ? 'Dữ liệu thị trường' : 'Market data'}</span><h2>{title}</h2></div>
        {section.asOf !== null && <span className="as-of">{locale === 'vi' ? 'Ngày' : 'As of'} {formatShortDate(section.asOf, locale)}</span>}
      </div>
      <div className="table-scroll">
        <table className="market-table">
          <thead><tr><th>{labels.instrument}</th><th>{labels.open}</th><th>{labels.close}</th><th>{labels.high}</th><th>{labels.low}</th><th>{labels.change}</th></tr></thead>
          <tbody>
            {section.rows.map((row) => {
              const tone = changeTone(row.change);
              const instrumentKey = row.instrument.trim().toUpperCase();
              const flag = kind === 'currencies' ? CURRENCY_FLAGS[instrumentKey] : undefined;
              const commodityIcon = kind === 'commodities' ? COMMODITY_ICONS[instrumentKey] : undefined;
              const changeIcon = tone === 'positive' ? <ArrowUpRight size={14} /> : tone === 'negative' ? <ArrowDownRight size={14} /> : <Minus size={14} />;
              return (
                <tr key={row.instrument}>
                  <td data-label={labels.instrument}><span className="instrument-with-flag">{flag && renderEditableImage(`currencyFlag:${instrumentKey}`, `${flag.label} flag`, { defaultNode: <span className={`fi fi-${flag.code}`} role="img" aria-label={flag.label} title={flag.label} />, className: 'currency-flag-image', sizes: '36px' })}{commodityIcon && renderEditableImage(`commodityIcon:${instrumentKey}`, commodityIcon.label, { defaultNode: commodityIcon.node, className: 'commodity-instrument-icon', sizes: '42px' })}<strong>{row.instrument}</strong></span></td>
                  <td data-label={labels.open}>{formatMarketNumber(row.open)}</td>
                  <td data-label={labels.close}>{formatMarketNumber(row.close)}</td>
                  <td data-label={labels.high}>{formatMarketNumber(row.high)}</td>
                  <td data-label={labels.low}>{formatMarketNumber(row.low)}</td>
                  <td data-label={labels.change}><span className={`change-pill ${tone}`}>
                    {renderEditableImage(`marketChangeIcon:${kind}:${instrumentKey}`, `${row.instrument} change icon`, { defaultNode: changeIcon, className: 'market-change-icon', sizes: '28px' })}
                    {formatPercent(row.change)}
                  </span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
