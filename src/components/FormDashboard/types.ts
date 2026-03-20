export interface FormItem {
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

export interface FolderItem {
  _id: string;
  name: string;
  description: string;
  color: string;
  formCount: number;
  createdAt: string;
}

export interface FormDashboardProps {
  onCreateForm: () => void;
  onEditForm: (id: string) => void;
  onViewResponses: (id: string) => void;
}

export interface DashboardContextType {
  searchTerm: string;
  showDrafts: boolean;
  showPublished: boolean;
  viewMode: 'grid' | 'list';
  activeDropdown: string | null;
  selectedFolder: FolderItem | null;
  showFolderModal: boolean;
  openFolderModal: FolderItem | null;
  setSearchTerm: (term: string) => void;
  setShowDrafts: (show: boolean) => void;
  setShowPublished: (show: boolean) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setActiveDropdown: (id: string | null) => void;
  setSelectedFolder: (folder: FolderItem | null) => void;
  setShowFolderModal: (show: boolean) => void;
  setOpenFolderModal: (folder: FolderItem | null) => void;
}