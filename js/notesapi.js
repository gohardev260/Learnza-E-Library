// Learnza 2.0 - Notes API
import { supabase, handleSupabaseError } from './supabaseclient.js';
import { CONFIG } from './config.js';

// List notes with filtering and pagination
export async function listNotes(params = {}) {
    try {
        const {
            q = '',
            tags = [],
            category = '',
            page = 1,
            pageSize = CONFIG.PAGE_SIZE,
            sortBy = 'created_at'
        } = params;

        let query = supabase
            .from(CONFIG.TABLE_NAME)
            .select('*', { count: 'exact' })
            .eq('published', true);

        // Search filter
        if (q) {
            query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,class.ilike.%${q}%`);
        }

        // Category filter
        if (category) {
            query = query.eq('class', category);
        }

        // Tags filter (array overlap)
        if (tags && tags.length > 0) {
            query = query.overlaps('tags', tags);
        }

        // Sorting
        const orderCol = sortBy === 'title' ? 'title' : sortBy === 'downloads' ? 'downloads' : sortBy === 'views' ? 'views' : 'created_at';
        const ascending = sortBy === 'title';
        query = query.order(orderCol, { ascending });

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        return { data: data || [], count: count || 0 };
    } catch (error) {
        console.error('Error listing notes:', error);
        throw new Error(handleSupabaseError(error, 'listing notes'));
    }
}

// Get single note by ID
export async function getNote(id) {
    try {
        if (!id) throw new Error('Note ID is required');

        const { data, error } = await supabase
            .from(CONFIG.TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error getting note:', error);
        throw new Error(handleSupabaseError(error, 'getting note'));
    }
}

// Increment view count
export async function incrementViews(id) {
    try {
        if (!id) return false;

        const { error } = await supabase.rpc('inc_views', { note_id: id });

        if (error) {
            // Fallback
            const { data: note } = await supabase
                .from(CONFIG.TABLE_NAME)
                .select('views')
                .eq('id', id)
                .single();

            if (note) {
                await supabase
                    .from(CONFIG.TABLE_NAME)
                    .update({ views: (note.views || 0) + 1 })
                    .eq('id', id);
            }
        }

        return true;
    } catch (error) {
        console.error('Error incrementing views:', error);
        return false;
    }
}

// Increment download count
export async function incrementDownloads(id) {
    try {
        if (!id) return false;

        const { error } = await supabase.rpc('inc_downloads', { note_id: id });

        if (error) {
            // Fallback
            const { data: note } = await supabase
                .from(CONFIG.TABLE_NAME)
                .select('downloads')
                .eq('id', id)
                .single();

            if (note) {
                await supabase
                    .from(CONFIG.TABLE_NAME)
                    .update({ downloads: (note.downloads || 0) + 1 })
                    .eq('id', id);
            }
        }

        return true;
    } catch (error) {
        console.error('Error incrementing downloads:', error);
        return false;
    }
}

// === ADMIN FUNCTIONS ===

// List notes for admin (no published filter)
export async function adminListNotes(params = {}) {
    try {
        const {
            q = '',
            published = '',
            page = 1,
            pageSize = CONFIG.PAGE_SIZE
        } = params;

        let query = supabase
            .from(CONFIG.TABLE_NAME)
            .select('*', { count: 'exact' });

        // Search
        if (q) {
            query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,class.ilike.%${q}%`);
        }

        // Published filter
        if (published === 'true') {
            query = query.eq('published', true);
        } else if (published === 'false') {
            query = query.eq('published', false);
        }

        // Sort by updated_at
        query = query.order('updated_at', { ascending: false });

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        return { data: data || [], count: count || 0 };
    } catch (error) {
        console.error('Error listing notes (admin):', error);
        throw new Error(handleSupabaseError(error, 'listing notes'));
    }
}

