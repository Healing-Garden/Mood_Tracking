import { useEffect } from 'react'

import { useDailyCheckInStore } from '../store/dailyCheckInStore'
import { dailyCheckInApi } from '../api/dailyCheckInApi'

type UseDailyCheckInResult = {
  showModal: boolean
  closeModal: () => void
  hasCheckedInToday: boolean
}

export const useDailyCheckIn = (): UseDailyCheckInResult => {
  const {
    lastCheckInDate,
    showModal,
    setShowModal,
  } = useDailyCheckInStore()

  useEffect(() => {
    const checkTodayFromServer = async () => {
      try {
        await dailyCheckInApi.getToday()
        // Đã có bản ghi check-in hôm nay -> không mở modal
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 404) {
          // Chưa check-in hôm nay -> mở modal
          setShowModal(true)
        } else {
          console.error('Failed to fetch today check-in:', error)
        }
      }
    }

    void checkTodayFromServer()
  }, [lastCheckInDate, setShowModal])

  return {
    showModal,
    closeModal: () => setShowModal(false),
    // hasCheckedInToday hiện tại được quyết định bởi server; ở đây chỉ trả về true nếu đã có check-in trong lần fetch gần nhất
    hasCheckedInToday: !showModal,
  }
}
