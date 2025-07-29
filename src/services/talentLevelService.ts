import { supabase } from '@/integrations/supabase/client';

export type TalentLevel = 'fresh' | 'elite' | 'vip';

export interface TalentLevelRequirements {
  fresh: {
    minOrders: 0;
    minRating: 0;
    minActiveMonths: 0;
    commissionRate: 20;
  };
  elite: {
    minOrders: 30;
    minRating: 4.5;
    minActiveMonths: 0;
    commissionRate: 18;
  };
  vip: {
    minOrders: 100;
    minRating: 4.5;
    minActiveMonths: 6;
    commissionRate: 15;
  };
}

export interface TalentLevelProgress {
  currentLevel: TalentLevel;
  nextLevel?: TalentLevel;
  currentOrders: number;
  currentRating: number;
  activeMonths: number;
  ordersToNext?: number;
  ratingToNext?: number;
  monthsToNext?: number;
  canUpgrade: boolean;
  benefits: {
    commissionRate: number;
    features: string[];
  };
}

export class TalentLevelService {
  private static readonly LEVEL_REQUIREMENTS: TalentLevelRequirements = {
    fresh: {
      minOrders: 0,
      minRating: 0,
      minActiveMonths: 0,
      commissionRate: 20
    },
    elite: {
      minOrders: 30,
      minRating: 4.5,
      minActiveMonths: 0,
      commissionRate: 18
    },
    vip: {
      minOrders: 100,
      minRating: 4.5,
      minActiveMonths: 6,
      commissionRate: 15
    }
  };

  // Calculate talent level based on statistics
  static calculateTalentLevel(
    totalOrders: number,
    averageRating: number,
    accountCreatedAt: Date
  ): TalentLevel {
    const activeMonths = this.calculateActiveMonths(accountCreatedAt);

    // Check VIP requirements
    if (
      totalOrders >= this.LEVEL_REQUIREMENTS.vip.minOrders &&
      averageRating >= this.LEVEL_REQUIREMENTS.vip.minRating &&
      activeMonths >= this.LEVEL_REQUIREMENTS.vip.minActiveMonths
    ) {
      return 'vip';
    }

    // Check Elite requirements
    if (
      totalOrders >= this.LEVEL_REQUIREMENTS.elite.minOrders &&
      averageRating >= this.LEVEL_REQUIREMENTS.elite.minRating
    ) {
      return 'elite';
    }

    // Default to Fresh
    return 'fresh';
  }

  // Calculate months since account creation
  private static calculateActiveMonths(createdAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  }

  // Get talent level progress for a specific talent
  static async getTalentLevelProgress(talentId: string): Promise<TalentLevelProgress | null> {
    try {
      // Get talent profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('talent_level, total_orders, average_rating, created_at')
        .eq('id', talentId)
        .eq('user_type', 'companion')
        .single();

      if (profileError || !profile) {
        console.error('Error fetching talent profile:', profileError);
        return null;
      }

      const currentLevel = profile.talent_level as TalentLevel;
      const currentOrders = profile.total_orders || 0;
      const currentRating = profile.average_rating || 0;
      const activeMonths = this.calculateActiveMonths(new Date(profile.created_at));

      // Calculate what the level should be based on current stats
      const calculatedLevel = this.calculateTalentLevel(
        currentOrders,
        currentRating,
        new Date(profile.created_at)
      );

      // Determine next level
      let nextLevel: TalentLevel | undefined;
      if (currentLevel === 'fresh') nextLevel = 'elite';
      else if (currentLevel === 'elite') nextLevel = 'vip';

      // Calculate requirements for next level
      let ordersToNext: number | undefined;
      let ratingToNext: number | undefined;
      let monthsToNext: number | undefined;
      let canUpgrade = false;

      if (nextLevel) {
        const nextRequirements = this.LEVEL_REQUIREMENTS[nextLevel];
        ordersToNext = Math.max(0, nextRequirements.minOrders - currentOrders);
        ratingToNext = Math.max(0, nextRequirements.minRating - currentRating);
        monthsToNext = Math.max(0, nextRequirements.minActiveMonths - activeMonths);

        canUpgrade = ordersToNext === 0 && ratingToNext === 0 && monthsToNext === 0;
      }

      // Get benefits for current level
      const benefits = this.getLevelBenefits(currentLevel);

      return {
        currentLevel,
        nextLevel,
        currentOrders,
        currentRating,
        activeMonths,
        ordersToNext,
        ratingToNext,
        monthsToNext,
        canUpgrade,
        benefits
      };

    } catch (error) {
      console.error('Error getting talent level progress:', error);
      return null;
    }
  }

