import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://okwcciujnfvobbwaydiv.supabase.co";
const SUPABASE_KEY = "sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listKeys() {
    const { data, error } = await supabase
        .from('system_data')
        .select('key, updated_at')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching keys:', error);
        return;
    }

    console.log('Current keys in system_data:');
    data.forEach(item => {
        console.log(`- ${item.key} (Updated: ${item.updated_at})`);
    });
}

listKeys();
