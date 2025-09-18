import '@testing-library/jest-dom'
import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import type { ConversationStats as StatsType } from '@/types/chat'

// Mock the useChat hook (ESM-safe)
const mockGetConversationStats = jest.fn<() => Promise<StatsType>>()

jest.mock('@/hooks/use-chat', () => ({
  __esModule: true,
  useChat: jest.fn(),
}))
const useChatModule = jest.requireMock('@/hooks/use-chat') as { useChat: jest.Mock }
// Import component after setting up mocks
const { ConversationStats } = require('../conversation-stats')

const mockStats: StatsType = {
  total_conversations: 25,
  total_messages: 150,
  conversations_today: 3,
  conversations_this_week: 8,
  conversations_this_month: 15,
}

describe('ConversationStats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useChatModule.useChat.mockImplementation(() => ({
      getConversationStats: mockGetConversationStats,
    }))
  })

  test('renders loading state initially', () => {
    mockGetConversationStats.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<ConversationStats />)

    expect(screen.getByText('Conversation Statistics')).toBeTruthy()
    
    // Check for loading skeletons
    const skeletons = screen.getAllByRole('generic')
    const loadingSkeletons = skeletons.filter(el => el.classList.contains('animate-pulse'))
    expect(loadingSkeletons.length).toBeGreaterThan(0)
  })

  test('renders statistics when loaded successfully', async () => {
    mockGetConversationStats.mockResolvedValue(mockStats)
    
    render(<ConversationStats />)

    await waitFor(() => {
      expect(screen.getByText('25')).toBeTruthy()
    })

    // Check all stat values
    expect(screen.getByText('25')).toBeTruthy() // Total conversations
    expect(screen.getByText('150')).toBeTruthy() // Total messages
    expect(screen.getByText('3')).toBeTruthy() // Today
    expect(screen.getByText('8')).toBeTruthy() // This week
    expect(screen.getByText('15')).toBeTruthy() // This month

    // Check labels
    expect(screen.getByText('Total Conversations')).toBeTruthy()
    expect(screen.getByText('Total Messages')).toBeTruthy()
    expect(screen.getByText('Today')).toBeTruthy()
    expect(screen.getByText('This Week')).toBeTruthy()
    expect(screen.getByText('This Month')).toBeTruthy()
  })

  test('calculates and displays insights correctly', async () => {
    mockGetConversationStats.mockResolvedValue(mockStats)
    
    render(<ConversationStats />)

    await waitFor(() => {
      expect(screen.getByText('Insights')).toBeTruthy()
    })

    // Check average messages per conversation (150 / 25 = 6)
    expect(screen.getByText('6')).toBeTruthy()

    // Check activity rate (8 / 25 * 100 = 32%)
    expect(screen.getByText('32%')).toBeTruthy()

    // Check active today indicator
    expect(screen.getByText('3 conversations')).toBeTruthy()
  })

  test('handles zero conversations gracefully', async () => {
    const emptyStats: StatsType = {
      total_conversations: 0,
      total_messages: 0,
      conversations_today: 0,
      conversations_this_week: 0,
      conversations_this_month: 0,
    }

    mockGetConversationStats.mockResolvedValue(emptyStats)
    
    render(<ConversationStats />)

    await waitFor(() => {
      expect(screen.getByText('Insights')).toBeTruthy()
    })

    // Check that average is 0 when no conversations
    const averageElements = screen.getAllByText('0')
    expect(averageElements.length).toBeGreaterThan(0)
  })

  test('renders error state when stats loading fails', async () => {
    const errorMessage = 'Failed to load statistics'
    mockGetConversationStats.mockRejectedValue(new Error(errorMessage))
    
    render(<ConversationStats />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load statistics/)).toBeTruthy()
    })

    // Should still show the header
    expect(screen.getByText('Conversation Statistics')).toBeTruthy()
  })

  test('formats large numbers correctly', async () => {
    const largeStats: StatsType = {
      total_conversations: 1234,
      total_messages: 56789,
      conversations_today: 12,
      conversations_this_week: 89,
      conversations_this_month: 234,
    }

    mockGetConversationStats.mockResolvedValue(largeStats)
    
    render(<ConversationStats />)

    await waitFor(() => {
      // Check that numbers are formatted with commas
      expect(screen.getByText(/1,234/)).toBeTruthy()
      expect(screen.getByText(/56,789/)).toBeTruthy()
    })
  })

  test('shows correct activity indicators', async () => {
    mockGetConversationStats.mockResolvedValue(mockStats)
    
    render(<ConversationStats />)

    await waitFor(() => {
      expect(screen.getByText('Insights')).toBeTruthy()
    })

    // Should show "Active today" when conversations_today > 0
    expect(screen.getByText(/Active today:/)).toBeTruthy()
    expect(screen.getByText('3 conversations')).toBeTruthy()

    // Should show activity rate
    expect(screen.getByText('Activity rate (week):')).toBeTruthy()
  })

  test('handles stats with no activity today', async () => {
    const noTodayStats: StatsType = {
      total_conversations: 10,
      total_messages: 50,
      conversations_today: 0,
      conversations_this_week: 2,
      conversations_this_month: 5,
    }

    mockGetConversationStats.mockResolvedValue(noTodayStats)
    
    render(<ConversationStats />)

    await waitFor(() => {
      expect(screen.getByText('Insights')).toBeTruthy()
    })

    // Should not show "Active today" when conversations_today is 0
    expect(screen.queryByText('Active today:')).toBeNull()
  })

  test('applies custom className', () => {
    mockGetConversationStats.mockResolvedValue(mockStats)
    
    const { container } = render(<ConversationStats className="custom-class" />)
    
    const statsCard = container.querySelector('.custom-class')
    expect(statsCard).toBeTruthy()
  })
})