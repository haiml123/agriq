import { Bell } from 'lucide-react'

interface Event {
    id: string
    type: "user_invited" | "user_joined" | "org_created" | "alert_triggered"
    description: string
    timestamp: string
    organization?: string
}

interface EventsTabProps {
    events: Event[]
}

const eventTypeStyles = {
    user_invited: "bg-blue-500/10 text-blue-500",
    user_joined: "bg-emerald-500/10 text-emerald-500",
    org_created: "bg-purple-500/10 text-purple-500",
    alert_triggered: "bg-orange-500/10 text-orange-500",
}

export function EventsTab({ events }: EventsTabProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-foreground">Events</h2>
                <p className="text-sm text-muted-foreground mt-1">Recent platform activity</p>
            </div>

            <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {events.map((event) => (
                    <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${eventTypeStyles[event.type]}`}>
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
    )
}
