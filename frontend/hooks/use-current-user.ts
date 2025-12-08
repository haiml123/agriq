'use client'

import { useSession } from 'next-auth/react'
import { RoleTypeEnum, User } from '@/schemas/user.schema'
import { useMemo } from 'react'

export function useCurrentUser() {
    const { data: session, status } = useSession()
    const user = useMemo(() => {
        if (status !== 'authenticated' || !session?.user) {
            return null
        }

        return session.user as unknown as User
    }, [session?.user, status])

    return {
        user,
        isLoading: status === 'loading',
        isSuperAdmin: user?.roles.find(role => role.role === RoleTypeEnum.SUPER_ADMIN),
        isAdmin: user?.roles.find(role => role.role === RoleTypeEnum.ORG_ADMIN),
        isOperator: user?.roles.find(role => role.role === RoleTypeEnum.OPERATOR),
    }
}