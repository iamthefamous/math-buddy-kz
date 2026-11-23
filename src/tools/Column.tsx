import { useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Message, Segmented, Steps } from '../components/ui';
import { columnAdd, columnDiv, columnMul, columnSub, type ColResult } from '../lib/column';

type Op = 'add' | 'sub' | 'mul' | 'div';
const SIGN: Record<Op, string> = { add: '+', sub: '−', mul: '×', div: ':' };
const INT = /^\d{1,15}$/;

export default function Column() {
  const { t } = useI18n();
  const [op, setOp] = useState<Op>('add');
  const [a, setA] = useState('457');
  const [b, setB] = useState('268');

  const A = a.trim();
  const B = b.trim();
  const okA = INT.test(A);
  const okB = INT.test(B);
  let error: string | null = null;
  let res: (ColResult & { r?: string }) | null = null;
  if (okA && okB) {
    const x = BigInt(A).toString();
    const y = BigInt(B).toString();
    if (op === 'sub' && BigInt(x) < BigInt(y)) error = t('col.errSub');
    else if (op === 'div' && y === '0') error = t('err.divZero');
    else res = op === 'add' ? columnAdd(x, y) : op === 'sub' ? columnSub(x, y) : op === 'mul' ? columnMul(x, y) : columnDiv(x, y);
  }

  return (
    <>
      <Card>
        <Segmented
          label={t('ui.operation')}
          value={op}
          onChange={setOp}
          options={(['add', 'sub', 'mul', 'div'] as Op[]).map((id) => ({ id, label: t(`col.${id}Name`) }))}
        />
        <div className="row">
          <Field label={t('col.a')} value={a} onChange={setA} kind="text" invalid={A !== '' && !okA} />
          <Field label={t('col.b')} value={b} onChange={setB} kind="text" invalid={B !== '' && !okB} />
        </div>
        {((A !== '' && !okA) || (B !== '' && !okB)) && <p className="field-msg">{t('col.onlyDigits')}</p>}
      </Card>
      {error && <Message kind="error">{error}</Message>}
      {res && (
        <>
          <Card title={t('ui.result')}>
            <p className="big math">
              {BigInt(A).toString()} {SIGN[op]} {BigInt(B).toString()} = {res.answer}
              {res.r && res.r !== '0' ? ` (${t('col.rem')} ${res.r})` : ''}
            </p>
            <pre className="column" aria-label={t('col.layout')}>
              {res.rows.map((r, i) => <div key={i} className={r.cls}>{r.text}</div>)}
            </pre>
          </Card>
          <Steps steps={res.steps.map((s) => t(s.key, s.p))} />
        </>
      )}
    </>
  );
}
