import { useState, useEffect, useCallback, startTransition } from 'react'
import { supabase } from '../../../supabase'

export function usePlantes() {
  const [plantes, setPlantes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('arrose_plantes').select('*').order('created_at')
    startTransition(() => {
      setPlantes(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    load()
    const sub = supabase.channel('arrose_plantes_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arrose_plantes' }, load)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [load])

  const addPlante = async (payload) => {
    const { data } = await supabase.from('arrose_plantes').insert(payload).select().single()
    return data
  }

  const updatePlante = async (id, payload) => {
    await supabase.from('arrose_plantes').update(payload).eq('id', id)
  }

  const deletePlante = async (id) => {
    await supabase.from('arrose_plantes').delete().eq('id', id)
  }

  return { plantes, loading, addPlante, updatePlante, deletePlante, reload: load }
}