  // Get benefits for a specific talent level
  private static getLevelBenefits(level: TalentLevel): { commissionRate: number; features: string[] } {
    const commissionRate = this.LEVEL_REQUIREMENTS[level].commissionRate;
    
    const features = {
      fresh: [
        'Basic profile visibility',
        'Standard customer support',
        'Access to all services',
        '20% platform commission'
      ],
      elite: [
        'Enhanced profile visibility',
        'Priority customer support',
        'Featured in search results',
        'Access to premium tools',
        '18% platform commission'
      ],
      vip: [
        'Maximum profile visibility',
        'VIP customer support',
        'Top placement in search',
        'Advanced analytics',
        'Custom service rates',
        'Priority booking notifications',
        '15% platform commission'
      ]
    };

    return {
      commissionRate,
      features: features[level]
    };
  }

  // Update talent level if eligible
  static async updateTalentLevel(talentId: string): Promise<{ updated: boolean; newLevel?: TalentLevel; oldLevel?: TalentLevel }> {
    try {
      const progress = await this.getTalentLevelProgress(talentId);
      
      if (!progress) {
        return { updated: false };
      }

      const calculatedLevel = this.calculateTalentLevel(
        progress.currentOrders,
        progress.currentRating,
        new Date()
      );

      // Check if level should be updated
      if (calculatedLevel !== progress.currentLevel) {
        const { error } = await supabase
          .from('profiles')
          .update({
            talent_level: calculatedLevel,
            updated_at: new Date().toISOString()
          })
          .eq('id', talentId);

        if (error) {
          console.error('Error updating talent level:', error);
          return { updated: false };
        }

        // Update newcomer status if moving from fresh
        if (progress.currentLevel === 'fresh' && calculatedLevel !== 'fresh') {
          await supabase
            .from('profiles')
            .update({ is_newcomer: false })
            .eq('id', talentId);
        }

        return {
          updated: true,
          newLevel: calculatedLevel,
          oldLevel: progress.currentLevel
        };
      }

      return { updated: false };

    } catch (error) {
      console.error('Error updating talent level:', error);
      return { updated: false };
    }
  }

  // Batch update all talent levels
  static async updateAllTalentLevels(): Promise<{ updated: number; errors: number }> {
    try {
      let updated = 0;
      let errors = 0;

      // Get all talents
      const { data: talents, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'companion');

      if (error) {
        console.error('Error fetching talents:', error);
        return { updated: 0, errors: 1 };
      }

      // Update each talent level
      for (const talent of talents || []) {
        try {
          const result = await this.updateTalentLevel(talent.id);
          if (result.updated) {
            updated++;
            console.log(`Updated talent ${talent.id} from ${result.oldLevel} to ${result.newLevel}`);
          }
        } catch (error) {
          console.error(`Error updating talent ${talent.id}:`, error);
          errors++;
        }
      }

      return { updated, errors };

    } catch (error) {
      console.error('Error in batch update:', error);
      return { updated: 0, errors: 1 };
    }
  }

  // Get talent level statistics
  static async getTalentLevelStats(): Promise<{
    fresh: number;
    elite: number;
    vip: number;
    total: number;
  }> {
    try {
      const { data: talents, error } = await supabase
        .from('profiles')
        .select('talent_level')
        .eq('user_type', 'companion');

      if (error) {
        console.error('Error fetching talent level stats:', error);
        return { fresh: 0, elite: 0, vip: 0, total: 0 };
      }

      const stats = {
        fresh: 0,
        elite: 0,
        vip: 0,
        total: talents?.length || 0
      };

      talents?.forEach(talent => {
        const level = talent.talent_level as TalentLevel;
        if (level in stats) {
          stats[level]++;
        }
      });

      return stats;

    } catch (error) {
      console.error('Error getting talent level stats:', error);
      return { fresh: 0, elite: 0, vip: 0, total: 0 };
    }
  }
}
