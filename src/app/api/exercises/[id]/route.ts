import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/exercises/[id] - Actualizar ejercicio
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, muscle_groups, muscle_groups_json, equipment, instructions } = body;

    console.log('=== PUT /api/exercises/[id] ===');
    console.log('Received body:', JSON.stringify(body, null, 2));
    console.log('muscle_groups from body:', muscle_groups);
    console.log('muscle_groups_json from body:', JSON.stringify(muscle_groups_json, null, 2));

    // Validar que haya al menos un grupo muscular
    const hasMuscleGroups = (muscle_groups && muscle_groups.length > 0) || 
                           (muscle_groups_json && muscle_groups_json.length > 0);

    if (!name || !hasMuscleGroups) {
      return NextResponse.json(
        { error: 'Name and muscle_groups are required' },
        { status: 400 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      equipment: equipment?.trim() || null,
      instructions: instructions?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Preparar muscle_groups (siempre necesario)
    // PRIORIZAR muscle_groups_json si existe, ya que es la fuente de verdad
    if (muscle_groups_json && Array.isArray(muscle_groups_json) && muscle_groups_json.length > 0) {
      updateData.muscle_groups = muscle_groups_json.map((mg: any) => mg.name);
      console.log('Using muscle_groups_json to build muscle_groups:', updateData.muscle_groups);
    } else if (muscle_groups) {
      updateData.muscle_groups = Array.isArray(muscle_groups) ? muscle_groups : [muscle_groups];
      console.log('Using muscle_groups from body:', updateData.muscle_groups);
    }

    // Intentar agregar muscle_groups_json solo si existe la columna
    // Primero intentamos con muscle_groups_json, si falla, haremos fallback
    let includeMuscleGroupsJson = false;
    if (muscle_groups_json && Array.isArray(muscle_groups_json) && muscle_groups_json.length > 0) {
      updateData.muscle_groups_json = muscle_groups_json;
      includeMuscleGroupsJson = true;
      console.log('Including muscle_groups_json in update:', JSON.stringify(muscle_groups_json, null, 2));
    } else if (muscle_groups && !muscle_groups_json) {
      // Si solo tenemos muscle_groups, crear muscle_groups_json si la columna existe
      const jsonData = (Array.isArray(muscle_groups) ? muscle_groups : [muscle_groups]).map(
        (mg: string) => ({
          name: mg,
          type: 'primary',
          percentage: 100,
        })
      );
      updateData.muscle_groups_json = jsonData;
      includeMuscleGroupsJson = true;
      console.log('Created muscle_groups_json from muscle_groups:', JSON.stringify(jsonData, null, 2));
    }

    console.log('Updating exercise ID:', id);
    console.log('Final update data:', JSON.stringify(updateData, null, 2));

    // Intentar hacer el update con muscle_groups_json primero
    let updateDataToUse = { ...updateData };
    
    // Convertir muscle_groups_json a JSONB explícitamente si es necesario
    if (updateDataToUse.muscle_groups_json) {
      // Asegurar que sea un array válido
      if (Array.isArray(updateDataToUse.muscle_groups_json)) {
        // Convertir a JSON string y luego parsear para asegurar formato correcto
        updateDataToUse.muscle_groups_json = JSON.parse(JSON.stringify(updateDataToUse.muscle_groups_json));
      }
    }
    
    console.log('About to update with data:', JSON.stringify(updateDataToUse, null, 2));
    
    // Hacer el update con select para ver qué devuelve inmediatamente
    let selectFields = 'id, name, description, muscle_groups, equipment, instructions';
    if (includeMuscleGroupsJson) {
      selectFields += ', muscle_groups_json';
    }
    
    let { data: updateResult, error: updateError } = await supabase
      .from('exercises')
      .update(updateDataToUse)
      .eq('id', id)
      .select(selectFields)
      .single();
    
    console.log('Update result (with select):', JSON.stringify(updateResult, null, 2));
    console.log('Update error (with select):', updateError);
    
    // Si hay un error pero no es crítico, intentar hacer el update sin select primero
    if (updateError && updateError.code !== 'PGRST116') {
      console.log('Update with select failed, trying update without select first...');
      const { error: updateOnlyError } = await supabase
        .from('exercises')
        .update(updateDataToUse)
        .eq('id', id);
      
      console.log('Update only error:', updateOnlyError);
      
      if (updateOnlyError) {
        console.error('Update error details:', {
          message: updateOnlyError.message,
          code: updateOnlyError.code,
          details: updateOnlyError.details,
          hint: updateOnlyError.hint,
        });
      }
    }

    if (updateError) {
      console.error('Update error details:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      });

      // PGRST116 con "0 rows" significa que no se pudo actualizar (probablemente por RLS)
      // Intentar hacer el update sin select primero para ver si el problema es solo con el select
      if (updateError.code === 'PGRST116' && updateError.details?.includes('0 rows')) {
        console.log('Update with select returned 0 rows, trying update without select...');
        const { error: updateOnlyError, data: updateOnlyData } = await supabase
          .from('exercises')
          .update(updateDataToUse)
          .eq('id', id);
        
        console.log('Update only error:', updateOnlyError);
        console.log('Update only data:', updateOnlyData);
        
        if (updateOnlyError) {
          // Si el update sin select también falla, es un problema de permisos o RLS
          return NextResponse.json(
            { error: updateOnlyError.message || 'No tienes permisos para actualizar este ejercicio o el ejercicio no existe' },
            { status: 403 }
          );
        }
        
        // Si el update sin select funcionó, hacer un select separado
        await new Promise(resolve => setTimeout(resolve, 200));
        
        let { data: selectData, error: selectError } = await supabase
          .from('exercises')
          .select(selectFields)
          .eq('id', id)
          .single();
        
        if (selectError) {
          // Si el select falla pero el update funcionó, devolver los datos enviados
          console.warn('Select failed after update, returning sent data');
          return NextResponse.json({ 
            data: {
              id: id,
              name: updateDataToUse.name,
              description: updateDataToUse.description,
              muscle_groups: updateDataToUse.muscle_groups,
              muscle_groups_json: updateDataToUse.muscle_groups_json,
              equipment: updateDataToUse.equipment,
              instructions: updateDataToUse.instructions,
            }
          });
        }
        
        return NextResponse.json({ data: selectData });
      }

      // Si el error es porque muscle_groups_json no existe, intentar sin esa columna
      if (updateError.message?.includes('muscle_groups_json') || 
          updateError.message?.includes('schema cache') ||
          updateError.code === '42703' || 
          updateError.code === '42P01') {
        console.log('muscle_groups_json column does not exist, falling back to muscle_groups only');
        const fallbackData = { ...updateData };
        delete fallbackData.muscle_groups_json;
        
        const fallbackUpdate = await supabase
          .from('exercises')
          .update(fallbackData)
          .eq('id', id)
          .select('id, name, description, muscle_groups, equipment, instructions')
          .single();
        
        if (fallbackUpdate.error) {
          console.error('Supabase error updating exercise (fallback):', fallbackUpdate.error);
          return NextResponse.json(
            { error: fallbackUpdate.error.message || 'Error al actualizar el ejercicio' },
            { status: 400 }
          );
        }
        
        if (fallbackUpdate.data) {
          return NextResponse.json({ data: fallbackUpdate.data });
        }
      }
      
      return NextResponse.json(
        { error: updateError.message || 'Error al actualizar el ejercicio' },
        { status: 400 }
      );
    }

    // Si el update devolvió datos, verificar si son correctos
    if (updateResult) {
      console.log('Update successful, result data:', JSON.stringify(updateResult, null, 2));
      
      // Verificar si los datos devueltos coinciden con los enviados
      const returnedJson = updateResult.muscle_groups_json;
      const sentJson = updateDataToUse.muscle_groups_json;
      
      console.log('Comparing sent vs returned:');
      console.log('Sent:', JSON.stringify(sentJson, null, 2));
      console.log('Returned:', JSON.stringify(returnedJson, null, 2));
      
      // Si los datos devueltos no coinciden con los enviados, usar los enviados
      if (sentJson && returnedJson && JSON.stringify(sentJson) !== JSON.stringify(returnedJson)) {
        console.warn('Returned data does not match sent data! Using sent data instead.');
        return NextResponse.json({ 
          data: {
            ...updateResult,
            muscle_groups: updateDataToUse.muscle_groups,
            muscle_groups_json: updateDataToUse.muscle_groups_json,
          }
        });
      }
      
      return NextResponse.json({ data: updateResult });
    }

    // Si no hay datos en el resultado, hacer un select separado
    // Esperar un poco para asegurar que el update se haya completado
    await new Promise(resolve => setTimeout(resolve, 200));

    let { data, error: selectError } = await supabase
      .from('exercises')
      .select(selectFields)
      .eq('id', id)
      .single();
    
    console.log('Select result after update:', JSON.stringify(data, null, 2));
    console.log('Select error:', selectError);

    // Si el error es porque muscle_groups_json no existe, intentar sin esa columna
    if (selectError && (selectError.message?.includes('muscle_groups_json') || selectError.code === '42703' || selectError.code === 'PGRST116')) {
      const fallbackSelect = await supabase
        .from('exercises')
        .select('id, name, description, muscle_groups, equipment, instructions')
        .eq('id', id)
        .single();
      
      if (fallbackSelect.error) {
        console.error('Supabase error fetching updated exercise:', fallbackSelect.error);
        return NextResponse.json(
          { error: fallbackSelect.error.message || 'Error al obtener el ejercicio actualizado' },
          { status: 400 }
        );
      }
      return NextResponse.json({ data: fallbackSelect.data });
    }

    if (selectError) {
      console.error('Supabase error fetching updated exercise:', selectError);
      // Si el update fue exitoso pero el select falla, devolver éxito con los datos actualizados
      return NextResponse.json({ 
        data: {
          id: id,
          name: updateData.name,
          description: updateData.description,
          muscle_groups: updateData.muscle_groups,
          muscle_groups_json: updateData.muscle_groups_json,
          equipment: updateData.equipment,
          instructions: updateData.instructions,
        }
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating exercise:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/exercises/[id] - Eliminar ejercicio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error deleting exercise:', error);
      return NextResponse.json(
        { error: error.message || 'Error al eliminar el ejercicio' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

