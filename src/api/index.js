/* eslint-disable prettier/prettier */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const options = {
  localStorage: AsyncStorage,
};

export const supabase = createClient('https://tjqimbfiatynefyeiekw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzE2MzkwMiwiZXhwIjoxOTM4NzM5OTAyfQ.kXx3kuwhVDf7ttP8W_Imzm747C9L3Dc3bff8Wcst3UA', options);
