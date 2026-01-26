import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface Category {
  id: number;
  name: string;
}

export function useMenuCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    supabase.from('master_menu_category').select('id, name').then(({ data }) => {
      setCategories(data || []);
    });
  }, []);
  return categories;
}

export function useCuisineCategories() {
  const [cuisines, setCuisines] = useState<Category[]>([]);
  useEffect(() => {
    supabase.from('master_cuisine_category').select('id, name').then(({ data }) => {
      setCuisines(data || []);
    });
  }, []);
  return cuisines;
}

export function useCourseCategories() {
  const [courses, setCourses] = useState<Category[]>([]);
  useEffect(() => {
    supabase.from('master_course_category').select('id, name').then(({ data }) => {
      setCourses(data || []);
    });
  }, []);
  return courses;
}
