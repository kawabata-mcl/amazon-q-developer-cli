import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationList } from '../conversation-list'
import type { ChatConversation } from '@/types/chat'

// Mock conversations data
const mockConversations: ChatConversation[] = [
  {
    id: 'conv-1',
    title: 'React component help',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'How do I create a React component?',
        timestamp: new Date('2024-01-15T10:00:00Z'),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'You can create a React component using function syntax...',
        timestamp: new Date('2024-01-15T10:01:00Z'),
      },
    ],
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:01:00Z'),
  },
  {
    id: 'conv-2',
    title: 'TypeScript error debugging',
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'I have a TypeScript error in my code',
        timestamp: new Date('2024-01-14T15:30:00Z'),
      },
    ],
    createdAt: new Date('2024-01-14T15:30:00Z'),
    updatedAt: new Date('2024-01-14T15:30:00Z'),
  },
  {
    id: 'conv-3',
    title: 'API integration questions',
    messages: [
      {
        id: 'msg-4',
        role: 'user',
        content: 'How do I integrate with REST APIs?',
        timestamp: new Date('2024-01-13T09:15:00Z'),
      },
    ],
    createdAt: new Date('2024-01-13T09:15:00Z'),
    updatedAt: new Date('2024-01-13T09:15:00Z'),
  },
]

describe('ConversationList', () => {
  const mockOnConversationSelect = jest.fn()
  const mockOnConversationDelete = jest.fn()
  const mockOnConversationRename = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders conversation list with conversations', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    // Check if conversations are rendered
    expect(screen.getByText('React component help')).toBeInTheDocument()
    expect(screen.getByText('TypeScript error debugging')).toBeInTheDocument()
    expect(screen.getByText('API integration questions')).toBeInTheDocument()

    // Check conversation count
    expect(screen.getByText('3 conversations')).toBeInTheDocument()
  })

  test('handles conversation selection', async () => {
    const user = userEvent.setup()
    
    render(
      <ConversationList
        conversations={mockConversations}
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    // Click on first conversation
    await user.click(screen.getByText('React component help'))

    expect(mockOnConversationSelect).toHaveBeenCalledWith('conv-1')
  })

  test('filters conversations by search query', async () => {
    const user = userEvent.setup()
    
    render(
      <ConversationList
        conversations={mockConversations}
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    // Search for "React"
    const searchInput = screen.getByPlaceholderText('Search conversations...')
    await user.type(searchInput, 'React')

    // Should show only React-related conversation
    expect(screen.getByText('React component help')).toBeInTheDocument()
    expect(screen.queryByText('TypeScript error debugging')).not.toBeInTheDocument()
    expect(screen.queryByText('API integration questions')).not.toBeInTheDocument()

    // Check filtered count
    expect(screen.getByText('1 conversations')).toBeInTheDocument()
  })

  test('clears search query', async () => {
    const user = userEvent.setup()
    
    render(
      <ConversationList
        conversations={mockConversations}
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    // Search for something
    const searchInput = screen.getByPlaceholderText('Search conversations...')
    await user.type(searchInput, 'React')

    // Clear search
    const clearButton = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearButton)

    // Should show all conversations again
    expect(screen.getByText('React component help')).toBeInTheDocument()
    expect(screen.getByText('TypeScript error debugging')).toBeInTheDocument()
    expect(screen.getByText('API integration questions')).toBeInTheDocument()
  })

  test('handles conversation deletion', async () => {
    const user = userEvent.setup()
    
    // Mock window.confirm
    const mockConfirm = jest.fn(() => true)
    Object.defineProperty(window, 'confirm', {
      value: mockConfirm,
      writable: true,
    })

    render(
      <ConversationList
        conversations={mockConversations}
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    // Hover over first conversation to show delete button
    const firstConversation = screen.getByText('React component help').closest('div')
    if (firstConversation) {
      fireEvent.mouseEnter(firstConversation)
    }

    // Click delete button
    const deleteButton = screen.getByTitle('Delete conversation')
    await user.click(deleteButton)

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this conversation?')
    expect(mockOnConversationDelete).toHaveBeenCalledWith('conv-1')
  })

  test('handles conversation renaming', async () => {
    const user = userEvent.setup()
    
    render(
      <ConversationList
        conversations={mockConversations}
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    // Hover over first conversation to show edit button
    const firstConversation = screen.getByText('React component help').closest('div')
    if (firstConversation) {
      fireEvent.mouseEnter(firstConversation)
    }

    // Click edit button
    const editButton = screen.getByTitle('Rename conversation')
    await user.click(editButton)

    // Should show input field
    const input = screen.getByDisplayValue('React component help')
    expect(input).toBeInTheDocument()

    // Change title
    await user.clear(input)
    await user.type(input, 'Updated React help')

    // Save changes
    const saveButton = screen.getByText('Save')
    await user.click(saveButton)

    expect(mockOnConversationRename).toHaveBeenCalledWith('conv-1', 'Updated React help')
  })

  test('cancels conversation renaming', async () => {
    const user = userEvent.setup()
    
    render(
      <ConversationList
        conversations={mockConversations}
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    // Start editing
    const firstConversation = screen.getByText('React component help').closest('div')
    if (firstConversation) {
      fireEvent.mouseEnter(firstConversation)
    }

    const editButton = screen.getByTitle('Rename conversation')
    await user.click(editButton)

    // Cancel editing
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    // Should show original title
    expect(screen.getByText('React component help')).toBeInTheDocument()
    expect(mockOnConversationRename).not.toHaveBeenCalled()
  })

  test('sorts conversations by different criteria', async () => {
    const user = userEvent.setup()
    
    render(
      <ConversationList
        conversations={mockConversations}
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    // Open filters
    const filtersButton = screen.getByText('Filters')
    await user.click(filtersButton)

    // Change sort to alphabetical
    const sortSelect = screen.getByDisplayValue('Most Recent')
    await user.selectOptions(sortSelect, 'alphabetical')

    // Check if conversations are sorted alphabetically
    const conversationTitles = screen.getAllByText(/React component help|TypeScript error debugging|API integration questions/)
    expect(conversationTitles[0]).toHaveTextContent('API integration questions')
    expect(conversationTitles[1]).toHaveTextContent('React component help')
    expect(conversationTitles[2]).toHaveTextContent('TypeScript error debugging')
  })

  test('filters conversations by time period', async () => {
    const user = userEvent.setup()
    
    render(
      <ConversationList
        conversations={mockConversations}
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    // Open filters
    const filtersButton = screen.getByText('Filters')
    await user.click(filtersButton)

    // Filter by today (should show no conversations since mock data is from past dates)
    const timeSelect = screen.getByDisplayValue('All Time')
    await user.selectOptions(timeSelect, 'today')

    // Should show no conversations
    expect(screen.getByText('No conversations found')).toBeInTheDocument()
  })

  test('shows empty state when no conversations', () => {
    render(
      <ConversationList
        conversations={[]}
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    expect(screen.getByText('No conversations yet')).toBeInTheDocument()
    expect(screen.getByText('0 conversations')).toBeInTheDocument()
  })

  test('highlights current conversation', () => {
    render(
      <ConversationList
        conversations={mockConversations}
        currentConversationId="conv-2"
        onConversationSelect={mockOnConversationSelect}
        onConversationDelete={mockOnConversationDelete}
        onConversationRename={mockOnConversationRename}
      />
    )

    // Check if the current conversation has the active styling
    const activeConversation = screen.getByText('TypeScript error debugging').closest('div')
    expect(activeConversation).toHaveClass('border-blue-500')
  })
})