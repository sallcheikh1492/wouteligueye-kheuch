import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { addSkill, deleteSkill, fetchSkills } from '@/services/skills'
import type { TablesInsert } from '@/types/database'

export function useSkills() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['skills', user?.id],
    queryFn: () => fetchSkills(user!.id),
    enabled: !!user,
  })
}

export function useAddSkill() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<TablesInsert<'skills'>, 'user_id'>) => addSkill({ ...input, user_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills', user?.id] })
    },
  })
}

export function useDeleteSkill() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills', user?.id] })
    },
  })
}
