
import { supabase } from "./client";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Retrieves item coordinates from the database.
 */
export const getItemCoordinates = async (itemId: string): Promise<Coordinates | null> => {
  try {
    // Get lat/lng directly from the items table
    const { data, error } = await supabase
      .from('items')
      .select('location_lat, location_lng')
      .eq('id', itemId)
      .single();

    if (error) {
      console.log("Error fetching item coordinates:", error.message);
      return null;
    }

    if (data && data.location_lat != null && data.location_lng != null) {
      return {
        latitude: data.location_lat,
        longitude: data.location_lng,
      };
    }

    // No coordinates set for this item.
    return null;
  } catch (error) {
    console.error("Error getting item coordinates:", error);
    return null;
  }
};
