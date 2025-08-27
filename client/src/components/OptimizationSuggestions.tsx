import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { 
  Lightbulb, 
  CheckCircle, 
  Circle, 
  Sparkles, 
  Target, 
  FileText, 
  Link, 
  Image, 
  Hash, 
  BookOpen,
  AlertTriangle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import type { ContentOutline, OptimizationSuggestion } from '../../../server/src/schema';

export function OptimizationSuggestions() {
  const [outlines, setOutlines] = useState<ContentOutline[]>([]);
  const [selectedOutlineId, setSelectedOutlineId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showImplemented, setShowImplemented] = useState(true);

  const loadOutlines = useCallback(async () => {
    try {
      const result = await trpc.getContentOutlines.query();
      setOutlines(result);
    } catch (error) {
      console.error('Failed to load outlines:', error);
    }
  }, []);

  const loadSuggestions = useCallback(async (outlineId: number) => {
    try {
      setIsLoading(true);
      const result = await trpc.getOptimizationSuggestions.query({ contentOutlineId: outlineId });
      setSuggestions(result);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOutlines();
  }, [loadOutlines]);

  useEffect(() => {
    if (selectedOutlineId) {
      loadSuggestions(selectedOutlineId);
    }
  }, [selectedOutlineId, loadSuggestions]);

  const handleGenerateSuggestions = async () => {
    if (!selectedOutlineId) return;

    try {
      setIsGenerating(true);
      await trpc.generateOptimizationSuggestions.mutate({ contentOutlineId: selectedOutlineId });
      await loadSuggestions(selectedOutlineId);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSuggestion = async (suggestionId: number, isImplemented: boolean) => {
    try {
      await trpc.updateSuggestionStatus.mutate({ 
        suggestionId, 
        isImplemented: !isImplemented 
      });
      
      // Update local state
      setSuggestions((prev: OptimizationSuggestion[]) =>
        prev.map((s: OptimizationSuggestion) =>
          s.id === suggestionId ? { ...s, is_implemented: !isImplemented } : s
        )
      );
    } catch (error) {
      console.error('Failed to update suggestion status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'title': return <Target className="h-4 w-4" />;
      case 'meta_description': return <FileText className="h-4 w-4" />;
      case 'headings': return <Hash className="h-4 w-4" />;
      case 'internal_links': return <Link className="h-4 w-4" />;
      case 'images': return <Image className="h-4 w-4" />;
      case 'keyword_density': return <TrendingUp className="h-4 w-4" />;
      case 'readability': return <BookOpen className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Filter suggestions based on current filters
  const filteredSuggestions = suggestions.filter((suggestion: OptimizationSuggestion) => {
    if (filterPriority !== 'all' && suggestion.priority !== filterPriority) return false;
    if (filterType !== 'all' && suggestion.suggestion_type !== filterType) return false;
    if (!showImplemented && suggestion.is_implemented) return false;
    return true;
  });

  const selectedOutline = outlines.find((outline: ContentOutline) => outline.id === selectedOutlineId);

  // Calculate stats
  const totalSuggestions = suggestions.length;
  const implementedCount = suggestions.filter((s: OptimizationSuggestion) => s.is_implemented).length;
  const highPriorityCount = suggestions.filter((s: OptimizationSuggestion) => s.priority === 'high').length;
  const avgImpact = suggestions.length > 0 
    ? Math.round(suggestions.reduce((sum, s) => sum + s.impact_score, 0) / suggestions.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Content Selection */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Select Content to Optimize
          </CardTitle>
        </CardHeader>
        <CardContent>
          {outlines.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No content outlines found. Create some content outlines first to get optimization suggestions.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Outline</label>
                <Select
                  value={selectedOutlineId?.toString() || ''}
                  onValueChange={(value: string) => setSelectedOutlineId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a content outline" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlines.map((outline: ContentOutline) => (
                      <SelectItem key={outline.id} value={outline.id.toString()}>
                        {outline.title} ({outline.target_keyword})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOutline && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{selectedOutline.title}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Target Keyword:</strong> {selectedOutline.target_keyword}</p>
                    <p><strong>Content Type:</strong> {selectedOutline.content_type.replace('_', ' ')}</p>
                    <p><strong>Word Count Target:</strong> {selectedOutline.word_count_target.toLocaleString()}</p>
                  </div>
                  
                  <Button 
                    onClick={handleGenerateSuggestions} 
                    disabled={isGenerating}
                    className="mt-3"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        Generating AI Suggestions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate AI Suggestions
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions Dashboard */}
      {selectedOutlineId && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{totalSuggestions}</div>
                <div className="text-sm text-gray-600">Total Suggestions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{implementedCount}</div>
                <div className="text-sm text-gray-600">Implemented</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
                <div className="text-sm text-gray-600">High Priority</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{avgImpact}%</div>
                <div className="text-sm text-gray-600">Avg Impact Score</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          {suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filter Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="meta_description">Meta Description</SelectItem>
                        <SelectItem value="headings">Headings</SelectItem>
                        <SelectItem value="internal_links">Internal Links</SelectItem>
                        <SelectItem value="images">Images</SelectItem>
                        <SelectItem value="keyword_density">Keyword Density</SelectItem>
                        <SelectItem value="readability">Readability</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="show-implemented"
                        checked={showImplemented}
                        onCheckedChange={(checked: boolean) => setShowImplemented(checked)}
                      />
                      <label htmlFor="show-implemented" className="text-sm">
                        Show implemented suggestions
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Optimization Suggestions ({filteredSuggestions.length})
              </CardTitle>
              {suggestions.length > 0 && suggestions.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    💡 Note: This is using placeholder data. In a real implementation, this would provide AI-generated SEO suggestions.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading suggestions...</div>
              ) : filteredSuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {suggestions.length === 0 
                    ? "No suggestions yet. Generate AI suggestions to get started! 🚀"
                    : "No suggestions match your current filters."
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSuggestions.map((suggestion: OptimizationSuggestion) => (
                    <div
                      key={suggestion.id}
                      className={`border rounded-lg p-6 transition-all ${
                        suggestion.is_implemented ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => handleToggleSuggestion(suggestion.id, suggestion.is_implemented)}
                            className="mt-1 text-gray-400 hover:text-green-600 transition-colors"
                          >
                            {suggestion.is_implemented ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getTypeIcon(suggestion.suggestion_type)}
                              <span className="font-medium text-gray-900 capitalize">
                                {suggestion.suggestion_type.replace('_', ' ')}
                              </span>
                              <Badge className={getPriorityColor(suggestion.priority)}>
                                {suggestion.priority} priority
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 mb-3">{suggestion.suggestion}</p>
                            
                            {(suggestion.current_value || suggestion.recommended_value) && (
                              <div className="space-y-2">
                                {suggestion.current_value && (
                                  <div className="text-sm">
                                    <span className="text-gray-600">Current:</span>
                                    <div className="bg-red-50 border border-red-200 p-2 rounded text-red-800 mt-1">
                                      {suggestion.current_value}
                                    </div>
                                  </div>
                                )}
                                {suggestion.recommended_value && (
                                  <div className="text-sm">
                                    <span className="text-gray-600">Recommended:</span>
                                    <div className="bg-green-50 border border-green-200 p-2 rounded text-green-800 mt-1">
                                      {suggestion.recommended_value}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className="text-sm text-gray-600 mb-1">Impact Score</div>
                          <div className={`text-2xl font-bold ${getImpactColor(suggestion.impact_score)}`}>
                            {suggestion.impact_score}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Created {suggestion.created_at.toLocaleDateString()}
                        {suggestion.is_implemented && (
                          <span className="text-green-600 ml-2">✓ Implemented</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}