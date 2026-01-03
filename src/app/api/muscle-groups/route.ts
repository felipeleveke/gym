import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/muscle-groups - Obtener todos los grupos musculares
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('muscle_groups')
      .select('name, category')
      .order('category', { ascending: false }) // Para que aparezcan en un orden lógico o al menos agrupados
      .order('name', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ data: [] });
      }
      throw error;
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching muscle groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/muscle-groups - Agregar un nuevo grupo muscular
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, category } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!category || !['Tren Superior', 'Tren Inferior', 'Zona Media'].includes(category)) {
      return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('muscle_groups')
      .insert({ name, category })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ data: { name, category } }, { status: 200 });
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating muscle group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
