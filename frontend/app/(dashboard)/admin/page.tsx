'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Bell,
    Building2,
    Calendar,
    ChevronRight,
    Mail,
    MapPin,
    Phone,
    Plus,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react'

type Tab = "events" | "organizations"
type UserRole = "ORG_ADMIN" | "SITE_MANAGER" | "VIEWER"

interface Organization {
    id: string
    name: string
    createdAt: string
    sitesCount: number
    users: User[]
}

interface User {
    id: string
    name: string
    email: string
    phone?: string
    role: UserRole
    status: "active" | "pending"
    createdAt: string
}

interface Event {
    id: string
    type: "user_invited" | "user_joined" | "org_created" | "alert_triggered"
    description: string
    timestamp: string
    organization?: string
}

const mockEvents: Event[] = [
    {
        id: "1",
        type: "user_invited",
        description: "John Doe was invited to Green Farms LTD",
        timestamp: "2025-05-30 14:30",
        organization: "Green Farms LTD",
    },
    {
        id: "2",
        type: "alert_triggered",
        description: "High temperature alert in Cell 1A",
        timestamp: "2025-05-30 12:15",
        organization: "Green Farms LTD",
    },
    { id: "3", type: "org_created", description: "Midwest Grain Holdings was created", timestamp: "2025-05-29 09:00" },
    {
        id: "4",
        type: "user_joined",
        description: "Sarah Stone joined Desert Storage Corp",
        timestamp: "2025-05-28 16:45",
        organization: "Desert Storage Corp",
    },
]

const initialOrganizations: Organization[] = [
    {
        id: "1",
        name: "Green Farms LTD",
        createdAt: "2024-01-15",
        sitesCount: 3,
        users: [
            {
                id: "1",
                name: "Rotem Plotkin",
                email: "rotem@agriq.farm",
                phone: "+1-555-1234",
                role: "ORG_ADMIN",
                status: "active",
                createdAt: "2024-01-15",
            },
            {
                id: "2",
                name: "Amir Luski",
                email: "amir@agriq.farm",
                phone: "+1-555-5678",
                role: "SITE_MANAGER",
                status: "active",
                createdAt: "2024-02-10",
            },
        ],
    },
    {
        id: "2",
        name: "Desert Storage Corp",
        createdAt: "2024-02-20",
        sitesCount: 2,
        users: [
            {
                id: "3",
                name: "Sarah Stone",
                email: "sarah@desertcorp.com",
                role: "ORG_ADMIN",
                status: "active",
                createdAt: "2024-02-20",
            },
        ],
    },
    {
        id: "3",
        name: "Midwest Grain Holdings",
        createdAt: "2024-03-10",
        sitesCount: 5,
        users: [],
    },
    {
        id: "31",
        name: "Midwest Grain Holdings",
        createdAt: "2024-03-10",
        sitesCount: 5,
        users: [],
    },
    {
        id: "33",
        name: "Midwest Grain Holdings",
        createdAt: "2024-03-10",
        sitesCount: 5,
        users: [],
    },
    {
        id: "35",
        name: "Midwest Grain Holdings",
        createdAt: "2024-03-10",
        sitesCount: 5,
        users: [],
    },
    {
        id: "36",
        name: "Midwest Grain Holdings",
        createdAt: "2024-03-10",
        sitesCount: 5,
        users: [],
    },
    {
        id: "37",
        name: "Midwest Grain Holdings",
        createdAt: "2024-03-10",
        sitesCount: 5,
        users: [],
    },
    {
        id: "38",
        name: "Midwest Grain Holdings",
        createdAt: "2024-03-10",
        sitesCount: 5,
        users: [],
    },
]

const roleLabels: Record<UserRole, string> = {
    ORG_ADMIN: "Admin",
    SITE_MANAGER: "Site Manager",
    VIEWER: "Viewer",
}

const roleStyles: Record<UserRole, string> = {
    ORG_ADMIN: "bg-primary/10 text-primary border-primary/30",
    SITE_MANAGER: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    VIEWER: "bg-gray-500/10 text-gray-500 border-gray-500/30",
}

