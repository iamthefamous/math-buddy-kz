import { useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome } from '../components/ui';
import { factorize, gcd, lcm } from '../lib/numtheory';
import { superscript } from '../lib/format';

const MAX = 1e12;
const factorStr = (fs: [number, number][]) => fs.map(([p, e]) => (e > 1 ? `${p}${superscript(e)}` : `${p}`)).join(' · ');

export default function GcdLcm() {
  const { t } = useI18n();
  const [src, setSrc] = useState('84, 90, 126');

  const parts = src.split(/[\s,;]+/).filter(Boolean);
  const nums = parts.map(Number);
  const valid = parts.length >= 2 && nums.every((n) => Number.isInteger(n) && n >= 1 && n <= MAX);
  const steps: string[] = [];
  let rows = null;

  if (valid) {
    const fs = nums.map(factorize);
    nums.forEach((n, i) => steps.push(n === 1 ? '1 = 1' : `${n} = ${factorStr(fs[i])}`));
    const primes = [...new Set(fs.flat().map(([p]) => p))].sort((a, b) => a - b);
    const exp = (f: [number, number][], p: number) => f.find(([q]) => q === p)?.[1] ?? 0;
    const common = primes.map((p) => [p, Math.min(...fs.map((f) => exp(f, p)))] as [number, number]).filter(([, e]) => e > 0);
    const all = primes.map((p) => [p, Math.max(...fs.map((f) => exp(f, p)))] as [number, number]);
    const g = nums.reduce(gcd);
    const l = nums.reduce(lcm);
    const lcmSafe = Number.isSafeInteger(l);
    steps.push(t('gcd.gcdStep', { f: common.length ? factorStr(common) : '1', v: g }));
    if (lcmSafe) steps.push(t('gcd.lcmStep', { f: all.length ? factorStr(all) : '1', v: l }));
    if (nums.length === 2) steps.push(t('gcd.check', { a: nums[0], b: nums[1], g, l: lcmSafe ? l : '…' }));
    rows = [
      { label: t('gcd.gcd'), value: String(g), main: true },
      { label: t('gcd.lcm'), value: lcmSafe ? String(l) : t('err.tooBig'), main: true },
      ...(g === 1 ? [{ label: t('gcd.coprime'), value: '✓' }] : []),
    ];
  }

  return (
    <>
      <Card>
        <Field label={t('gcd.numbers')} value={src} onChange={setSrc} kind="text" wide invalid={src.trim() !== '' && !valid} placeholder="12, 18" />
        <p className="hint">{t('gcd.help')}</p>
      </Card>
      <Outcome hint={!valid ? t('gcd.help') : null} rows={rows ?? []} steps={steps} />
    </>
  );
}
