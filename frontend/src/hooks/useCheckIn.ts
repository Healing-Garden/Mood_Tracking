import { useEffect } from 'react'
import { useDailyCheckInStore } from '../store/dailyCheckInStore'

type UseDailyCheckInResult = {
  showModal: boolean
  closeModal: () => void
  hasCheckedInToday: boolean
}

export const useDailyCheckIn = (): UseDailyCheckInResult => {
  const {
    lastCheckInDate,
    showModal,
    hasCheckedInToday: hasCheckedInTodayFn,
    setShowModal,
  } = useDailyCheckInStore()

  useEffect(() => {
    if (!hasCheckedInTodayFn()) {
      setShowModal(true)
    }
  }, [lastCheckInDate, hasCheckedInTodayFn, setShowModal])

  return {
    showModal,
    closeModal: () => setShowModal(false),
    hasCheckedInToday: hasCheckedInTodayFn(),
  }
}
