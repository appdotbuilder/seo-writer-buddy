import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { Search, TrendingUp, DollarSign, BarChart3, Save, AlertCircle } from 'lucide-react';
import type { Keyword, KeywordResearchInput, CreateKeywordInput } from '../../../server/src/schema';

export function KeywordResearch() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [researchResults, setResearchResults] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<number>>(new Set());

  // Research form data
  const [researchData, setResearchData] = useState<KeywordResearchInput>({
    seed_keyword: '',
    location: '',
    language: 'en',
    include_related: true,
    min_search_volume: 0,
    max_difficulty: 100
  });

  const loadKeywords = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getKeywords.query();
      setKeywords(result);
    } catch (error) {
      console.error('Failed to load keywords:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchData.seed_keyword.trim()) return;

    try {
      setIsResearching(true);
      const results = await trpc.performKeywordResearch.query(researchData);
      setResearchResults(results);
    } catch (error) {
      console.error('Research failed:', error);
    } finally {
      setIsResearching(false);
    }
  };

  const handleSaveKeyword = async (keyword: Keyword) => {
    try {
      const keywordData: CreateKeywordInput = {
        keyword: keyword.keyword,
        search_volume: keyword.search_volume,
        difficulty: keyword.difficulty,
        cpc: keyword.cpc,
        competition: keyword.competition,
        trend_data: keyword.trend_data
      };
      
      const saved = await trpc.createKeyword.mutate(keywordData);
      setKeywords((prev: Keyword[]) => [saved, ...prev]);
      
      // Remove from research results
      setResearchResults((prev: Keyword[]) => 
        prev.filter((k: Keyword) => k.id !== keyword.id)
      );
    } catch (error) {
      console.error('Failed to save keyword:', error);
    }
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'text-green-600';
    if (difficulty <= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Research Form */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Keyword Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seed_keyword">Seed Keyword *</Label>
                <Input
                  id="seed_keyword"
                  placeholder="e.g., content marketing"
                  value={researchData.seed_keyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setResearchData((prev: KeywordResearchInput) => ({ 
                      ...prev, 
                      seed_keyword: e.target.value 
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., United States"
                  value={researchData.location || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setResearchData((prev: KeywordResearchInput) => ({ 
                      ...prev, 
                      location: e.target.value || undefined 
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={researchData.language}
                  onValueChange={(value: string) =>
                    setResearchData((prev: KeywordResearchInput) => ({ 
                      ...prev, 
                      language: value 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_volume">Min Search Volume</Label>
                <Input
                  id="min_volume"
                  type="number"
                  min="0"
                  value={researchData.min_search_volume}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setResearchData((prev: KeywordResearchInput) => ({ 
                      ...prev, 
                      min_search_volume: parseInt(e.target.value) || 0 
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_difficulty">Max Difficulty</Label>
                <Input
                  id="max_difficulty"
                  type="number"
                  min="0"
                  max="100"
                  value={researchData.max_difficulty}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setResearchData((prev: KeywordResearchInput) => ({ 
                      ...prev, 
                      max_difficulty: parseInt(e.target.value) || 100 
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="include_related"
                checked={researchData.include_related}
                onCheckedChange={(checked: boolean) =>
                  setResearchData((prev: KeywordResearchInput) => ({ 
                    ...prev, 
                    include_related: checked 
                  }))
                }
              />
              <Label htmlFor="include_related">Include related keywords</Label>
            </div>

            <Button type="submit" disabled={isResearching} className="w-full">
              {isResearching ? (
                <>
                  <Search className="mr-2 h-4 w-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Research Keywords
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Research Results */}
      {researchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Research Results ({researchResults.length})</CardTitle>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                💡 Note: This is using placeholder data. In a real implementation, this would connect to keyword research APIs.
              </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {researchResults.map((keyword: Keyword) => (
                <div key={keyword.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg">{keyword.keyword}</h4>
                        <Badge className={getCompetitionColor(keyword.competition)}>
                          {keyword.competition}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{keyword.search_volume.toLocaleString()} searches/mo</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          <span className={getDifficultyColor(keyword.difficulty)}>
                            {keyword.difficulty}% difficulty
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${keyword.cpc.toFixed(2)} CPC</span>
                        </div>
                        <div className="text-gray-400">
                          {keyword.created_at.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleSaveKeyword(keyword)}
                      size="sm"
                      className="ml-4"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Saved Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Saved Keywords ({keywords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading keywords...</div>
          ) : keywords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No saved keywords yet. Research some keywords above to get started! 🔍
            </div>
          ) : (
            <div className="space-y-3">
              {keywords.map((keyword: Keyword) => (
                <div key={keyword.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-lg">{keyword.keyword}</h4>
                    <Badge className={getCompetitionColor(keyword.competition)}>
                      {keyword.competition}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{keyword.search_volume.toLocaleString()} searches/mo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span className={getDifficultyColor(keyword.difficulty)}>
                        {keyword.difficulty}% difficulty
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${keyword.cpc.toFixed(2)} CPC</span>
                    </div>
                    <div className="text-gray-400">
                      Saved {keyword.created_at.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}