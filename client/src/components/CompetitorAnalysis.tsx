import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { Search, ExternalLink, Trophy, Link2, FileText, AlertCircle, Save } from 'lucide-react';
import type { Competitor, CompetitorAnalysisInput, CreateCompetitorInput } from '../../../server/src/schema';

export function CompetitorAnalysis() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [analysisResults, setAnalysisResults] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analysis form data
  const [analysisData, setAnalysisData] = useState<CompetitorAnalysisInput>({
    target_keyword: '',
    location: '',
    limit: 10
  });

  const loadCompetitors = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getCompetitors.query();
      setCompetitors(result);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisData.target_keyword.trim()) return;

    try {
      setIsAnalyzing(true);
      const results = await trpc.performCompetitorAnalysis.query(analysisData);
      setAnalysisResults(results);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveCompetitor = async (competitor: Competitor) => {
    try {
      const competitorData: CreateCompetitorInput = {
        domain: competitor.domain,
        title: competitor.title,
        url: competitor.url,
        meta_description: competitor.meta_description,
        word_count: competitor.word_count,
        domain_authority: competitor.domain_authority,
        page_authority: competitor.page_authority,
        backlinks: competitor.backlinks,
        ranking_position: competitor.ranking_position,
        target_keyword: competitor.target_keyword,
        content_quality_score: competitor.content_quality_score
      };
      
      const saved = await trpc.createCompetitor.mutate(competitorData);
      setCompetitors((prev: Competitor[]) => [saved, ...prev]);
      
      // Remove from analysis results
      setAnalysisResults((prev: Competitor[]) => 
        prev.filter((c: Competitor) => c.id !== competitor.id)
      );
    } catch (error) {
      console.error('Failed to save competitor:', error);
    }
  };

  const getRankingColor = (position: number) => {
    if (position <= 3) return 'bg-green-100 text-green-800';
    if (position <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getAuthorityColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Analysis Form */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Competitor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalysis} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_keyword">Target Keyword *</Label>
                <Input
                  id="target_keyword"
                  placeholder="e.g., best content marketing tools"
                  value={analysisData.target_keyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAnalysisData((prev: CompetitorAnalysisInput) => ({ 
                      ...prev, 
                      target_keyword: e.target.value 
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
                  value={analysisData.location || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAnalysisData((prev: CompetitorAnalysisInput) => ({ 
                      ...prev, 
                      location: e.target.value || undefined 
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Number of Results</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="50"
                value={analysisData.limit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAnalysisData((prev: CompetitorAnalysisInput) => ({ 
                    ...prev, 
                    limit: parseInt(e.target.value) || 10 
                  }))
                }
              />
            </div>

            <Button type="submit" disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Search className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Competitors...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze Competitors
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Results ({analysisResults.length})</CardTitle>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                💡 Note: This is using placeholder data. In a real implementation, this would connect to SEO analysis APIs.
              </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResults.map((competitor: Competitor) => (
                <div key={competitor.id} className="border rounded-lg p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getRankingColor(competitor.ranking_position)}>
                          <Trophy className="h-3 w-3 mr-1" />
                          #{competitor.ranking_position}
                        </Badge>
                        <h4 className="font-medium text-lg">{competitor.title}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2 text-blue-600">
                        <ExternalLink className="h-4 w-4" />
                        <a 
                          href={competitor.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {competitor.domain}
                        </a>
                      </div>

                      {competitor.meta_description && (
                        <p className="text-gray-600 text-sm mb-3">{competitor.meta_description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Domain Authority</span>
                            <span className={getAuthorityColor(competitor.domain_authority)}>
                              {competitor.domain_authority}
                            </span>
                          </div>
                          <Progress value={competitor.domain_authority} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Page Authority</span>
                            <span className={getAuthorityColor(competitor.page_authority)}>
                              {competitor.page_authority}
                            </span>
                          </div>
                          <Progress value={competitor.page_authority} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Content Quality</span>
                            <span className={getQualityColor(competitor.content_quality_score)}>
                              {competitor.content_quality_score}
                            </span>
                          </div>
                          <Progress value={competitor.content_quality_score} className="h-2" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Link2 className="h-4 w-4" />
                            <span>{competitor.backlinks.toLocaleString()} backlinks</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{competitor.word_count.toLocaleString()} words</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleSaveCompetitor(competitor)}
                      size="sm"
                      className="ml-4"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>

                  <div className="text-xs text-gray-400 mt-3">
                    Target keyword: <span className="font-medium">{competitor.target_keyword}</span> • 
                    Analyzed {competitor.analyzed_at.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Saved Competitors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Saved Competitor Analysis ({competitors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading competitor data...</div>
          ) : competitors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No competitor analysis saved yet. Analyze some competitors above to get started! 🏆
            </div>
          ) : (
            <div className="space-y-4">
              {competitors.map((competitor: Competitor) => (
                <div key={competitor.id} className="border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={getRankingColor(competitor.ranking_position)}>
                      <Trophy className="h-3 w-3 mr-1" />
                      #{competitor.ranking_position}
                    </Badge>
                    <h4 className="font-medium text-lg">{competitor.title}</h4>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={competitor.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {competitor.domain}
                    </a>
                  </div>

                  {competitor.meta_description && (
                    <p className="text-gray-600 text-sm mb-3">{competitor.meta_description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Domain Authority</span>
                        <span className={getAuthorityColor(competitor.domain_authority)}>
                          {competitor.domain_authority}
                        </span>
                      </div>
                      <Progress value={competitor.domain_authority} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Page Authority</span>
                        <span className={getAuthorityColor(competitor.page_authority)}>
                          {competitor.page_authority}
                        </span>
                      </div>
                      <Progress value={competitor.page_authority} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Content Quality</span>
                        <span className={getQualityColor(competitor.content_quality_score)}>
                          {competitor.content_quality_score}
                        </span>
                      </div>
                      <Progress value={competitor.content_quality_score} className="h-2" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Link2 className="h-4 w-4" />
                        <span>{competitor.backlinks.toLocaleString()} backlinks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{competitor.word_count.toLocaleString()} words</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mt-3">
                    Target keyword: <span className="font-medium">{competitor.target_keyword}</span> • 
                    Saved {competitor.analyzed_at.toLocaleDateString()}
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