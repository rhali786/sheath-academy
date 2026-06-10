import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PersonalTodoList } from '@/features/todos/front/components/PersonalTodoList'
import type { PersonalTodo } from '@/features/todos/types'

jest.mock('@/features/todos/front/services/api', () => ({
  todosApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    toggle: jest.fn(),
    remove: jest.fn(),
    reorder: jest.fn(),
  },
}))

import { todosApi } from '@/features/todos/front/services/api'

const mockList = todosApi.list as jest.Mock
const mockCreate = todosApi.create as jest.Mock
const mockToggle = todosApi.toggle as jest.Mock
const mockRemove = todosApi.remove as jest.Mock

function makeTodo(overrides: Partial<PersonalTodo> = {}): PersonalTodo {
  return {
    id: 'todo_1',
    householdId: 'hh_test',
    text: 'Buy curriculum books',
    done: false,
    dueDate: null,
    sortOrder: 0,
    completedAt: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

function envelope<T>(data: T) {
  return { status: 'success' as const, data, message: 'ok', timestamp: '2026-06-08T00:00:00.000Z' }
}

beforeEach(() => {
  mockList.mockReset()
  mockCreate.mockReset()
  mockToggle.mockReset()
  mockRemove.mockReset()
})

describe('PersonalTodoList', () => {
  it('renders a loading state while fetching', () => {
    mockList.mockReturnValue(new Promise(() => {}))
    render(<PersonalTodoList />)
    expect(screen.getByTestId('personal-todo-list')).toBeInTheDocument()
    expect(screen.queryByText(/no to-dos yet/i)).not.toBeInTheDocument()
  })

  it('renders the empty state', async () => {
    mockList.mockResolvedValue(envelope([]))
    render(<PersonalTodoList />)
    expect(await screen.findByText(/No to-dos yet — add one for curriculum or supply planning/i)).toBeInTheDocument()
  })

  it('renders an error state with a retry affordance', async () => {
    mockList.mockRejectedValue(new Error('boom'))
    render(<PersonalTodoList />)
    const retry = await screen.findByRole('button', { name: /retry/i })
    expect(retry).toBeInTheDocument()

    mockList.mockResolvedValue(envelope([makeTodo()]))
    fireEvent.click(retry)
    expect(await screen.findByText('Buy curriculum books')).toBeInTheDocument()
  })

  it('renders the populated, ordered list', async () => {
    mockList.mockResolvedValue(envelope([
      makeTodo({ id: 'todo_1', text: 'Buy curriculum books', sortOrder: 0 }),
      makeTodo({ id: 'todo_2', text: 'Plan field trip', sortOrder: 1 }),
    ]))
    render(<PersonalTodoList />)
    const items = await screen.findAllByRole('checkbox')
    expect(items).toHaveLength(2)
    expect(screen.getByText('Buy curriculum books')).toBeInTheDocument()
    expect(screen.getByText('Plan field trip')).toBeInTheDocument()
  })

  it('adds a to-do via the inline input', async () => {
    mockList.mockResolvedValue(envelope([]))
    mockCreate.mockResolvedValue(envelope(makeTodo({ id: 'todo_new', text: 'Plan field trip' })))
    render(<PersonalTodoList />)
    await screen.findByText(/no to-dos yet/i)

    fireEvent.change(screen.getByLabelText(/new to-do text/i), { target: { value: 'Plan field trip' } })
    fireEvent.click(screen.getByRole('button', { name: /add to-do/i }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({ text: 'Plan field trip' }))
    expect(await screen.findByText('Plan field trip')).toBeInTheDocument()
  })

  it('toggles a to-do as done', async () => {
    mockList.mockResolvedValue(envelope([makeTodo({ id: 'todo_1', text: 'Buy curriculum books', done: false })]))
    mockToggle.mockResolvedValue(envelope(makeTodo({ id: 'todo_1', text: 'Buy curriculum books', done: true, completedAt: '2026-06-08T00:00:00.000Z' })))
    render(<PersonalTodoList />)

    const checkbox = await screen.findByRole('checkbox', { name: /mark "buy curriculum books" as done/i })
    fireEvent.click(checkbox)

    await waitFor(() => expect(mockToggle).toHaveBeenCalledWith('todo_1', true))
  })

  it('deletes a to-do via the destructive confirm pattern', async () => {
    mockList.mockResolvedValue(envelope([makeTodo({ id: 'todo_1', text: 'Buy curriculum books' })]))
    mockRemove.mockResolvedValue(envelope(null))
    render(<PersonalTodoList />)
    await screen.findByText('Buy curriculum books')

    fireEvent.click(screen.getByRole('button', { name: /delete "buy curriculum books"/i }))
    expect(await screen.findByText(/delete this to-do\?/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.queryByText(/delete this to-do\?/i)).not.toBeInTheDocument()
    expect(mockRemove).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /delete "buy curriculum books"/i }))
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('todo_1'))
    await waitFor(() => expect(screen.queryByText('Buy curriculum books')).not.toBeInTheDocument())
  })
})
