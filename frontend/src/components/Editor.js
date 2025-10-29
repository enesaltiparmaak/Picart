import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  Save,
  Upload,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Palette,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  MousePointer,
  Trash2,
  Copy,
  Layers,
  Settings,
  Grid,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';

const Editor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Canvas state
  const [canvasObjects, setCanvasObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  // Text properties
  const [textProperties, setTextProperties] = useState({
    fontSize: 18,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    color: '#000000'
  });
  
  // Shape properties
  const [shapeProperties, setShapeProperties] = useState({
    fillColor: '#3B82F6',
    strokeColor: '#1E40AF',
    strokeWidth: 2,
    opacity: 100
  });

  const { user } = useAuth();

  useEffect(() => {
    if (projectId) {
      fetchProject();
    } else {
      // New project
      setProject({
        id: 'new',
        title: 'Yeni Proje',
        canvas_data: {},
        width: 800,
        height: 600
      });
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (project) {
      initializeCanvas();
    }
  }, [project]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}`);
      setProject(response.data);
      if (response.data.canvas_data && response.data.canvas_data.objects) {
        setCanvasObjects(response.data.canvas_data.objects);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Proje yüklenemedi');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;

    canvas.width = project.width;
    canvas.height = project.height;
    
    redrawCanvas();
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Draw objects
    canvasObjects.forEach((obj, index) => {
      drawObject(ctx, obj, index === selectedObject);
    });
  }, [canvasObjects, selectedObject, showGrid]);

  const drawGrid = (ctx, width, height) => {
    const gridSize = 20;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  const drawObject = (ctx, obj, isSelected) => {
    ctx.save();
    ctx.globalAlpha = (obj.opacity || 100) / 100;

    switch (obj.type) {
      case 'text':
        drawText(ctx, obj);
        break;
      case 'rectangle':
        drawRectangle(ctx, obj);
        break;
      case 'circle':
        drawCircle(ctx, obj);
        break;
      case 'image':
        drawImage(ctx, obj);
        break;
    }

    if (isSelected) {
      drawSelection(ctx, obj);
    }

    ctx.restore();
  };

  const drawText = (ctx, obj) => {
    ctx.font = `${obj.fontStyle || 'normal'} ${obj.fontWeight || 'normal'} ${obj.fontSize || 18}px ${obj.fontFamily || 'Arial'}`;
    ctx.fillStyle = obj.color || '#000000';
    ctx.textAlign = obj.textAlign || 'left';
    ctx.fillText(obj.text || 'Metin', obj.x || 0, obj.y || 20);
  };

  const drawRectangle = (ctx, obj) => {
    if (obj.fillColor) {
      ctx.fillStyle = obj.fillColor;
      ctx.fillRect(obj.x || 0, obj.y || 0, obj.width || 100, obj.height || 100);
    }
    if (obj.strokeColor && obj.strokeWidth) {
      ctx.strokeStyle = obj.strokeColor;
      ctx.lineWidth = obj.strokeWidth;
      ctx.strokeRect(obj.x || 0, obj.y || 0, obj.width || 100, obj.height || 100);
    }
  };

  const drawCircle = (ctx, obj) => {
    const radius = (obj.width || 100) / 2;
    const centerX = (obj.x || 0) + radius;
    const centerY = (obj.y || 0) + radius;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

    if (obj.fillColor) {
      ctx.fillStyle = obj.fillColor;
      ctx.fill();
    }
    if (obj.strokeColor && obj.strokeWidth) {
      ctx.strokeStyle = obj.strokeColor;
      ctx.lineWidth = obj.strokeWidth;
      ctx.stroke();
    }
  };

  const drawImage = (ctx, obj) => {
    if (obj.imageData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, obj.x || 0, obj.y || 0, obj.width || img.width, obj.height || img.height);
      };
      img.src = obj.imageData;
    }
  };

  const drawSelection = (ctx, obj) => {
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const x = obj.x || 0;
    const y = obj.y || 0;
    const width = obj.width || (obj.type === 'text' ? 100 : 100);
    const height = obj.height || (obj.type === 'text' ? 20 : 100);
    
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
    ctx.setLineDash([]);
  };

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'select') {
      // Find clicked object
      let clicked = -1;
      for (let i = canvasObjects.length - 1; i >= 0; i--) {
        const obj = canvasObjects[i];
        if (isPointInObject(x, y, obj)) {
          clicked = i;
          break;
        }
      }
      setSelectedObject(clicked >= 0 ? clicked : null);
    } else if (activeTool === 'text') {
      addTextObject(x, y);
    } else if (activeTool === 'rectangle' || activeTool === 'circle') {
      setIsDrawing(true);
      setStartPos({ x, y });
    }
  };

  const isPointInObject = (x, y, obj) => {
    const objX = obj.x || 0;
    const objY = obj.y || 0;
    const objWidth = obj.width || 100;
    const objHeight = obj.height || (obj.type === 'text' ? 20 : 100);
    
    return x >= objX && x <= objX + objWidth && y >= objY && y <= objY + objHeight;
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'rectangle' || activeTool === 'circle') {
      const width = Math.abs(x - startPos.x);
      const height = Math.abs(y - startPos.y);
      const objX = Math.min(startPos.x, x);
      const objY = Math.min(startPos.y, y);

      // Update temporary object or create preview
      redrawCanvas();
      
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.globalAlpha = 0.5;
      
      if (activeTool === 'rectangle') {
        ctx.fillStyle = shapeProperties.fillColor;
        ctx.fillRect(objX, objY, width, height);
        if (shapeProperties.strokeWidth > 0) {
          ctx.strokeStyle = shapeProperties.strokeColor;
          ctx.lineWidth = shapeProperties.strokeWidth;
          ctx.strokeRect(objX, objY, width, height);
        }
      } else if (activeTool === 'circle') {
        const radius = Math.min(width, height) / 2;
        const centerX = objX + radius;
        const centerY = objY + radius;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = shapeProperties.fillColor;
        ctx.fill();
        
        if (shapeProperties.strokeWidth > 0) {
          ctx.strokeStyle = shapeProperties.strokeColor;
          ctx.lineWidth = shapeProperties.strokeWidth;
          ctx.stroke();
        }
      }
      
      ctx.restore();
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = Math.abs(x - startPos.x);
    const height = Math.abs(y - startPos.y);
    const objX = Math.min(startPos.x, x);
    const objY = Math.min(startPos.y, y);

    if (width > 10 && height > 10) { // Minimum size
      if (activeTool === 'rectangle') {
        addRectangleObject(objX, objY, width, height);
      } else if (activeTool === 'circle') {
        const size = Math.min(width, height);
        addCircleObject(objX, objY, size);
      }
    }

    setIsDrawing(false);
  };

  const addTextObject = (x, y) => {
    const newObject = {
      type: 'text',
      text: 'Metni düzenle',
      x,
      y,
      ...textProperties
    };
    
    const newObjects = [...canvasObjects, newObject];
    setCanvasObjects(newObjects);
    setSelectedObject(newObjects.length - 1);
    setActiveTool('select');
  };

  const addRectangleObject = (x, y, width, height) => {
    const newObject = {
      type: 'rectangle',
      x,
      y,
      width,
      height,
      ...shapeProperties
    };
    
    const newObjects = [...canvasObjects, newObject];
    setCanvasObjects(newObjects);
    setSelectedObject(newObjects.length - 1);
    setActiveTool('select');
  };

  const addCircleObject = (x, y, size) => {
    const newObject = {
      type: 'circle',
      x,
      y,
      width: size,
      height: size,
      ...shapeProperties
    };
    
    const newObjects = [...canvasObjects, newObject];
    setCanvasObjects(newObjects);
    setSelectedObject(newObjects.length - 1);
    setActiveTool('select');
  };

  const updateSelectedObject = (updates) => {
    if (selectedObject === null) return;

    const newObjects = [...canvasObjects];
    newObjects[selectedObject] = { ...newObjects[selectedObject], ...updates };
    setCanvasObjects(newObjects);
  };

  const deleteSelectedObject = () => {
    if (selectedObject === null) return;

    const newObjects = canvasObjects.filter((_, index) => index !== selectedObject);
    setCanvasObjects(newObjects);
    setSelectedObject(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/upload', formData);
      
      const newObject = {
        type: 'image',
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        imageData: response.data.data
      };
      
      const newObjects = [...canvasObjects, newObject];
      setCanvasObjects(newObjects);
      setSelectedObject(newObjects.length - 1);
      
      toast.success('Resim eklendi');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Dosya yüklenirken hata oluştu');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const canvasData = {
        objects: canvasObjects,
        width: project.width,
        height: project.height
      };

      // Generate thumbnail
      const canvas = canvasRef.current;
      const thumbnail = canvas.toDataURL('image/jpeg', 0.3);

      if (project.id === 'new') {
        // Create new project
        const response = await axios.post('/api/projects', {
          title: project.title,
          canvas_data: canvasData,
          width: project.width,
          height: project.height
        });
        
        setProject(response.data);
        toast.success('Proje kaydedildi');
      } else {
        // Update existing project
        await axios.put(`/api/projects/${project.id}`, {
          canvas_data: canvasData,
          thumbnail
        });
        
        toast.success('Proje güncellendi');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Proje kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format = 'png') => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL(`image/${format}`, 0.9);
    
    // Create download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${project.title}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Close the export dialog
    setShowExportDialog(false);
    
    toast.success(`${format.toUpperCase()} olarak dışa aktarıldı`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Proje yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-slate-300 hover:text-white"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          
          <Input
            value={project?.title || ''}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white max-w-xs"
            data-testid="project-title-input"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-slate-300 border-slate-600"
            data-testid="save-project-button"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-slate-300 border-slate-600"
                data-testid="export-button"
              >
                <Download className="h-4 w-4 mr-2" />
                Dışa Aktar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Projeyi Dışa Aktar</DialogTitle>
                <DialogDescription>
                  Projenizi farklı formatlarda dışa aktarabilirsiniz.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => handleExport('png')} data-testid="export-png">
                    PNG olarak indir
                  </Button>
                  <Button onClick={() => handleExport('jpeg')} data-testid="export-jpg">
                    JPG olarak indir
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700">
              <TabsTrigger value="design" data-testid="design-tab">Tasarım</TabsTrigger>
              <TabsTrigger value="layers" data-testid="layers-tab">Katmanlar</TabsTrigger>
              <TabsTrigger value="settings" data-testid="settings-tab">Ayarlar</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="p-4 space-y-4">
              {/* Tools */}
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-slate-200 text-sm">Araçlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={activeTool === 'select' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTool('select')}
                      className="flex items-center justify-center"
                      data-testid="select-tool"
                    >
                      <MousePointer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={activeTool === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTool('text')}
                      className="flex items-center justify-center"
                      data-testid="text-tool"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={activeTool === 'rectangle' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTool('rectangle')}
                      className="flex items-center justify-center"
                      data-testid="rectangle-tool"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={activeTool === 'circle' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTool('circle')}
                      className="flex items-center justify-center"
                      data-testid="circle-tool"
                    >
                      <Circle className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                    data-testid="upload-image-button"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Resim Yükle
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Properties */}
              {selectedObject !== null && (
                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-slate-200 text-sm">Özellikler</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {canvasObjects[selectedObject]?.type === 'text' && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-slate-300">Metin</Label>
                          <Input
                            value={canvasObjects[selectedObject]?.text || ''}
                            onChange={(e) => updateSelectedObject({ text: e.target.value })}
                            className="bg-slate-600 border-slate-500 text-white"
                            data-testid="text-content-input"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Font Boyutu</Label>
                          <Slider
                            value={[canvasObjects[selectedObject]?.fontSize || 18]}
                            onValueChange={(value) => updateSelectedObject({ fontSize: value[0] })}
                            max={72}
                            min={8}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Renk</Label>
                          <Input
                            type="color"
                            value={canvasObjects[selectedObject]?.color || '#000000'}
                            onChange={(e) => updateSelectedObject({ color: e.target.value })}
                            className="bg-slate-600 border-slate-500 h-10 mt-2"
                          />
                        </div>
                      </div>
                    )}

                    {(canvasObjects[selectedObject]?.type === 'rectangle' || canvasObjects[selectedObject]?.type === 'circle') && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-slate-300">Dolgu Rengi</Label>
                          <Input
                            type="color"
                            value={canvasObjects[selectedObject]?.fillColor || '#3B82F6'}
                            onChange={(e) => updateSelectedObject({ fillColor: e.target.value })}
                            className="bg-slate-600 border-slate-500 h-10 mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Çerçeve Rengi</Label>
                          <Input
                            type="color"
                            value={canvasObjects[selectedObject]?.strokeColor || '#1E40AF'}
                            onChange={(e) => updateSelectedObject({ strokeColor: e.target.value })}
                            className="bg-slate-600 border-slate-500 h-10 mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Çerçeve Kalınlığı</Label>
                          <Slider
                            value={[canvasObjects[selectedObject]?.strokeWidth || 2]}
                            onValueChange={(value) => updateSelectedObject({ strokeWidth: value[0] })}
                            max={20}
                            min={0}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    )}

                    <Separator className="bg-slate-600" />
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedObject}
                      className="w-full"
                      data-testid="delete-selected-object"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="layers" className="p-4">
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-slate-200 text-sm">Katmanlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {canvasObjects.map((obj, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedObject === index
                            ? 'bg-blue-600'
                            : 'bg-slate-600 hover:bg-slate-500'
                        }`}
                        onClick={() => setSelectedObject(index)}
                        data-testid={`layer-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200 text-sm">
                            {obj.type === 'text' ? obj.text || 'Metin' : 
                             obj.type === 'rectangle' ? 'Dikdörtgen' :
                             obj.type === 'circle' ? 'Daire' :
                             obj.type === 'image' ? 'Resim' : 'Nesne'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {obj.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {canvasObjects.length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-8">
                        Henüz katman yok
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="p-4">
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-slate-200 text-sm">Canvas Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Genişlik</Label>
                    <Input
                      type="number"
                      value={project?.width || 800}
                      onChange={(e) => setProject({ ...project, width: parseInt(e.target.value) || 800 })}
                      className="bg-slate-600 border-slate-500 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Yükseklik</Label>
                    <Input
                      type="number"
                      value={project?.height || 600}
                      onChange={(e) => setProject({ ...project, height: parseInt(e.target.value) || 600 })}
                      className="bg-slate-600 border-slate-500 text-white mt-2"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Izgara Göster</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGrid(!showGrid)}
                      className={showGrid ? 'bg-blue-600' : ''}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Zoom</Label>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-slate-300 text-sm w-12 text-center">{zoom}%</span>
                      <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(400, zoom + 25))}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-slate-800 p-8 overflow-auto">
          <div className="flex items-center justify-center min-h-full">
            <div 
              className="bg-white rounded-lg shadow-2xl overflow-hidden"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className={`cursor-${activeTool === 'select' ? 'default' : 'crosshair'} editor-canvas`}
                data-testid="canvas"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;