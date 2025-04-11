import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, GraduationCap, Book, Calculator, Beaker, Atom, Landmark, Globe, BarChart, Building2, ChevronDown, ChevronRight, FolderOpen, Menu, X } from 'lucide-react';

const CategoryNavigation = ({ onSelectSubject, activeSubject }) => {
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Close mobile menu when a subject is selected
  useEffect(() => {
    if (activeSubject) {
      setMobileMenuOpen(false);
    }
  }, [activeSubject]);

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching categories...');
      
      const response = await axios.get('/api/categories');
      console.log('Categories response:', response.data);
      
      if (response.data.categories && response.data.categories.length > 0) {
        setCategories(response.data.categories);
        
        // Initialize expanded state for all categories
        const expanded = {};
        response.data.categories.forEach(category => {
          expanded[category.id] = true; // Start with all categories expanded
        });
        setExpandedCategories(expanded);
        
        // Fetch subjects for each category
        response.data.categories.forEach(category => {
          fetchSubjects(category.id);
        });
      } else {
        // If no categories found, create default ones for display
        setCategories([
          { id: 1, name: 'CLASS 9', icon: 'book-open', color: '#4F46E5' },
          { id: 2, name: 'CLASS 10', icon: 'graduation-cap', color: '#7C3AED' }
        ]);
        
        // Set both categories as expanded
        setExpandedCategories({ 1: true, 2: true });
        
        // Create default subjects for each category
        const defaultSubjects = {
          1: [
            { id: 1, name: 'English', icon: 'book', color: '#3B82F6', category_id: 1 },
            { id: 2, name: 'Hindi', icon: 'book', color: '#EF4444', category_id: 1 },
            { id: 3, name: 'Math', icon: 'calculator', color: '#10B981', category_id: 1 },
            { id: 4, name: 'Biology', icon: 'flask', color: '#84CC16', category_id: 1 },
            { id: 5, name: 'Chemistry', icon: 'flask-conical', color: '#F59E0B', category_id: 1 },
            { id: 6, name: 'Physics', icon: 'atom', color: '#6366F1', category_id: 1 },
            { id: 7, name: 'History', icon: 'landmark', color: '#8B5CF6', category_id: 1 },
            { id: 8, name: 'Geography', icon: 'globe', color: '#EC4899', category_id: 1 },
            { id: 9, name: 'Economics', icon: 'bar-chart', color: '#14B8A6', category_id: 1 },
            { id: 10, name: 'Politics', icon: 'building-columns', color: '#F97316', category_id: 1 },
            { id: 11, name: 'Urdu', icon: 'book', color: '#8B5CF6', category_id: 1 }
          ],
          2: [
            { id: 12, name: 'English', icon: 'book', color: '#3B82F6', category_id: 2 },
            { id: 13, name: 'Hindi', icon: 'book', color: '#EF4444', category_id: 2 },
            { id: 14, name: 'Math', icon: 'calculator', color: '#10B981', category_id: 2 },
            { id: 15, name: 'Biology', icon: 'flask', color: '#84CC16', category_id: 2 },
            { id: 16, name: 'Chemistry', icon: 'flask-conical', color: '#F59E0B', category_id: 2 },
            { id: 17, name: 'Physics', icon: 'atom', color: '#6366F1', category_id: 2 },
            { id: 18, name: 'History', icon: 'landmark', color: '#8B5CF6', category_id: 2 },
            { id: 19, name: 'Geography', icon: 'globe', color: '#EC4899', category_id: 2 },
            { id: 20, name: 'Economics', icon: 'bar-chart', color: '#14B8A6', category_id: 2 },
            { id: 21, name: 'Politics', icon: 'building-columns', color: '#F97316', category_id: 2 },
            { id: 22, name: 'Urdu', icon: 'book', color: '#8B5CF6', category_id: 2 }
          ]
        };
        
        setSubjects(defaultSubjects);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Using default values.');
      
      // Set default categories and subjects if fetch fails
      setCategories([
        { id: 1, name: 'CLASS 9', icon: 'book-open', color: '#4F46E5' },
        { id: 2, name: 'CLASS 10', icon: 'graduation-cap', color: '#7C3AED' }
      ]);
      
      // Set both categories as expanded
      setExpandedCategories({ 1: true, 2: true });
      
      // Create default subjects for each category
      const defaultSubjects = {
        1: [
          { id: 1, name: 'English', icon: 'book', color: '#3B82F6', category_id: 1 },
          { id: 2, name: 'Hindi', icon: 'book', color: '#EF4444', category_id: 1 },
          { id: 3, name: 'Math', icon: 'calculator', color: '#10B981', category_id: 1 },
          { id: 4, name: 'Biology', icon: 'flask', color: '#84CC16', category_id: 1 },
          { id: 5, name: 'Chemistry', icon: 'flask-conical', color: '#F59E0B', category_id: 1 },
          { id: 6, name: 'Physics', icon: 'atom', color: '#6366F1', category_id: 1 },
          { id: 7, name: 'History', icon: 'landmark', color: '#8B5CF6', category_id: 1 },
          { id: 8, name: 'Geography', icon: 'globe', color: '#EC4899', category_id: 1 },
          { id: 9, name: 'Economics', icon: 'bar-chart', color: '#14B8A6', category_id: 1 },
          { id: 10, name: 'Politics', icon: 'building-columns', color: '#F97316', category_id: 1 },
          { id: 11, name: 'Urdu', icon: 'book', color: '#8B5CF6', category_id: 1 }
        ],
        2: [
          { id: 12, name: 'English', icon: 'book', color: '#3B82F6', category_id: 2 },
          { id: 13, name: 'Hindi', icon: 'book', color: '#EF4444', category_id: 2 },
          { id: 14, name: 'Math', icon: 'calculator', color: '#10B981', category_id: 2 },
          { id: 15, name: 'Biology', icon: 'flask', color: '#84CC16', category_id: 2 },
          { id: 16, name: 'Chemistry', icon: 'flask-conical', color: '#F59E0B', category_id: 2 },
          { id: 17, name: 'Physics', icon: 'atom', color: '#6366F1', category_id: 2 },
          { id: 18, name: 'History', icon: 'landmark', color: '#8B5CF6', category_id: 2 },
          { id: 19, name: 'Geography', icon: 'globe', color: '#EC4899', category_id: 2 },
          { id: 20, name: 'Economics', icon: 'bar-chart', color: '#14B8A6', category_id: 2 },
          { id: 21, name: 'Politics', icon: 'building-columns', color: '#F97316', category_id: 2 },
          { id: 22, name: 'Urdu', icon: 'book', color: '#8B5CF6', category_id: 2 }
        ]
      };
      
      setSubjects(defaultSubjects);
      setLoading(false);
    }
  };

  // Function to fetch subjects for a category
  const fetchSubjects = async (categoryId) => {
    try {
      const response = await axios.get(`/api/categories/${categoryId}/subjects`);
      setSubjects(prev => ({
        ...prev,
        [categoryId]: response.data.subjects
      }));
    } catch (error) {
      console.error(`Error fetching subjects for category ${categoryId}:`, error);
    }
  };

  // Function to toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Function to get icon component based on icon name
  const getIconComponent = (iconName, color) => {
    const iconProps = { size: 18, color: color || '#4B5563', className: "mr-2 flex-shrink-0" };
    
    switch (iconName) {
      case 'book-open':
        return <BookOpen {...iconProps} />;
      case 'graduation-cap':
        return <GraduationCap {...iconProps} />;
      case 'book':
        return <Book {...iconProps} />;
      case 'calculator':
        return <Calculator {...iconProps} />;
      case 'flask':
      case 'flask-conical':
        return <Beaker {...iconProps} />;
      case 'atom':
        return <Atom {...iconProps} />;
      case 'landmark':
        return <Landmark {...iconProps} />;
      case 'globe':
        return <Globe {...iconProps} />;
      case 'bar-chart':
        return <BarChart {...iconProps} />;
      case 'building-columns':
        return <Building2 {...iconProps} />;
      default:
        return <FolderOpen {...iconProps} />;
    }
  };

  // Function to handle subject selection
  const handleSubjectClick = (subjectId, subjectName, categoryId, categoryName) => {
    onSelectSubject(subjectId, subjectName, categoryId, categoryName);
    setMobileMenuOpen(false); // Close mobile menu after selection
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
      </div>
    );
  }

  // Mobile toggle button
  const mobileToggle = (
    <button 
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      className="lg:hidden flex items-center justify-center p-2 mb-3 bg-indigo-600 text-white rounded-md w-full"
    >
      {mobileMenuOpen ? (
        <>
          <X size={18} className="mr-2" />
          Close Categories
        </>
      ) : (
        <>
          <Menu size={18} className="mr-2" />
          Browse Categories
        </>
      )}
    </button>
  );

  const categoryContent = (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-indigo-600 text-white font-semibold sticky top-0 z-10">
        Categories
      </div>
      <div className="p-2 max-h-[70vh] lg:max-h-[calc(100vh-200px)] overflow-y-auto">
        {categories.map(category => (
          <div key={category.id} className="mb-2">
            <div 
              className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleCategory(category.id)}
            >
              {expandedCategories[category.id] ? 
                <ChevronDown size={18} className="mr-1 text-gray-500 flex-shrink-0" /> : 
                <ChevronRight size={18} className="mr-1 text-gray-500 flex-shrink-0" />
              }
              {getIconComponent(category.icon, category.color)}
              <span className="font-medium truncate">{category.name}</span>
            </div>
            
            {expandedCategories[category.id] && subjects[category.id] && (
              <div className="ml-7 mt-1 space-y-1">
                {subjects[category.id].map(subject => (
                  <div 
                    key={subject.id}
                    className={`flex items-center p-2 rounded-md cursor-pointer ${
                      activeSubject === subject.id ? 
                      'bg-indigo-100 text-indigo-700' : 
                      'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSubjectClick(subject.id, subject.name, category.id, category.name)}
                  >
                    {getIconComponent(subject.icon, subject.color)}
                    <span className="truncate">{subject.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      {mobileToggle}
      
      {/* Category navigation - responsive */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
        {categoryContent}
      </div>
    </>
  );
};

export default CategoryNavigation; 