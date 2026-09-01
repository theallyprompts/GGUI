import { useEffect } from 'react'
import { useAccountStore } from '../store/account.store'
import { usePreferencesStore } from '../store/preferences.store'
import { Modal } from './Modal'

export function SpendAlerts() {
  const balance = useAccountStore((s) => s.balance)
  const sessionSpend = usePreferencesStore((s) => s.sessionSpend)
  const spendCap = usePreferencesStore((s) => s.spendCap)
  const lowBalanceFloor = usePreferencesStore((s) => s.lowBalanceFloor)
  const spendCapAlerted = usePreferencesStore((s) => s.spendCapAlerted)
  const setSpendCapAlerted = usePreferencesStore((s) => s.setSpendCapAlerted)
  const lowBalanceAlerted = usePreferencesStore((s) => s.lowBalanceAlerted)
  const setLowBalanceAlerted = usePreferencesStore((s) => s.setLowBalanceAlerted)

  const spendCapCrossed = spendCap !== null && sessionSpend >= spendCap
  const lowBalanceCrossed = lowBalanceFloor !== null && balance !== null && balance <= lowBalanceFloor

  // Re-arm each alert once its value moves back under the threshold, so a later crossing pops again.
  useEffect(() => {
    if (!spendCapCrossed && spendCapAlerted) setSpendCapAlerted(false)
  }, [spendCapCrossed, spendCapAlerted, setSpendCapAlerted])
  useEffect(() => {
    if (!lowBalanceCrossed && lowBalanceAlerted) setLowBalanceAlerted(false)
  }, [lowBalanceCrossed, lowBalanceAlerted, setLowBalanceAlerted])

  const showSpendCapPopup = spendCapCrossed && !spendCapAlerted
  const showLowBalancePopup = !showSpendCapPopup && lowBalanceCrossed && !lowBalanceAlerted

  return (
    <>
      {showSpendCapPopup && spendCap !== null && (
        <Modal title="Session spend cap reached" onClose={() => setSpendCapAlerted(true)}>
          <div className="space-y-3">
            <p className="text-sm text-neutral-20">
              You've spent <span className="font-mono text-neutral-5">${sessionSpend.toFixed(4)}</span> this
              session, which is at or above your cap of{' '}
              <span className="font-mono text-neutral-5">${spendCap.toFixed(2)}</span>.
            </p>
            <p className="text-xs text-neutral-40">
              You can raise or remove this cap, or reset the counter, from the Usage & Spend modal.
            </p>
            <button
              onClick={() => setSpendCapAlerted(true)}
              className="w-full rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid"
            >
              Got it
            </button>
          </div>
        </Modal>
      )}

      {showLowBalancePopup && lowBalanceFloor !== null && balance !== null && (
        <Modal title="Low account balance" onClose={() => setLowBalanceAlerted(true)}>
          <div className="space-y-3">
            <p className="text-sm text-neutral-20">
              Your Runware account balance is{' '}
              <span className="font-mono text-neutral-5">${balance.toFixed(2)}</span>, at or below your
              warning floor of <span className="font-mono text-neutral-5">${lowBalanceFloor.toFixed(2)}</span>.
            </p>
            <p className="text-xs text-neutral-40">
              You can top up at my.runware.ai, or adjust this floor from the Usage & Spend modal.
            </p>
            <button
              onClick={() => setLowBalanceAlerted(true)}
              className="w-full rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-green-mid"
            >
              Got it
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
