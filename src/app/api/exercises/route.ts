import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/exercises - Obtener ejercicios del catálogo
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const muscleGroup = searchParams.get('muscleGroup');

    // Intentar primero con muscle_groups_json (nueva estructura)
    let query = supabase
      .from('exercises')
      .select('id, name, description, muscle_groups, muscle_groups_json, equipment')
      .order('name', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (muscleGroup) {
      query = query.contains('muscle_groups', [muscleGroup]);
    }

    const { data, error } = await query;

    // Si el error es porque muscle_groups_json no existe, intentar sin esa columna
    if (error && (error.message?.includes('muscle_groups_json') || error.code === '42703' || error.code === 'PGRST116')) {
      const fallbackQuery = supabase
        .from('exercises')
        .select('id, name, description, muscle_groups, equipment')
        .order('name', { ascending: true });
      
      if (search) {
        fallbackQuery.ilike('name', `%${search}%`);
      }
      
      if (muscleGroup) {
        fallbackQuery.contains('muscle_groups', [muscleGroup]);
      }
      
      const fallbackResult = await fallbackQuery;
      if (fallbackResult.error) throw fallbackResult.error;
      return NextResponse.json({ data: fallbackResult.data || [] });
    }

    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/exercises - Crear nuevo ejercicio en el catálogo
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar y crear perfil si no existe (necesario para la política RLS)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Intentar crear el perfil si no existe
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return NextResponse.json(
          { error: 'Error al verificar el perfil de usuario. Por favor, contacta al soporte.' },
          { status: 500 }
        );
      }
    }

    const body = await request.json();
    const { name, description, muscle_groups, muscle_groups_json, equipment, instructions } = body;

    // Validar que haya al menos un grupo muscular
    const hasMuscleGroups = (muscle_groups && muscle_groups.length > 0) || 
                           (muscle_groups_json && muscle_groups_json.length > 0);

    if (!name || !hasMuscleGroups) {
      return NextResponse.json(
        { error: 'Name and muscle_groups are required' },
        { status: 400 }
      );
    }

    // Preparar datos para insertar
    const insertData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      equipment: equipment?.trim() || null,
      instructions: instructions?.trim() || null,
      created_by: user.id, // Asignar el ejercicio al usuario que lo crea
    };

    // Si hay muscle_groups_json, usarlo (nueva estructura)
    if (muscle_groups_json && Array.isArray(muscle_groups_json) && muscle_groups_json.length > 0) {
      // También mantener compatibilidad con muscle_groups (array de strings)
      insertData.muscle_groups = muscle_groups_json.map((mg: any) => mg.name);
      // Intentar agregar muscle_groups_json (puede fallar si la columna no existe)
      insertData.muscle_groups_json = muscle_groups_json;
    } else if (muscle_groups) {
      // Si solo hay muscle_groups (formato antiguo), mantenerlo
      insertData.muscle_groups = Array.isArray(muscle_groups) ? muscle_groups : [muscle_groups];
      // Intentar convertir a formato JSONB si existe la columna
      insertData.muscle_groups_json = (Array.isArray(muscle_groups) ? muscle_groups : [muscle_groups]).map(
        (mg: string) => ({
          name: mg,
          type: 'primary',
          percentage: 100,
        })
      );
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert(insertData)
      .select()
      .single();

    // Si el error es porque muscle_groups_json no existe, intentar sin esa columna
    if (error && (error.message?.includes('muscle_groups_json') || error.code === '42703' || error.code === 'PGRST116')) {
      // Remover muscle_groups_json del insertData y reintentar
      const fallbackData = { ...insertData };
      delete fallbackData.muscle_groups_json;
      // Asegurar que created_by esté presente
      fallbackData.created_by = user.id;
      
      const fallbackResult = await supabase
        .from('exercises')
        .insert(fallbackData)
        .select()
        .single();
      
      if (fallbackResult.error) {
        console.error('Supabase error creating exercise:', fallbackResult.error);
        return NextResponse.json(
          { error: fallbackResult.error.message || 'Error al crear el ejercicio' },
          { status: 400 }
        );
      }
      return NextResponse.json({ data: fallbackResult.data }, { status: 201 });
    }

    if (error) {
      console.error('Supabase error creating exercise:', error);
      return NextResponse.json(
        { error: error.message || 'Error al crear el ejercicio' },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating exercise:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

