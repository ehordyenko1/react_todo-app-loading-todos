/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import { client } from './utils/fetchClient';

export const App: React.FC = () => {
const [todos, setTodos] = useState<Todo[]>([]);
const [isLoading, setLoading] = useState(false);
const [loadingTodoId, setLoadingTodoId] = useState<number | null>(null);
const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
const [title, setTitle] = useState<string>('');
const [titleError, setTitleError] = useState<boolean>(false);
const [errorType, setErrorType] = useState<null | 'load' | 'emptyTitle' | 'add' | 'delete' | 'update'>(null);

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const visibleCount = filteredTodos.length;

  const updateTodo = (id: number, data: Partial<Todo>): Promise<Todo> => {
    return client.patch<Todo>(`/todos/${id}`, data);
  };

  const handleToggle = async (todo: Todo) => {
    setLoadingTodoId(todo.id);

    try {
      const updatedTodo = await updateTodo(todo.id, {
        completed: !todo.completed,
      });
   
    setTodos(prevTodos =>
      prevTodos.map(t => (t.id === todo.id ? updatedTodo : t))
    );

    setErrorType(null);

    } catch (error) {
      setErrorType('update');
    } finally {
      setLoadingTodoId(null);
    }
  };


  const handleChange = (e:any) => {
    setTitle(e.target.value);
  };

  const handleDelete = (id: number) => {
  client.delete(`/todos/${id}`)
    .then(() => {
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      setErrorType(null);
    })
    .catch(() => {
      setErrorType('delete');
    });
  };

  const handleClearAll = () => {
    const completedTodos = todos.filter(todo => todo.completed);

    Promise.all(completedTodos.map(todo =>
      client.delete(`/todos/${todo.id}`)
    ))
      .then(() => {
        setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
        setErrorType(null);
      })
      .catch(() => {
        setErrorType('delete');
      });
  };


  const handleSubmit = (e:any) => {
    e.preventDefault();

    if (!title.trim()) {
      setTitleError(true);
      setErrorType('emptyTitle');
      return;
    }

    client.post<Todo>('/todos', {

    userId: USER_ID,
    title: title,
    completed: false,

    })
    .then(newTodo => {
      setTodos(prev => [...prev, newTodo]);
      setTitle('');
    })
  };

useEffect(() => {
  setLoading(true);

  client.get<Todo[]>(`/todos?userId=${USER_ID}`)
    .then(fetchedTodos => {
      setTodos(fetchedTodos);
      setLoading(false);
    })
    .catch(() => {
      setErrorType('load');
      setErrorType(null);
      setLoading(false);
    });
}, []);


  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              value={title}
              placeholder="What needs to be done?"
              className={`todoapp__new-todo ${titleError ? 'error' : ''}`}
              onChange={e => {
                setTitle(e.target.value);
                if (titleError && e.target.value.trim()) {
                  setTitleError(false);
                }
                handleChange(e);
              }}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {todos.length === 0 ? null : (
              filteredTodos.map(todo => (
                <div key={todo.id} className={`todo ${todo.completed ? 'completed' : ''}`}>
                  <label className="todo__status-label">
                    <input
                      data-cy="TodoStatus"
                      type="checkbox"
                      className="todo__status active"
                      checked={todo.completed}
                      disabled={loadingTodoId === todo.id}
                      onChange={() => handleToggle(todo)}
                    />
                  </label>

                  <span data-cy="TodoTitle" className="todo__title">
                    {todo.title}
                  </span>

                  <button 
                    type="button"
                    className="todo__remove" 
                    data-cy="TodoDelete"
                    onClick={() => handleDelete(todo.id)}
                  >
                    ×
                  </button>
                </div>
              ))
          )}
        </section>

        {/* Hide the footer if there are no todos */}
        <footer className="todoapp__footer" data-cy="Footer">
          <span className="todo-count" data-cy="TodosCounter">
            {visibleCount} items left
          </span>

          {/* Active link should have the 'selected' class */}
          <nav className="filter" data-cy="Filter">
            <a
              href="#/"
              className="filter__link selected"
              data-cy="FilterLinkAll"
              onClick={() => setFilter('all')}
            >
              All
            </a>

            <a
              href="#/active"
              className="filter__link"
              data-cy="FilterLinkActive"
              onClick={() => setFilter('active')}
            >
              Active
            </a>

            <a
              href="#/completed"
              className="filter__link"
              data-cy="FilterLinkCompleted"
              onClick={() => setFilter('completed')}
            >
              Completed
            </a>
          </nav>

          {/* this button should be disabled if there are no completed todos */}
          <button
            type="button"
            className="todoapp__clear-completed"
            data-cy="ClearCompletedButton"
            onClick = {() => handleClearAll()}
          >
            Clear completed
          </button>
        </footer>
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      {errorType && (
        <div
          data-cy="ErrorNotification"
          className="notification is-danger is-light has-text-weight-normal"
        >
          <button 
            data-cy="HideErrorButton" 
            type="button" 
            className="delete"
            onClick={() => setErrorType(null)}
          />

          {errorType === 'load' && <>Unable to load todos</>}
          {errorType === 'emptyTitle' && <>Title should not be empty</>}
          {errorType === 'add' && <>Unable to add a todo</>}
          {errorType === 'delete' && <>Unable to delete a todo</>}
          {errorType === 'update' && <>Unable to update a todo</>}
        </div>
      )}
    </div>
  );
};
