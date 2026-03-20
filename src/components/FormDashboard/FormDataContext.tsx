import React, { createContext, useContext, useState, useEffect } from 'react';
import { formAPI } from '../../services/api';

interface FormItem {
  _id: string;
  title: string;
  description: string;
  responses: number;
  views: number;
  createdAt: string;
  status: 'published' | 'draft' | 'closed';
  shareUrl?: string;
  folderId?: string;
}

interface FormDataContextType {
  forms: FormItem[];
  loading: boolean;
  refreshForms: () => Promise<void>;
}

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

export const FormDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshForms = async () => {
    setLoading(true);
    try {
      const response = await formAPI.getForms();
      setForms(response.data || []);
    } catch (error) {
      console.error('Error loading forms:', error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshForms();
  }, []);

  return (
    <FormDataContext.Provider value={{ forms, loading, refreshForms }}>
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
};