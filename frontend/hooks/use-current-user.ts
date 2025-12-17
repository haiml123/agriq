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

    return {
        user,
        isLoading: status === 'loading',
        isSuperAdmin: user?.userRole === RoleTypeEnum.SUPER_ADMIN,
        isAdmin: user?.userRole === RoleTypeEnum.ADMIN,
        isOperator: user?.userRole === RoleTypeEnum.OPERATOR,
    }
}
