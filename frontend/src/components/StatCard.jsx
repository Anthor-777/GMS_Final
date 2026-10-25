import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

function CountUp({ value, prefix = '', suffix = '', decimals = 0 }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    const n = Number(latest);
    return `${prefix}${n.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}${suffix}`;
  });

  useEffect(() => {
    const controls = animate(motionValue, Number(value) || 0, { duration: 0.9, ease: 'easeOut' });
    return controls.stop;
  }, [value, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}

export default function StatCard({ title, value, icon: Icon, prefix, suffix, decimals = 0, delay = 0, accent = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-line bg-card p-5 shadow-glow-sm transition hover:border-primary/50 hover:shadow-glow"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-ink-secondary">{title}</p>
        {Icon ? (
          <div className={`rounded-xl p-2 ${accent ? 'bg-accent/15 text-accent' : 'bg-primary/15 text-primary'}`}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink">
        <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
    </motion.div>
  );
}
