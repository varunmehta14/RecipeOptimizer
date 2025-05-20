import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/Loader';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getRecipes,
  getLLMRuns,
  getChromaCollections,
  getRecipeDetail
} from '@/lib/api';

export function Database() {
  const [activeTab, setActiveTab] = useState('sqlite');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  
  // Fetch data using React Query
  const {
    data: recipes,
    isLoading: recipesLoading,
    error: recipesError
  } = useQuery({
    queryKey: ['recipes'],
    queryFn: getRecipes
  });
  
  const {
    data: llmRuns,
    isLoading: llmRunsLoading,
    error: llmRunsError
  } = useQuery({
    queryKey: ['llmRuns'],
    queryFn: () => getLLMRuns(50)
  });
  
  const {
    data: chromaCollections,
    isLoading: collectionsLoading,
    error: collectionsError
  } = useQuery({
    queryKey: ['chromaCollections'],
    queryFn: getChromaCollections
  });
  
  const {
    data: recipeDetail,
    isLoading: recipeDetailLoading,
    error: recipeDetailError
  } = useQuery({
    queryKey: ['recipeDetail', selectedRecipeId],
    queryFn: () => selectedRecipeId ? getRecipeDetail(selectedRecipeId) : Promise.resolve(null),
    enabled: !!selectedRecipeId
  });
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };
  
  const viewRecipeDetail = (recipeId: number) => {
    setSelectedRecipeId(recipeId);
    // Force UI update for tab change
    setTimeout(() => {
      setActiveTab('recipeDetail');
    }, 10);
  };
  
  // Use useEffect to ensure tab is updated when a recipe is selected
  useEffect(() => {
    if (selectedRecipeId !== null) {
      setActiveTab('recipeDetail');
    }
  }, [selectedRecipeId]);
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 mb-8 text-white shadow-lg">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-2">Database Explorer</h1>
          <p className="text-lg opacity-90">View the contents of your SQLite and Chroma vector databases</p>
        </div>
      </div>
      
      {/* Main content */}
      <Tabs
        value={activeTab}
        defaultValue="sqlite"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sqlite">SQLite Recipes</TabsTrigger>
          <TabsTrigger value="llmRuns">LLM Processing</TabsTrigger>
          <TabsTrigger value="collections">Chroma Collections</TabsTrigger>
          <TabsTrigger value="recipeDetail" disabled={!selectedRecipeId}>
            Recipe Detail
          </TabsTrigger>
        </TabsList>
        
        {/* SQLite Recipes Tab */}
        <TabsContent value="sqlite">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Database</CardTitle>
              <CardDescription>
                All recipes stored in the SQLite database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recipesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader size="lg" />
                </div>
              ) : recipesError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {recipesError instanceof Error
                      ? recipesError.message
                      : 'Failed to load recipes'
                    }
                  </AlertDescription>
                </Alert>
              ) : recipes && recipes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Recipe Preview</TableHead>
                      <TableHead>Goal</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipes.map((recipe) => (
                      <TableRow key={recipe.id}>
                        <TableCell className="font-medium">{recipe.id}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {recipe.raw_text_preview}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            {recipe.goal}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(recipe.created_at)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewRecipeDetail(recipe.id)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recipes found in the database
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* LLM Runs Tab */}
        <TabsContent value="llmRuns">
          <Card>
            <CardHeader>
              <CardTitle>LLM Processing Steps</CardTitle>
              <CardDescription>
                Details of all AI processing steps stored in the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {llmRunsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader size="lg" />
                </div>
              ) : llmRunsError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {llmRunsError instanceof Error
                      ? llmRunsError.message
                      : 'Failed to load LLM runs'
                    }
                  </AlertDescription>
                </Alert>
              ) : llmRuns && llmRuns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Recipe ID</TableHead>
                      <TableHead>Step</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Latency (ms)</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {llmRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">{run.id}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            className="p-0 h-auto"
                            onClick={() => viewRecipeDetail(run.recipe_id)}
                          >
                            {run.recipe_id}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">
                            {run.step_name}
                          </Badge>
                        </TableCell>
                        <TableCell>{run.tokens_used}</TableCell>
                        <TableCell>{run.latency_ms}</TableCell>
                        <TableCell>{formatDate(run.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No LLM processing steps found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Chroma Collections Tab */}
        <TabsContent value="collections">
          <Card>
            <CardHeader>
              <CardTitle>Chroma Collections</CardTitle>
              <CardDescription>
                Vector database collections used for semantic search
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collectionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader size="lg" />
                </div>
              ) : collectionsError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {collectionsError instanceof Error
                      ? collectionsError.message
                      : 'Failed to load collections'
                    }
                  </AlertDescription>
                </Alert>
              ) : chromaCollections && chromaCollections.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collection ID</TableHead>
                      <TableHead>Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chromaCollections.map((collection) => (
                      <TableRow key={collection.id}>
                        <TableCell className="font-mono text-xs">{collection.id}</TableCell>
                        <TableCell className="font-medium">{collection.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No vector collections found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recipe Detail Tab */}
        <TabsContent value="recipeDetail">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recipe Details</CardTitle>
                  {recipeDetail && (
                    <CardDescription>
                      Recipe ID: {recipeDetail.id} | Goal: {recipeDetail.goal}
                    </CardDescription>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('sqlite')}
                >
                  Back to List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recipeDetailLoading ? (
                <div className="flex justify-center py-8">
                  <Loader size="lg" />
                </div>
              ) : recipeDetailError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {recipeDetailError instanceof Error
                      ? recipeDetailError.message
                      : 'Failed to load recipe details'
                    }
                  </AlertDescription>
                </Alert>
              ) : recipeDetail ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Recipe Text</h3>
                    <div className="bg-slate-50 p-4 rounded-md whitespace-pre-wrap border">
                      {recipeDetail.raw_text}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Processing Steps</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Step</TableHead>
                          <TableHead>Tokens</TableHead>
                          <TableHead>Latency (ms)</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipeDetail.llm_runs.map((run) => (
                          <TableRow key={run.id}>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                {run.step_name}
                              </Badge>
                            </TableCell>
                            <TableCell>{run.tokens_used}</TableCell>
                            <TableCell>{run.latency_ms}</TableCell>
                            <TableCell>{formatDate(run.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a recipe to view details
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 