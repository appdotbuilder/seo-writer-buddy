import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { Plus, FileText, Clock, Target, Edit, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import type { ContentOutline, CreateContentOutlineInput } from '../../../server/src/schema';

export function ContentOutlines() {
  const [outlines, setOutlines] = useState<ContentOutline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOutline, setSelectedOutline] = useState<ContentOutline | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form data for creating new outline
  const [formData, setFormData] = useState<CreateContentOutlineInput>({
    title: '',
    target_keyword: '',
    secondary_keywords: null,
    meta_description: null,
    word_count_target: 1500,
    outline_structure: '',
    seo_suggestions: null,
    content_type: 'blog_post',
    difficulty_level: 'intermediate',
    estimated_reading_time: 7
  });

  // AI generation form
  const [generateData, setGenerateData] = useState({
    targetKeyword: '',
    contentType: 'blog_post'
  });

  const loadOutlines = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getContentOutlines.query();
      setOutlines(result);
    } catch (error) {
      console.error('Failed to load outlines:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOutlines();
  }, [loadOutlines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      const outline = await trpc.createContentOutline.mutate(formData);
      setOutlines((prev: ContentOutline[]) => [outline, ...prev]);
      
      // Reset form
      setFormData({
        title: '',
        target_keyword: '',
        secondary_keywords: null,
        meta_description: null,
        word_count_target: 1500,
        outline_structure: '',
        seo_suggestions: null,
        content_type: 'blog_post',
        difficulty_level: 'intermediate',
        estimated_reading_time: 7
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create outline:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateSuggestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateData.targetKeyword.trim()) return;

    try {
      setIsGenerating(true);
      const suggestions = await trpc.generateOutlineSuggestions.mutate({
        targetKeyword: generateData.targetKeyword,
        contentType: generateData.contentType
      });
      
      // Pre-fill form with generated suggestions
      // Note: This would contain AI-generated content in a real implementation
      setFormData((prev: CreateContentOutlineInput) => ({
        ...prev,
        title: `${generateData.targetKeyword} - Complete Guide`,
        target_keyword: generateData.targetKeyword,
        content_type: generateData.contentType as any,
        outline_structure: JSON.stringify({
          introduction: 'Hook, problem statement, solution preview',
          main_sections: [
            `What is ${generateData.targetKeyword}?`,
            `Benefits and advantages`,
            `Step-by-step guide`,
            `Best practices and tips`,
            `Common mistakes to avoid`
          ],
          conclusion: 'Summary and call-to-action'
        }, null, 2)
      }));
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'blog_post': return 'bg-blue-100 text-blue-800';
      case 'article': return 'bg-green-100 text-green-800';
      case 'guide': return 'bg-purple-100 text-purple-800';
      case 'tutorial': return 'bg-orange-100 text-orange-800';
      case 'review': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const parseOutlineStructure = (structure: string) => {
    try {
      return JSON.parse(structure);
    } catch {
      return { sections: structure.split('\n').filter((s: string) => s.trim()) };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Content Outlines ({outlines.length})</h3>
          <p className="text-gray-600">Create and manage SEO-optimized content outlines</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Outline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Content Outline</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* AI Generation Section */}
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI-Powered Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerateSuggestions} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Target Keyword</Label>
                        <Input
                          placeholder="e.g., content marketing strategy"
                          value={generateData.targetKeyword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setGenerateData((prev) => ({ ...prev, targetKeyword: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select
                          value={generateData.contentType}
                          onValueChange={(value: string) =>
                            setGenerateData((prev) => ({ ...prev, contentType: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blog_post">Blog Post</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="guide">Guide</SelectItem>
                            <SelectItem value="tutorial">Tutorial</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" disabled={isGenerating} className="w-full">
                      {isGenerating ? (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                          Generating Suggestions...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate AI Suggestions
                        </>
                      )}
                    </Button>
                  </form>
                  
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      💡 AI suggestions will pre-fill the form below with optimized content structure.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Separator />

              {/* Manual Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Your content title"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateContentOutlineInput) => ({ 
                          ...prev, 
                          title: e.target.value 
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_keyword">Target Keyword *</Label>
                    <Input
                      id="target_keyword"
                      placeholder="Main keyword to target"
                      value={formData.target_keyword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateContentOutlineInput) => ({ 
                          ...prev, 
                          target_keyword: e.target.value 
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_keywords">Secondary Keywords (comma-separated)</Label>
                  <Input
                    id="secondary_keywords"
                    placeholder="keyword1, keyword2, keyword3"
                    value={formData.secondary_keywords || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateContentOutlineInput) => ({ 
                        ...prev, 
                        secondary_keywords: e.target.value || null 
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    placeholder="SEO meta description (150-160 characters)"
                    value={formData.meta_description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateContentOutlineInput) => ({ 
                        ...prev, 
                        meta_description: e.target.value || null 
                      }))
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="content_type">Content Type</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(value: 'blog_post' | 'article' | 'guide' | 'tutorial' | 'review') =>
                        setFormData((prev: CreateContentOutlineInput) => ({ 
                          ...prev, 
                          content_type: value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog_post">Blog Post</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="guide">Guide</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty_level">Difficulty Level</Label>
                    <Select
                      value={formData.difficulty_level}
                      onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                        setFormData((prev: CreateContentOutlineInput) => ({ 
                          ...prev, 
                          difficulty_level: value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="word_count_target">Target Word Count</Label>
                    <Input
                      id="word_count_target"
                      type="number"
                      min="300"
                      value={formData.word_count_target}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateContentOutlineInput) => ({ 
                          ...prev, 
                          word_count_target: parseInt(e.target.value) || 1500 
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_reading_time">Estimated Reading Time (minutes)</Label>
                  <Input
                    id="estimated_reading_time"
                    type="number"
                    min="1"
                    value={formData.estimated_reading_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateContentOutlineInput) => ({ 
                        ...prev, 
                        estimated_reading_time: parseInt(e.target.value) || 7 
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outline_structure">Content Structure *</Label>
                  <Textarea
                    id="outline_structure"
                    placeholder="Outline your content structure (JSON format or simple text)"
                    value={formData.outline_structure}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateContentOutlineInput) => ({ 
                        ...prev, 
                        outline_structure: e.target.value 
                      }))
                    }
                    rows={8}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_suggestions">SEO Suggestions</Label>
                  <Textarea
                    id="seo_suggestions"
                    placeholder="Additional SEO recommendations and notes"
                    value={formData.seo_suggestions || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateContentOutlineInput) => ({ 
                        ...prev, 
                        seo_suggestions: e.target.value || null 
                      }))
                    }
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Outline'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Outlines List */}
      <div>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading outlines...</div>
        ) : outlines.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No content outlines yet</p>
              <p className="text-gray-400">Create your first outline to start building optimized content! ✍️</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {outlines.map((outline: ContentOutline) => (
              <Card key={outline.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-xl">{outline.title}</h4>
                        <Badge className={getContentTypeColor(outline.content_type)}>
                          {outline.content_type.replace('_', ' ')}
                        </Badge>
                        <Badge className={getDifficultyColor(outline.difficulty_level)}>
                          {outline.difficulty_level}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>{outline.target_keyword}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{outline.word_count_target.toLocaleString()} words</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{outline.estimated_reading_time} min read</span>
                        </div>
                      </div>

                      {outline.meta_description && (
                        <p className="text-gray-600 text-sm mb-3">{outline.meta_description}</p>
                      )}

                      <div className="text-xs text-gray-400">
                        Created {outline.created_at.toLocaleDateString()} • 
                        Updated {outline.updated_at.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedOutline(outline)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>

                  {/* Preview of outline structure */}
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Content Structure Preview:</h5>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {typeof parseOutlineStructure(outline.outline_structure) === 'object' 
                          ? JSON.stringify(parseOutlineStructure(outline.outline_structure), null, 2).substring(0, 200) + '...'
                          : outline.outline_structure.substring(0, 200) + '...'}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOutline && (
        <Dialog open={!!selectedOutline} onOpenChange={() => setSelectedOutline(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedOutline.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getContentTypeColor(selectedOutline.content_type)}>
                  {selectedOutline.content_type.replace('_', ' ')}
                </Badge>
                <Badge className={getDifficultyColor(selectedOutline.difficulty_level)}>
                  {selectedOutline.difficulty_level}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Target Keyword:</span>
                  <p className="font-medium">{selectedOutline.target_keyword}</p>
                </div>
                <div>
                  <span className="text-gray-600">Word Count:</span>
                  <p className="font-medium">{selectedOutline.word_count_target.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Reading Time:</span>
                  <p className="font-medium">{selectedOutline.estimated_reading_time} minutes</p>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="font-medium">{selectedOutline.created_at.toLocaleDateString()}</p>
                </div>
              </div>

              {selectedOutline.meta_description && (
                <div>
                  <h4 className="font-medium mb-2">Meta Description:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedOutline.meta_description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Content Structure:</h4>
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {JSON.stringify(parseOutlineStructure(selectedOutline.outline_structure), null, 2)}
                  </pre>
                </div>
              </div>

              {selectedOutline.seo_suggestions && (
                <div>
                  <h4 className="font-medium mb-2">SEO Suggestions:</h4>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-gray-700">{selectedOutline.seo_suggestions}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}