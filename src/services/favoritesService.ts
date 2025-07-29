import { supabase } from '@/integrations/supabase/client';

export interface UserFavorite {
  id: string;
  user_id: string;
  talent_id: string;
  created_at: string;
  updated_at: string;
}

export interface FavoriteWithTalent extends UserFavorite {
  talent: {
    id: string;
    name: string;
    email: string;
    profile_image?: string;
    location?: string;
    average_rating?: number;
    total_orders?: number;
    available_services?: string[];
  };
}

export class FavoritesService {
  /**
   * Get all favorites for a user
   */
  static async getUserFavorites(userId: string): Promise<FavoriteWithTalent[]> {
    try {
      console.log('🔄 [FavoritesService] getUserFavorites called with userId:', userId);

      // First get the favorites
      const { data: favorites, error: favoritesError } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (favoritesError) {
        console.error('❌ [FavoritesService] Error fetching user favorites:', favoritesError);

        // If table doesn't exist, return empty array instead of throwing
        if (favoritesError.code === '42P01' || favoritesError.message.includes('relation "user_favorites" does not exist')) {
          console.log('⚠️ [FavoritesService] Favorites table not created yet, returning empty array');
          return [];
        }
        throw favoritesError;
      }

      console.log('✅ [FavoritesService] Raw favorites data:', favorites);
      console.log('✅ [FavoritesService] Found', favorites?.length || 0, 'favorites');

      if (!favorites || favorites.length === 0) {
        return [];
      }

      // Now get the talent details for each favorite
      const talentIds = favorites.map(fav => fav.talent_id);
      console.log('🔄 [FavoritesService] Fetching talent details for IDs:', talentIds);

      const { data: talents, error: talentsError } = await supabase
        .from('profiles')
        .select('id, name, email, profile_image, location, average_rating, total_orders, available_services')
        .in('id', talentIds);

      if (talentsError) {
        console.error('❌ [FavoritesService] Error fetching talent details:', talentsError);
        throw talentsError;
      }

      console.log('✅ [FavoritesService] Talent details:', talents);

      // Combine favorites with talent data
      const favoritesWithTalents: FavoriteWithTalent[] = favorites.map(favorite => {
        const talent = talents?.find(t => t.id === favorite.talent_id);
        return {
          ...favorite,
          talent: talent || {
            id: favorite.talent_id,
            name: 'Unknown Talent',
            email: '',
            profile_image: null,
            location: 'Unknown',
            average_rating: 0,
            total_orders: 0,
            available_services: []
          }
        };
      });

      console.log('✅ [FavoritesService] Final favorites with talents:', favoritesWithTalents);
      return favoritesWithTalents;

    } catch (error) {
      console.error('❌ [FavoritesService] Error in getUserFavorites:', error);
      // Return empty array instead of throwing for better UX
      return [];
    }
  }

  /**
   * Check if a talent is favorited by user
   */
  static async isTalentFavorited(userId: string, talentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('talent_id', talentId)
        .single();

      if (error) {
        // If table doesn't exist, return false
        if (error.code === '42P01' || error.message.includes('relation "user_favorites" does not exist')) {
          console.log('Favorites table not created yet');
          return false;
        }
        // PGRST116 = no rows returned (not favorited)
        if (error.code !== 'PGRST116') {
          console.error('Error checking favorite status:', error);
          throw error;
        }
      }

      return !!data;
    } catch (error) {
      console.error('Error in isTalentFavorited:', error);
      return false;
    }
  }

  /**
   * Add talent to favorites
   */
  static async addToFavorites(userId: string, talentId: string): Promise<UserFavorite> {
    try {
      console.log('🔄 [FavoritesService] addToFavorites called with:', { userId, talentId });

      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          talent_id: talentId
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [FavoritesService] Error adding to favorites:', error);
        console.error('❌ [FavoritesService] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // If table doesn't exist, provide a more helpful error message
        if (error.code === '42P01' || error.message.includes('relation "user_favorites" does not exist')) {
          throw new Error('Favorites table not found. Please contact support to enable favorites functionality.');
        }

        throw error;
      }

      console.log('✅ [FavoritesService] Successfully added to favorites:', data);
      return data;
    } catch (error) {
      console.error('❌ [FavoritesService] Error in addToFavorites:', error);
      throw error;
    }
  }

  /**
   * Remove talent from favorites
   */
  static async removeFromFavorites(userId: string, talentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('talent_id', talentId);

      if (error) {
        console.error('Error removing from favorites:', error);

        // If table doesn't exist, provide a more helpful error message
        if (error.code === '42P01' || error.message.includes('relation "user_favorites" does not exist')) {
          throw new Error('Favorites table not found. Please contact support to enable favorites functionality.');
        }

        throw error;
      }
    } catch (error) {
      console.error('Error in removeFromFavorites:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status (add if not favorited, remove if favorited)
   */
  static async toggleFavorite(userId: string, talentId: string): Promise<boolean> {
    try {
      console.log('🔄 [FavoritesService] toggleFavorite called with:', { userId, talentId });

      const isFavorited = await this.isTalentFavorited(userId, talentId);
      console.log('🔄 [FavoritesService] Current favorite status:', isFavorited);

      if (isFavorited) {
        console.log('🔄 [FavoritesService] Removing from favorites...');
        await this.removeFromFavorites(userId, talentId);
        console.log('✅ [FavoritesService] Removed from favorites');
        return false; // Now not favorited
      } else {
        console.log('🔄 [FavoritesService] Adding to favorites...');
        await this.addToFavorites(userId, talentId);
        console.log('✅ [FavoritesService] Added to favorites');
        return true; // Now favorited
      }
    } catch (error) {
      console.error('❌ [FavoritesService] Error in toggleFavorite:', error);
      throw error;
    }
  }

  /**
   * Get user's favorite count
   */
  static async getUserFavoriteCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting favorite count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUserFavoriteCount:', error);
      return 0;
    }
  }

  /**
   * Get talent's favorite count (how many users favorited this talent)
   */
  static async getTalentFavoriteCount(talentId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('talent_id', talentId);

      if (error) {
        console.error('Error getting talent favorite count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getTalentFavoriteCount:', error);
      return 0;
    }
  }

  /**
   * Create the user_favorites table if it doesn't exist
   * This is a fallback method for production environments
   */
  static async ensureFavoritesTableExists(): Promise<void> {
    try {
      // Try to create the table using a simple query
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_favorites (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL,
              talent_id UUID NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW(),
              UNIQUE(user_id, talent_id)
          );
          
          CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_favorites_talent_id ON user_favorites(talent_id);
        `
      });

      if (error) {
        console.log('Table creation via RPC failed, table might already exist:', error);
      }
    } catch (error) {
      console.log('Error ensuring favorites table exists:', error);
      // This is expected if the RPC function doesn't exist or table already exists
    }
  }
}
