import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export function useMenuCategories() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    supabase.from('master_menu_category').select('id, name').then(({ data }) => {
      setCategories(data || []);
    });
  }, []);
  return categories;
}

export function useCuisineCategories() {
  const [cuisines, setCuisines] = useState([]);
  useEffect(() => {
    supabase.from('master_cuisine_category').select('id, name').then(({ data }) => {
      setCuisines(data || []);
    });
  }, []);
  return cuisines;
}

export function useCourseCategories() {
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    supabase.from('master_course_category').select('id, name').then(({ data }) => {
      setCourses(data || []);
    });
  }, []);
  return courses;
}