const eventTypeStyles = {
    user_invited: "bg-blue-500/10 text-blue-500",
    user_joined: "bg-emerald-500/10 text-emerald-500",
    org_created: "bg-purple-500/10 text-purple-500",
    alert_triggered: "bg-orange-500/10 text-orange-500",
}

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>("organizations")
    const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
    const [events] = useState<Event[]>(mockEvents)

    // Organization Modal State
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false)

    // Create Organization Modal State
    const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false)
    const [newOrgName, setNewOrgName] = useState("")

    // Delete Confirmation State
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null)

    // Invite User Modal State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [inviteData, setInviteData] = useState({ name: "", email: "", role: "VIEWER" as UserRole })

    // User Details Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)

    const handleCreateOrganization = () => {
        if (!newOrgName.trim()) return

        const newOrg: Organization = {
            id: Date.now().toString(),
            name: newOrgName,
            createdAt: new Date().toISOString().split("T")[0],
            sitesCount: 0,
            users: [],
        }

        setOrganizations([...organizations, newOrg])
        setNewOrgName("")
        setIsCreateOrgModalOpen(false)
    }

    const handleDeleteOrganization = () => {
        if (!orgToDelete) return
        setOrganizations(organizations.filter((org) => org.id !== orgToDelete.id))
        setOrgToDelete(null)
        setIsDeleteConfirmOpen(false)
        setIsOrgModalOpen(false)
        setSelectedOrg(null)
    }

    const handleInviteUser = () => {
        if (!selectedOrg || !inviteData.name.trim() || !inviteData.email.trim()) return

        const newUser: User = {
            id: Date.now().toString(),
            name: inviteData.name,
            email: inviteData.email,
            role: inviteData.role,
            status: "pending",
            createdAt: new Date().toISOString().split("T")[0],
        }

        setOrganizations(
            organizations.map((org) => (org.id === selectedOrg.id ? { ...org, users: [...org.users, newUser] } : org)),
        )

        setSelectedOrg({ ...selectedOrg, users: [...selectedOrg.users, newUser] })
        setInviteData({ name: "", email: "", role: "VIEWER" })
        setIsInviteModalOpen(false)
    }

    const openOrgModal = (org: Organization) => {
        setSelectedOrg(org)
        setIsOrgModalOpen(true)
    }

    const openDeleteConfirm = (org: Organization) => {
        setOrgToDelete(org)
        setIsDeleteConfirmOpen(true)
    }

    const openUserModal = (user: User) => {
        setSelectedUser(user)
        setIsUserModalOpen(true)
    }

    return (
        <div className="flex h-[calc(100vh-60px)]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-surface shrink-0 sticky top-[52px] self-start h-[calc(100vh-52px)] flex flex-col">
                <div className="p-6 border-b border-border">
                    <h1 className="text-xl font-semibold text-foreground">Admin</h1>
                    <p className="text-sm text-muted-foreground">Platform Management</p>
                </div>
                <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                    <button
                        onClick={() => setActiveTab("events")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === "events"
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <Bell className="w-5 h-5" />
                        Events
                    </button>
                    <button
                        onClick={() => setActiveTab("organizations")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === "organizations"
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <Building2 className="w-5 h-5" />
                        Organizations
                    </button>
                </nav>
                <div className="p-4 mt-auto">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">N</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {activeTab === "events" && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-foreground">Events</h2>
                            <p className="text-sm text-muted-foreground mt-1">Recent platform activity</p>
                        </div>

                        <div className="bg-card border border-border rounded-lg divide-y divide-border">
                            {events.map((event) => (
                                <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${eventTypeStyles[event.type]}`}
                                        >
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-foreground">{event.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-muted-foreground">{event.timestamp}</span>
                                                {event.organization && (
                                                    <>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-sm text-muted-foreground">{event.organization}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "organizations" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-foreground">Organizations</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {organizations.length} organization{organizations.length !== 1 ? "s" : ""} registered
                                </p>
                            </div>
                            <Button onClick={() => setIsCreateOrgModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Organization
                            </Button>
                        </div>

                        <div className="bg-card border border-border rounded-lg divide-y divide-border">
                            {organizations.map((org) => (
                                <div
                                    key={org.id}
                                    onClick={() => openOrgModal(org)}
                                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Building2 className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-foreground">{org.name}</h3>
                                                <p className="text-sm text-muted-foreground">Created {org.createdAt}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{org.sitesCount} sites</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Users className="w-4 h-4" />
                                                    <span>{org.users.length} users</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {organizations.length === 0 && (
                                <div className="p-12 text-center">
                                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="font-medium text-foreground mb-1">No organizations yet</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Get started by creating your first organization</p>
                                    <Button onClick={() => setIsCreateOrgModalOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Organization
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Create Organization Modal */}
            <Dialog open={isCreateOrgModalOpen} onOpenChange={setIsCreateOrgModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Organization</DialogTitle>
                        <DialogDescription>Add a new organization to the platform</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium text-foreground">Organization Name</label>
                        <Input
                            className="mt-2"
                            placeholder="Enter organization name"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOrgModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateOrganization} disabled={!newOrgName.trim()}>
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Organization Details Modal */}
            <Dialog open={isOrgModalOpen} onOpenChange={setIsOrgModalOpen}>
                <DialogContent className="max-w-2xl">
                    {selectedOrg && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <DialogTitle>{selectedOrg.name}</DialogTitle>
                                            <DialogDescription>Created {selectedOrg.createdAt}</DialogDescription>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="py-4 space-y-6">
                                {/* Stats */}
                                <div className="flex gap-4">
                                    <div className="flex-1 p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-sm">Sites</span>
                                        </div>
                                        <p className="text-2xl font-semibold text-foreground">{selectedOrg.sitesCount}</p>
                                    </div>
                                    <div className="flex-1 p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Users className="w-4 h-4" />
                                            <span className="text-sm">Users</span>
                                        </div>
                                        <p className="text-2xl font-semibold text-foreground">{selectedOrg.users.length}</p>
                                    </div>
                                </div>

                                {/* Users List */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-foreground">Users</h4>
                                        <Button size="sm" onClick={() => setIsInviteModalOpen(true)}>
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Invite User
                                        </Button>
                                    </div>

                                    {selectedOrg.users.length > 0 ? (
                                        <div className="border border-border rounded-lg divide-y divide-border">
                                            {selectedOrg.users.map((user) => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => openUserModal(user)}
                                                    className="p-3 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                              </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {user.status === "pending" && (
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                                                            >
                                                                Pending
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className={roleStyles[user.role]}>
                                                            {roleLabels[user.role]}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center border border-border rounded-lg border-dashed">
                                            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">No users yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="border-t border-border pt-4">
                                <Button variant="destructive" onClick={() => openDeleteConfirm(selectedOrg)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Organization
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Organization</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{orgToDelete?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteOrganization}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invite User Modal */}
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite User</DialogTitle>
                        <DialogDescription>Send an invitation to join {selectedOrg?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Full Name</label>
                            <Input
                                className="mt-2"
                                placeholder="Enter full name"
                                value={inviteData.name}
                                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Email Address</label>
                            <Input
                                className="mt-2"
                                type="email"
                                placeholder="user@example.com"
                                value={inviteData.email}
                                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Role</label>
                            <Select
                                value={inviteData.role}
                                onValueChange={(v) => setInviteData({ ...inviteData, role: v as UserRole })}
                            >
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ORG_ADMIN">Admin</SelectItem>
                                    <SelectItem value="SITE_MANAGER">Site Manager</SelectItem>
                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleInviteUser} disabled={!inviteData.name.trim() || !inviteData.email.trim()}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Invite
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Details Modal */}
            <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                <DialogContent>
                    {selectedUser && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {selectedUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                    </span>
                                    </div>
                                    <div>
                                        <DialogTitle>{selectedUser.name}</DialogTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            {selectedUser.status === "pending" && (
                                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                                                    Pending
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className={roleStyles[selectedUser.role]}>
                                                {roleLabels[selectedUser.role]}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm text-foreground">{selectedUser.email}</p>
                                    </div>
                                </div>

                                {selectedUser.phone && (
                                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                        <Phone className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Phone</p>
                                            <p className="text-sm text-foreground">{selectedUser.phone}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Joined</p>
                                        <p className="text-sm text-foreground">{selectedUser.createdAt}</p>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
