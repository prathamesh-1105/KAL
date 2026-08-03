const SUPABASE_URL = 'https://pzojjwjvzqlkhymackhr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_881Zovjrl1eIuBUJtBZq6A_58e8nwus';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Override localStorage.setItem to sync with Supabase
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);
  if (key.startsWith('kb_')) {
    // Asynchronously update Supabase
    supabaseClient.from('kv_store')
      .upsert({ id: key, value: JSON.parse(value) })
      .then(({error}) => { if (error) console.error('Supabase Sync Error:', error); });
  }
};

async function syncFromSupabase() {
  try {
    const { data, error } = await supabaseClient.from('kv_store').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      data.forEach(row => {
        originalSetItem.call(localStorage, row.id, JSON.stringify(row.value));
      });
    }
  } catch (err) {
    console.error('Failed to sync from Supabase, falling back to local cache.', err);
  }
}
