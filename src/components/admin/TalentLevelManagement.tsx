
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, Users, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TalentLevel {
  level: string;
  count: number;
  percentage: number;
  totalEarnings: number;
  avgRating: number;
  requirements: string;
  upgradePath: string;
}

const TalentLevelManagement = () => {
  const [talentLevels, setTalentLevels] = useState<TalentLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTalentLevels();
  }, []);

  const fetchTalentLevels = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('talent_level, total_earnings, rating, total_bookings')
        .eq('user_type', 'companion');

      if (error) {
        console.error('Error fetching talent levels:', error);
        // Don't throw error, just handle gracefully
        setTalentLevels([]);
        setLoading(false);
        return;
      }

      // Handle case where profiles might be null or empty
      const safeProfiles = profiles || [];

      // Group talents by level
      const levelGroups: { [key: string]: any[] } = {};
      safeProfiles.forEach(profile => {
        const level = profile.talent_level || 'fresh';
        if (!levelGroups[level]) {
          levelGroups[level] = [];
        }
        levelGroups[level].push(profile);
      });

      const totalTalents = safeProfiles.length;
      
      // Calculate stats for each level
      const levels: TalentLevel[] = Object.entries(levelGroups).map(([level, talents]) => {
        const count = talents.length;
        const percentage = totalTalents > 0 ? Math.round((count / totalTalents) * 100) : 0;
        const totalEarnings = talents.reduce((sum, t) => sum + (t.total_earnings || 0), 0);
        const avgRating = talents.length > 0 
          ? talents.reduce((sum, t) => sum + (t.rating || 0), 0) / talents.length 
          : 0;

        // Define requirements and upgrade paths based on level
        let requirements = '';
        let upgradePath = '';
        
        switch (level) {
          case 'fresh':
            requirements = 'Default level untuk talent baru';
            upgradePath = 'Selesaikan 30 order dengan rating 4.5+';
            break;
          case 'elite':
            requirements = '30+ order selesai, rating minimal 4.5/5';
            upgradePath = '6 bulan aktif + 100 order dengan rating 4.5+';
            break;
          case 'vip':
            requirements = '6+ bulan aktif, 100+ order, rating minimal 4.5/5';
            upgradePath = 'Level tertinggi';
            break;
          default:
            requirements = 'Level tidak dikenal';
            upgradePath = 'Hubungi admin';
        }

        return {
          level,
          count,
          percentage,
          totalEarnings,
          avgRating,
          requirements,
          upgradePath
        };
      });

      // Sort by level hierarchy
      const levelOrder = { fresh: 0, elite: 1, vip: 2 };
      levels.sort((a, b) => (levelOrder[a.level as keyof typeof levelOrder] || 999) - (levelOrder[b.level as keyof typeof levelOrder] || 999));

      setTalentLevels(levels);
    } catch (error) {
      console.error('Error fetching talent levels:', error);
      // Don't show error toast for empty data, just set empty state
      setTalentLevels([]);
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'fresh':
        return <Star className="w-5 h-5 text-blue-500" />;
      case 'elite':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'vip':
        return <Trophy className="w-5 h-5 text-purple-500" />;
      default:
        return <Users className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'fresh':
        return 'border-blue-200 bg-blue-50';
      case 'elite':
        return 'border-green-200 bg-green-50';
      case 'vip':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading talent levels...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{talentLevels.reduce((sum, level) => sum + level.count, 0)}</div>
                <div className="text-sm text-gray-600">Total Talents</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  Rp {Math.round(talentLevels.reduce((sum, level) => sum + level.totalEarnings, 0) / 1000000)}M
                </div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {talentLevels.length > 0 
                    ? (talentLevels.reduce((sum, level) => sum + (level.avgRating * level.count), 0) / 
                       talentLevels.reduce((sum, level) => sum + level.count, 0)).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{talentLevels.length}</div>
                <div className="text-sm text-gray-600">Active Levels</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Talent Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {talentLevels.map((level) => (
          <Card key={level.level} className={`border-2 ${getLevelColor(level.level)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getLevelIcon(level.level)}
                  <CardTitle className="capitalize">
                    {level.level === 'fresh' ? 'Fresh Talent' : 
                     level.level === 'elite' ? 'Elite Talent' : 
                     level.level === 'vip' ? 'VIP Talent' : level.level}
                  </CardTitle>
                </div>
                <Badge variant="outline">{level.percentage}%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{level.count}</div>
                  <div className="text-sm text-gray-600">Talents</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Earnings:</span>
                    <span className="font-medium">Rp {Math.round(level.totalEarnings / 1000)}K</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Rating:</span>
                    <span className="font-medium">{level.avgRating.toFixed(1)}/5</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-700 mb-1">Requirements:</div>
                    <div className="text-gray-600 text-xs mb-2">{level.requirements}</div>
                    
                    <div className="font-semibold text-gray-700 mb-1">Upgrade Path:</div>
                    <div className="text-gray-600 text-xs">{level.upgradePath}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Data Message */}
      {talentLevels.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Talents Found</h3>
            <p className="text-gray-500">No talent data available in the system.</p>
            <Button 
              onClick={fetchTalentLevels} 
              className="mt-4"
              variant="outline"
            >
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TalentLevelManagement;
