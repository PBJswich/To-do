'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeView, setActiveView] = useState('all');

  const getRandomColor = () => {
    const colors = [
      'bg-yellow-100',  // Pastel yellow
      'bg-blue-100',    // Pastel blue
      'bg-pink-100',    // Pastel pink
      'bg-orange-100',  // Pastel orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (newTask.trim() === '') return;

    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTask,
        description: newDescription,
        dueDate: newDueDate,
        completed: false,
        createdAt: new Date(),
        color: getRandomColor()
      });
      setNewTask('');
      setNewDescription('');
      setNewDueDate('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTaskDescription = async (id, newDescription) => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        description: newDescription
      });
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  useEffect(() => {
    try {
      const q = query(collection(db, 'tasks'));
      console.log('Firebase connection established');
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let taskList = [];
        snapshot.forEach((doc) => {
          taskList.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort tasks based on sortOrder
        if (sortOrder === 'asc') {
          taskList.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortOrder === 'desc') {
          taskList.sort((a, b) => b.title.localeCompare(a.title));
        }
        
        setTasks(taskList);
      }, (error) => {
        console.error('Firebase snapshot error:', error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }, [sortOrder]); // Add sortOrder as dependency

  // Add this after your existing form and before the tasks grid
  return (
    <div className="flex min-h-screen bg-sage-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-white shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Views</h2>
        <nav className="space-y-2">
          <button 
            onClick={() => setActiveView('all')}
            className={`w-full text-left p-2 rounded text-black ${activeView === 'all' ? 'bg-gray-100' : ''}`}
          >
            All Tasks
          </button>
          <button 
            onClick={() => setActiveView('today')}
            className={`w-full text-left p-2 rounded text-black ${activeView === 'today' ? 'bg-gray-100' : ''}`}
          >
            Due Today
          </button>
          <button 
            onClick={() => setActiveView('upcoming')}
            className={`w-full text-left p-2 rounded text-black ${activeView === 'upcoming' ? 'bg-gray-100' : ''}`}
          >
            Upcoming
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="w-3/4 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Sticky Wall</h1>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="p-2 rounded-lg border shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="asc">A to Z</option>
              <option value="desc">Z to A</option>
            </select>
          </div>

          <form onSubmit={addTask} className="mb-8 space-y-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Task title"
              className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Task description"
              className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <div className="flex gap-3">
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button 
                type="submit" 
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Add Note
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`${task.color || 'bg-yellow-100'} rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`flex-1 text-gray-800 ${task.completed ? 'line-through opacity-50' : ''}`}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
                <textarea
                  value={task.description || ''}
                  onChange={(e) => updateTaskDescription(task.id, e.target.value)}
                  placeholder="Add description..."
                  className="w-full mb-3 p-2 bg-transparent border-none resize-none focus:outline-none text-black"
                />
                {task.dueDate && (
                  <div className="text-sm text-gray-600 mb-3">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id, task.completed)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {task.completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}