// Create note
export async function createNote(payload) {
    try {
        if (!payload || !payload.title) {
            throw new Error('Title is required');
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const noteData = {
            title: payload.title.trim(),
            class: payload.category?.trim() || null,
            tags: Array.isArray(payload.tags) ? payload.tags : [],
            file_url: payload.fileUrl?.trim() || null,
            description: payload.description?.trim() || null,
            published: Boolean(payload.published),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            views: 0,
            downloads: 0,
            created_by: user.id,
            author: user.user_metadata?.full_name || user.email || 'Admin',
            content_type: 'document',
            language: 'en'
        };

        const { data, error } = await supabase
            .from(CONFIG.TABLE_NAME)
            .insert(noteData)
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error creating note:', error);
        throw new Error(handleSupabaseError(error, 'creating note'));
    }
}

// Update note
export async function updateNote(id, payload) {
    try {
        if (!id) throw new Error('Note ID is required');
        if (!payload || !payload.title) throw new Error('Title is required');

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        const noteData = {
            title: payload.title.trim(),
            class: payload.category?.trim() || null,
            tags: Array.isArray(payload.tags) ? payload.tags : [],
            file_url: payload.fileUrl?.trim() || null,
            description: payload.description?.trim() || null,
            published: Boolean(payload.published),
            updated_at: new Date().toISOString(),
            author: user.user_metadata?.full_name || user.email || 'Admin'
        };

        const { data, error } = await supabase
            .from(CONFIG.TABLE_NAME)
            .update(noteData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error updating note:', error);
        throw new Error(handleSupabaseError(error, 'updating note'));
    }
}

// Delete note
export async function deleteNote(id) {
    try {
        if (!id) throw new Error('Note ID is required');

        const { error } = await supabase
            .from(CONFIG.TABLE_NAME)
            .delete()
            .eq('id', id);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error deleting note:', error);
        throw new Error(handleSupabaseError(error, 'deleting note'));
    }
}

// Get stats
export async function getStats() {
    try {
        // Try RPC first
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_note_stats');

        if (!rpcError && rpcData) {
            // RPC returns an array with one object, extract it
            const stats = Array.isArray(rpcData) ? rpcData[0] : rpcData;
            return stats;
        }


        // Fallback: Manual counting
        try {
            // Count total notes
            const { count: total, error: totalError } = await supabase
                .from(CONFIG.TABLE_NAME)
                .select('*', { count: 'exact', head: true });

            if (totalError) {
                console.error('Error counting total notes:', totalError);
                throw totalError;
            }

            // Count published notes
            const { count: published, error: publishedError } = await supabase
                .from(CONFIG.TABLE_NAME)
                .select('*', { count: 'exact', head: true })
                .eq('published', true);

            if (publishedError) {
                console.error('Error counting published notes:', publishedError);
                throw publishedError;
            }

            // Sum all downloads
            const { data: notesData, error: downloadsError } = await supabase
                .from(CONFIG.TABLE_NAME)
                .select('downloads');

            if (downloadsError) {
                console.error('Error fetching downloads:', downloadsError);
                throw downloadsError;
            }

            const totalDownloads = (notesData || []).reduce((sum, n) => sum + (n.downloads || 0), 0);

            const stats = {
                total_notes: total || 0,
                published_notes: published || 0,
                total_downloads: totalDownloads
            };

            return stats;

        } catch (fallbackError) {
            console.error('Fallback stats calculation failed:', fallbackError);
            throw fallbackError;
        }

    } catch (error) {
        console.error('Critical error in getStats:', error);
        // Return zeros as last resort
        return { total_notes: 0, published_notes: 0, total_downloads: 0 };
    }
}

// Get unique categories
export async function getCategories() {
    try {
        const { data, error } = await supabase
            .from(CONFIG.TABLE_NAME)
            .select('class')
            .eq('published', true)
            .not('class', 'is', null);

        if (error) throw error;

        const categories = [...new Set(data.map(n => n.class))].filter(Boolean).sort();
        return categories;
    } catch (error) {
        console.error('Error getting categories:', error);
        return [];
    }
}
