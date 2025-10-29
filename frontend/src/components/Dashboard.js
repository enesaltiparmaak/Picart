import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Palette, 
  User, 
  LogOut, 
  Calendar, 
  Image,
  Trash2,
  Edit,
  Copy,
  MoreVertical,
  Folder,
  Star
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [activeTab, setActiveTab] = useState('projects');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, templatesRes] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/api/templates')
      ]);
      setProjects(projectsRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Proje adı gerekli');
      return;
    }

    try {
      const response = await axios.post('/api/projects', {
        title: newProjectName,
        canvas_data: {},
        width: 800,
        height: 600
      });
      
      toast.success('Yeni proje oluşturuldu');
      setShowCreateDialog(false);
      setNewProjectName('');
      navigate(`/editor/${response.data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Proje oluştururken hata oluştu');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await axios.delete(`/api/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Proje silindi');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Proje silinirken hata oluştu');
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      const response = await axios.post('/api/projects', {
        title: `${template.title} - Kopya`,
        canvas_data: template.canvas_data,
        width: template.width,
        height: template.height
      });
      
      toast.success('Şablondan proje oluşturuldu');
      navigate(`/editor/${response.data.id}`);
    } catch (error) {
      console.error('Error creating project from template:', error);
      toast.error('Şablondan proje oluştururken hata oluştu');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 font-['Space_Grotesk']">PicEditor</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-slate-700">{user?.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={logout} data-testid="logout-button">
                    <LogOut className="h-4 w-4 mr-2" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Hoş geldiniz, {user?.username}!</h2>
              <p className="text-slate-600">Yaratıcılığınızı keşfedin ve muhteşem tasarımlar oluşturun.</p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" data-testid="create-new-project-button">
                  <Plus className="h-5 w-5 mr-2" />
                  Yeni Proje
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Proje Oluştur</DialogTitle>
                  <DialogDescription>
                    Yeni projeniz için bir isim verin ve düzenlemeye başlayın.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Proje Adı</Label>
                    <Input
                      id="project-name"
                      data-testid="project-name-input"
                      placeholder="Örn: Logo Tasarımı"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                    />
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button onClick={handleCreateProject} className="flex-1" data-testid="create-project-confirm">
                      Oluştur
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                      İptal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Toplam Proje</p>
                    <p className="text-2xl font-bold text-blue-900" data-testid="total-projects-count">{projects.length}</p>
                  </div>
                  <Folder className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Şablon</p>
                    <p className="text-2xl font-bold text-purple-900">{templates.length}</p>
                  </div>
                  <Image className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Bu Ay</p>
                    <p className="text-2xl font-bold text-green-900">0</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Favoriler</p>
                    <p className="text-2xl font-bold text-orange-900">0</p>
                  </div>
                  <Star className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex space-x-1 mb-4 lg:mb-0">
            <Button
              variant={activeTab === 'projects' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('projects')}
              className="px-6"
              data-testid="projects-tab"
            >
              Projelerim
            </Button>
            <Button
              variant={activeTab === 'templates' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('templates')}
              className="px-6"
              data-testid="templates-tab"
            >
              Şablonlar
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="search-input"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'projects' && (
            <div>
              {filteredProjects.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Folder className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Henüz proje yok</h3>
                  <p className="text-slate-600 mb-6">İlk projenizi oluşturun ve düzenlemeye başlayın.</p>
                  <Button 
                    onClick={() => setShowCreateDialog(true)} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    data-testid="empty-state-create-project"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Yeni Proje Oluştur
                  </Button>
                </Card>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-3'}>
                  {filteredProjects.map((project) => (
                    <Card 
                      key={project.id} 
                      className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${viewMode === 'list' ? 'p-4' : 'project-card'}`}
                      onClick={() => navigate(`/editor/${project.id}`)}
                      data-testid={`project-card-${project.id}`}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                            {project.thumbnail ? (
                              <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
                            ) : (
                              <Image className="h-12 w-12 text-slate-400" />
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/editor/${project.id}`); }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Copy logic */ }}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Kopyala
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                                  className="text-red-600"
                                  data-testid={`delete-project-${project.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-slate-800 truncate mb-1">{project.title}</h3>
                            <p className="text-sm text-slate-500">{formatDate(project.updated_at)}</p>
                            <div className="flex items-center justify-between mt-3">
                              <Badge variant="outline" className="text-xs">
                                {project.width}x{project.height}
                              </Badge>
                            </div>
                          </CardContent>
                        </>
                      ) : (
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                            {project.thumbnail ? (
                              <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Image className="h-6 w-6 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800">{project.title}</h3>
                            <p className="text-sm text-slate-500">{formatDate(project.updated_at)}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {project.width}x{project.height}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/editor/${project.id}`); }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Copy logic */ }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Kopyala
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div>
              {filteredTemplates.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Image className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Şablon bulunamadı</h3>
                  <p className="text-slate-600">Arama teriminizi değiştirerek tekrar deneyin.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer project-card">
                      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                        {template.thumbnail ? (
                          <img src={template.thumbnail} alt={template.title} className="w-full h-full object-cover" />
                        ) : (
                          <Image className="h-12 w-12 text-slate-400" />
                        )}
                        {template.is_premium && (
                          <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-slate-800 truncate mb-1">{template.title}</h3>
                        <p className="text-sm text-slate-500 mb-3">{template.category}</p>
                        <Button 
                          onClick={() => handleUseTemplate(template)} 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          size="sm"
                          data-testid={`use-template-${template.id}`}
                        >
                          Kullan
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;