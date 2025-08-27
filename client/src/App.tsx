import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeywordResearch } from '@/components/KeywordResearch';
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis';
import { ContentOutlines } from '@/components/ContentOutlines';
import { OptimizationSuggestions } from '@/components/OptimizationSuggestions';
import { Search, Users, FileText, Lightbulb } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('keyword-research');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Search className="h-8 w-8 text-blue-600" />
            SEO Content Creator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your comprehensive toolkit for keyword research, competitor analysis, and content optimization 🚀
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="keyword-research" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="competitor-analysis" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Competitors
            </TabsTrigger>
            <TabsTrigger value="content-outlines" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Optimize
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keyword-research" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Keyword Research
                </CardTitle>
                <CardDescription>
                  Discover high-value keywords for your content strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KeywordResearch />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitor-analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Competitor Analysis
                </CardTitle>
                <CardDescription>
                  Analyze what your competitors are ranking for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompetitorAnalysis />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content-outlines" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Content Outlines
                </CardTitle>
                <CardDescription>
                  Create and manage SEO-optimized content outlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentOutlines />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-orange-600" />
                  Optimization Suggestions
                </CardTitle>
                <CardDescription>
                  Get AI-powered suggestions to improve your content's SEO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OptimizationSuggestions />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;