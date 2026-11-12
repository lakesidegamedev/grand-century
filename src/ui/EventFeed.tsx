import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { useSnapshotFields } from './useSnapshotFields';
import {
  batchAlerts,
  selectToastBatches,
  TOAST_AUTO_DISMISS_MS,
  TOAST_STACK_CAP,
  type AlertBatch,
} from './alertBatching';
import { NationFlag } from './components/NationFlag';
import { instantPressProps } from './instantPress';

/** Find the first nation named in the message (by name, never by raw tag). */
function findMentionedNation<T extends { name: string }>(message: string, nations: T[]): T | null {
  let best: T | null = null;
  let bestIndex = Infinity;
  for (const nation of nations) {
    const index = message.indexOf(nation.name);
    if (index >= 0 && index < bestIndex) {
      best = nation;
      bestIndex = index;
    }
  }
  return best;
}

export function EventFeed() {
  const alerts = useStore((state) => state.alerts);
  const snapshot = useSnapshotFields(['nations', 'playerNation'] as const);
  const openPanelId = useStore((state) => state.openPanelId);
  const dismissAlert = useStore((state) => state.dismissAlert);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const nationList = useMemo(() => (
    snapshot ? snapshot.nations.map((n) => ({ name: n.name, tag: n.tag, color: n.color })) : []
  ), [snapshot?.nations]);
  const eventModalOpen = (useSnapshotFields(['pendingPlayerEvents'] as const)?.pendingPlayerEvents?.length ?? 0) > 0;

  const playerName = useMemo(() => {
    if (!snapshot) return null;
    return snapshot.nations.find((n) => n.id === snapshot.playerNation)?.name ?? null;
  }, [snapshot?.nations, snapshot?.playerNation]);

  const toasts = useMemo(() => {
    const batches = batchAlerts(alerts, playerName);
    return selectToastBatches(batches, TOAST_STACK_CAP)
      .filter((batch) => !hiddenIds.includes(batch.id));
  }, [alerts, playerName, hiddenIds]);

  const toastKey = toasts.map((batch) => batch.id).join('|');

  useEffect(() => {
    if (!toastKey) return;
    const ephemeral = toasts.filter((batch) => (
      batch.kind !== 'war'
      && batch.kind !== 'rebellion'
      && batch.kind !== 'formation'
    ));
    if (ephemeral.length === 0) return;
    const timers = ephemeral.map((batch) => window.setTimeout(() => {
      // Hide toast only — keep the alert in the outliner for calm review.
      setHiddenIds((prev) => (prev.includes(batch.id) ? prev : [...prev, batch.id]));
    }, TOAST_AUTO_DISMISS_MS));
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
    // toastKey captures identity; toasts is read for kind filtering on that key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastKey]);

  // Keep the map calm: no despatch cards stacked behind an open event modal.
  if (toasts.length === 0 || eventModalOpen) return null;

  const dismissBatch = (batch: AlertBatch) => {
    setHiddenIds((prev) => (prev.includes(batch.id) ? prev : [...prev, batch.id]));
    for (const member of batch.members) dismissAlert(member.id);
  };

  return (
    <div className="event-feed" data-testid="event-feed" aria-live="polite">
      {toasts.map((batch) => {
        const nation = findMentionedNation(batch.message, nationList);
        return (
          <article
            key={batch.id}
            className={`event-card atlas-panel event-${batch.kind}${batch.count > 1 ? ' is-batched' : ''}`}
            data-testid="event-toast"
            data-kind={batch.kind}
            data-count={batch.count}
          >
            <div className="event-card__head">
              {nation ? <NationFlag tag={nation.tag} color={nation.color} size={16} /> : null}
              <strong>Despatch · {batch.kind}{batch.count > 1 ? ` · ${batch.count}` : ''}</strong>
            </div>
            <span>{batch.message}</span>
            {batch.suggestion && batch.count === 1 ? <small>{batch.suggestion}</small> : null}
            {batch.expandable ? (
              <button
                type="button"
                className="event-card__expand"
                {...instantPressProps(() => setExpandedId((id) => (id === batch.id ? null : batch.id)))}
              >
                {expandedId === batch.id ? 'Hide details' : 'Show details'}
              </button>
            ) : null}
            {expandedId === batch.id ? (
              <ul className="event-card__members">
                {batch.members.map((member) => (
                  <li key={member.id}>{member.message}</li>
                ))}
              </ul>
            ) : null}
            <div className="event-card__actions">
              {batch.panel ? (
                <button
                  type="button"
                  {...instantPressProps(() => {
                    openPanelId(batch.panel);
                    dismissBatch(batch);
                  })}
                >
                  Open
                </button>
              ) : null}
              <button type="button" {...instantPressProps(() => dismissBatch(batch))}>
                Dismiss
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
