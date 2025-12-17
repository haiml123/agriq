'use client'

import { useSession } from 'next-auth/react'
import { User } from '@/schemas/user.schema'
import { useMemo } from 'react'
import { RoleTypeEnum } from '@/schemas/common.schema'

export function useCurrentUser() {
    const { data: session, status } = useSession()
    const user = useMemo(() => {
        if (status !== 'authenticated' || !session?.user) {
            return null
        }

        return session.user as unknown as User
    }, [session?.user, status])

    const userRole = user?.userRole

    return {
        user,
        isLoading: status === 'loading',
        isSuperAdmin: userRole === RoleTypeEnum.SUPER_ADMIN,
        isAdmin: userRole === RoleTypeEnum.ADMIN,
        isOperator: userRole === RoleTypeEnum.OPERATOR,
    }
}
