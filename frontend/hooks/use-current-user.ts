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

    const userRole = useMemo(() => {
        if (!user) return null
        const roles = user.roles ?? []

        if (user.userRole && Object.values(RoleTypeEnum).includes(user.userRole as RoleTypeEnum)) {
            return user.userRole as RoleTypeEnum
        }

        if (roles.find(role => role.role === RoleTypeEnum.SUPER_ADMIN)) {
            return RoleTypeEnum.SUPER_ADMIN
        }
        if (roles.find(role => role.role === RoleTypeEnum.ADMIN)) {
            return RoleTypeEnum.ADMIN
        }
        if (roles.find(role => role.role === RoleTypeEnum.OPERATOR)) {
            return RoleTypeEnum.OPERATOR
        }

        return null
    }, [user])

    return {
        user,
        isLoading: status === 'loading',
        userRole,
        isSuperAdmin: userRole === RoleTypeEnum.SUPER_ADMIN,
        isAdmin: userRole === RoleTypeEnum.ADMIN,
        isOperator: userRole === RoleTypeEnum.OPERATOR,
    }
}
